/**
 * TrackingLifecycleManager.ts - Worker App: live GPS broadcasting for ONE booking while the partner travels.
 *
 *  - Foreground watcher + Android foreground-service background task (expo-location / expo-task-manager).
 *  - Adaptive cadence (trackingPolicy.uploadIntervalMs): 2-12 s depending on speed and distance to the customer.
 *  - Offline: keeps only the newest unsent fix and retries with exponential backoff (2 s -> 30 s).
 *  - Server answers drive the loop: 401 -> sign in again; 403/409/410 -> tracking is over (arrived / not assigned /
 *    cancelled); 422 -> that one fix was rejected; 429/5xx/network -> retry.
 *  - Permission denied / GPS switched off are reported to the server (device-status), so the customer sees why.
 *  - The active booking is persisted, so a background fix delivered after the OS restarted the JS runtime is still
 *    attributed to the right booking.
 *
 * Identity is the partner's signed JWT only (see workerApiService.signedToken).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import workerApiService from '../api/workerApiService';
import { apiClient } from '../api/client';
import { storageService } from './storageService';
import {
  LatestFixBuffer,
  classifyUploadResponse,
  distanceMeters,
  headingDelta,
  nextBackoffMs,
  shouldUpload,
  uploadIntervalMs,
  type PendingFix,
  type UploadOutcome,
} from './trackingPolicy';

export const BACKGROUND_TRACKING_TASK = 'HOMEEASE_WORKER_BACKGROUND_LOCATION';
const ACTIVE_BOOKING_KEY = '@homeease/live-tracking/active-booking';

export interface WorkerLocationFrame {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
  locality?: string;
  city?: string;
}

export type TrackingState =
  | 'IDLE'
  | 'STARTING'
  | 'LIVE'
  | 'RETRYING'
  | 'PERMISSION_DENIED'
  | 'GPS_DISABLED'
  | 'AUTH_REQUIRED'
  | 'ENDED';

export interface TrackingStatus {
  state: TrackingState;
  bookingId: string | null;
  lastFixAt: number | null;
  lastUploadAt: number | null;
  backgroundEnabled: boolean;
  message?: string;
}

type Destination = { lat?: number; lng?: number; latitude?: number; longitude?: number };

class WorkerTrackingLifecycleManager {
  private static instance: WorkerTrackingLifecycleManager;

  private activeBookingId: string | null = null;
  private destination: { lat: number; lng: number } | null = null;
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private gpsWatchdog: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;
  private uploading = false;
  private readonly buffer = new LatestFixBuffer();
  private lastSent: PendingFix | null = null;
  private lastSentAt: number | null = null;
  private onLocationCallback: ((loc: WorkerLocationFrame) => void) | null = null;
  private readonly statusListeners = new Set<(s: TrackingStatus) => void>();
  private status: TrackingStatus = {
    state: 'IDLE',
    bookingId: null,
    lastFixAt: null,
    lastUploadAt: null,
    backgroundEnabled: false,
  };

  private constructor() {}

  public static getInstance(): WorkerTrackingLifecycleManager {
    if (!WorkerTrackingLifecycleManager.instance) {
      WorkerTrackingLifecycleManager.instance = new WorkerTrackingLifecycleManager();
    }
    return WorkerTrackingLifecycleManager.instance;
  }

  // ───────────────────────── status ─────────────────────────

  public getStatus(): TrackingStatus {
    return this.status;
  }

  /** Subscribe to tracking status changes (LIVE / RETRYING / PERMISSION_DENIED / ...). Returns an unsubscribe fn. */
  public subscribeStatus(listener: (s: TrackingStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(patch: Partial<TrackingStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => {
      try {
        l(this.status);
      } catch {
        // a broken listener must not break tracking
      }
    });
  }

  public isTrackingActive(bookingId?: string): boolean {
    // Failed GPS permission / disabled hardware means there is NO watcher to reuse.
    // Allow a clean retry after the partner grants permissions or enables location services.
    const active = this.activeBookingId !== null &&
      !(['ENDED', 'IDLE', 'PERMISSION_DENIED', 'GPS_DISABLED', 'AUTH_REQUIRED'] as string[]).includes(this.status.state);
    return bookingId ? active && this.activeBookingId === bookingId : active;
  }

  public getActiveBookingId(): string | null {
    return this.activeBookingId;
  }

  // ───────────────────────── start / stop ─────────────────────────

  /**
   * Starts broadcasting for `bookingId`. Resolves with the resulting status; it never pretends: if permission is
   * denied or GPS is off the status says so (and the server is told) instead of reporting success.
   */
  public async startTravelTracking(
    bookingId: string,
    onLocationUpdate?: (loc: WorkerLocationFrame) => void,
    _legacyOnDistance?: unknown,
    destination?: Destination
  ): Promise<TrackingStatus> {
    if (!bookingId) {
      return this.status;
    }
    const lat = destination?.lat ?? destination?.latitude;
    const lng = destination?.lng ?? destination?.longitude;
    const dest =
      typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : null;

    if (this.activeBookingId === bookingId && this.isTrackingActive(bookingId)) {
      if (onLocationUpdate) this.onLocationCallback = onLocationUpdate;
      if (dest) this.destination = dest;
      return this.status;
    }
    if (this.activeBookingId &&
        (this.activeBookingId !== bookingId || !this.isTrackingActive(bookingId))) {
      // Also clean up a failed same-booking GPS session before retrying, otherwise old
      // watchdogs / task state can survive permission-denied and GPS-disabled starts.
      await this.stopTracking(this.activeBookingId, 'STOPPED', false);
    }

    this.activeBookingId = bookingId;
    this.destination = dest;
    this.onLocationCallback = onLocationUpdate || null;
    this.buffer.clear();
    this.lastSent = null;
    this.lastSentAt = null;
    this.retryAttempt = 0;
    this.setStatus({ state: 'STARTING', bookingId, lastFixAt: null, lastUploadAt: null, message: undefined });
    try {
      await AsyncStorage.setItem(ACTIVE_BOOKING_KEY, bookingId);
    } catch {
      // persistence is best effort
    }

    // 1. Permission (foreground is required, background is best effort)
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      this.setStatus({
        state: 'PERMISSION_DENIED',
        message: 'Location permission is off. The customer cannot see you travelling. Allow location in Settings.',
      });
      void workerApiService.reportDeviceStatus(bookingId, 'PERMISSION_DENIED');
      return this.status;
    }

    // 2. GPS hardware switch (re-checked every 10 s by the watchdog)
    await this.checkGpsServices();
    this.gpsWatchdog = setInterval(() => void this.checkGpsServices(), 10_000);

    // 3. Foreground watcher
    try {
      this.foregroundSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2_000, distanceInterval: 3 },
        (loc) => void this.handleGpsFix(loc.coords, loc.timestamp)
      );
    } catch (e: any) {
      this.setStatus({ state: 'GPS_DISABLED', message: e?.message || 'Could not start GPS.' });
    }

    // 4. Background (Android foreground service with a persistent notification)
    let backgroundEnabled = false;
    try {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === 'granted') {
        const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK).catch(() => false);
        if (!started) {
          await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 3_000,
            distanceInterval: 5,
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
              notificationTitle: 'HomeEase Partner - on the way',
              notificationBody: 'Sharing your live location with the customer until you arrive.',
              notificationColor: '#2563EB',
            },
          });
        }
        backgroundEnabled = true;
      }
    } catch (e: any) {
      console.warn('[TrackingLifecycle] background location not started:', e?.message);
    }
    this.setStatus({ backgroundEnabled });
    return this.status;
  }

  /**
   * Stops broadcasting. `notifyServer` tells the tracking service to close the session; pass false when the server
   * already ended it (arrived / cancelled) or when switching bookings.
   */
  public async stopTracking(bookingId?: string, reason: string = 'STOPPED', notifyServer = true): Promise<void> {
    if (bookingId && this.activeBookingId && this.activeBookingId !== bookingId) {
      return;
    }
    const currentId = this.activeBookingId;
    this.activeBookingId = null;
    this.destination = null;
    this.onLocationCallback = null;
    this.buffer.clear();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (this.gpsWatchdog) clearInterval(this.gpsWatchdog);
    this.gpsWatchdog = null;
    try {
      this.foregroundSubscription?.remove();
    } catch {
      // ignore
    }
    this.foregroundSubscription = null;
    try {
      if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK)) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
      }
    } catch {
      // ignore
    }
    try {
      await AsyncStorage.removeItem(ACTIVE_BOOKING_KEY);
    } catch {
      // ignore
    }
    this.setStatus({ state: 'ENDED', bookingId: currentId, message: undefined });
    if (currentId && notifyServer) {
      void workerApiService.stopTrackingSession(currentId, reason);
    }
  }

  public stopAll(): void {
    void this.stopTracking(undefined, 'STOPPED');
  }

  // ───────────────────────── fixes & uploads ─────────────────────────

  /** Background task entry point (may run after the OS restarted the JS runtime). */
  public async handleBackgroundGpsPoint(location: any): Promise<void> {
    if (!location?.coords) return;

    // Android may re-create the JS runtime to deliver a headless location task.
    // The API singleton then starts with no JWT even though the partner's session
    // was saved on login. Recover the genuine stored JWT before GPS upload.
    if (!apiClient.getAuthToken()) {
      const session = await storageService.loadAuthSession();
      if (!session.token || session.token.split('.').length !== 3) {
        this.setStatus({ state: 'AUTH_REQUIRED', message: 'Sign in again to resume location sharing.' });
        return;
      }
      apiClient.setAuthToken(session.token);
      if (session.userId) apiClient.setUserId(session.userId);
    }

    if (!this.activeBookingId) {
      try {
        const restored = await AsyncStorage.getItem(ACTIVE_BOOKING_KEY);
        if (restored) {
          this.activeBookingId = restored;
          this.setStatus({ state: 'STARTING', bookingId: restored });
        }
      } catch {
        // ignore
      }
    }
    await this.handleGpsFix(location.coords, location.timestamp || Date.now());
  }

  /** Accepts a device fix, notifies the screen, and uploads it when the adaptive policy says so. */
  public async handleGpsFix(
    coords: {
      latitude: number;
      longitude: number;
      heading?: number | null;
      speed?: number | null;
      accuracy?: number | null;
    },
    timestamp: number
  ): Promise<void> {
    const bookingId = this.activeBookingId;
    if (!bookingId || !coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return;

    const fix: PendingFix = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      heading: typeof coords.heading === 'number' && coords.heading >= 0 ? coords.heading : null,
      speed: typeof coords.speed === 'number' && coords.speed >= 0 ? coords.speed : null,
      accuracy: typeof coords.accuracy === 'number' && coords.accuracy >= 0 ? coords.accuracy : null,
      timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    };
    this.setStatus({ lastFixAt: fix.timestamp });

    if (this.onLocationCallback) {
      try {
        this.onLocationCallback({
          latitude: fix.latitude,
          longitude: fix.longitude,
          heading: fix.heading ?? 0,
          speed: fix.speed ?? 0,
          accuracy: fix.accuracy ?? 0,
          timestamp: fix.timestamp,
        });
      } catch {
        // ignore screen errors
      }
    }

    const toDest = this.destination
      ? distanceMeters(fix.latitude, fix.longitude, this.destination.lat, this.destination.lng)
      : null;
    const moved = this.lastSent
      ? distanceMeters(this.lastSent.latitude, this.lastSent.longitude, fix.latitude, fix.longitude)
      : Number.POSITIVE_INFINITY;
    const due = shouldUpload({
      nowMs: Date.now(),
      lastSentAtMs: this.lastSentAt,
      intervalMs: uploadIntervalMs(fix.speed, toDest),
      movedMeters: moved,
      headingChangeDeg: headingDelta(this.lastSent?.heading, fix.heading),
    });
    if (!due) return;

    this.buffer.offer(fix);
    if (!this.retryTimer) await this.flush();
  }

  private async flush(): Promise<void> {
    const bookingId = this.activeBookingId;
    if (!bookingId || this.uploading) return;
    const fix = this.buffer.take(Date.now());
    if (!fix) return;

    this.uploading = true;
    let outcome: UploadOutcome = 'RETRY';
    try {
      const res = await workerApiService.publishLiveLocation(
        bookingId,
        fix.latitude,
        fix.longitude,
        fix.heading,
        fix.speed,
        fix.accuracy,
        fix.timestamp
      );
      outcome = classifyUploadResponse(res.status);
      if (outcome !== 'OK' && outcome !== 'RETRY') {
        console.warn('[TrackingLifecycle] upload', res.status, res.data?.message || res.data?.error || '');
      }
    } finally {
      this.uploading = false;
    }

    switch (outcome) {
      case 'OK':
        this.retryAttempt = 0;
        this.lastSent = fix;
        this.lastSentAt = Date.now();
        this.setStatus({ state: 'LIVE', lastUploadAt: this.lastSentAt, message: undefined });
        return;
      case 'DROP_FRAME':
        this.lastSentAt = Date.now();
        return;
      case 'AUTH_REQUIRED':
        await this.stopTracking(bookingId, 'STOPPED', false);
        this.setStatus({
          state: 'AUTH_REQUIRED',
          message: 'Your session has expired. Sign in again to keep sharing your location.',
        });
        return;
      case 'STOP_TRACKING':
        // arrived, cancelled, or this partner is no longer assigned: the server already closed the session
        await this.stopTracking(bookingId, 'STOPPED', false);
        return;
      default: {
        // RETRY: keep the newest fix (a newer one may replace it meanwhile) and back off
        this.buffer.offer(fix);
        const wait = nextBackoffMs(this.retryAttempt++);
        this.setStatus({ state: 'RETRYING', message: 'Connection problem. Retrying...' });
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          void this.flush();
        }, wait);
      }
    }
  }

  private async checkGpsServices(): Promise<void> {
    const bookingId = this.activeBookingId;
    if (!bookingId) return;
    let enabled = true;
    try {
      enabled = await Location.hasServicesEnabledAsync();
    } catch {
      enabled = true; // unknown: do not claim it is off
    }
    if (!enabled && this.status.state !== 'GPS_DISABLED') {
      this.setStatus({
        state: 'GPS_DISABLED',
        message: 'GPS is switched off. Turn on Location so the customer can see you.',
      });
      void workerApiService.reportDeviceStatus(bookingId, 'GPS_DISABLED');
    } else if (enabled && this.status.state === 'GPS_DISABLED') {
      this.setStatus({ state: 'STARTING', message: undefined });
      void workerApiService.reportDeviceStatus(bookingId, 'OK');
    }
  }
}

export const workerTrackingLifecycle = WorkerTrackingLifecycleManager.getInstance();

// ─── Background location task (must be defined at module load, outside any component) ───
try {
  if (!TaskManager.isTaskDefined(BACKGROUND_TRACKING_TASK)) {
    TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }) => {
      if (error) {
        console.warn('[BackgroundTask] Location error:', error.message);
        return;
      }
      const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
      if (locations && locations.length > 0) {
        await workerTrackingLifecycle.handleBackgroundGpsPoint(locations[locations.length - 1]);
      }
    });
  }
} catch (taskDefErr: any) {
  console.warn('[BackgroundTask] defineTask notice:', taskDefErr?.message);
}

export default workerTrackingLifecycle;
