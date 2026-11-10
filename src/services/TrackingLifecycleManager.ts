/**
 * TrackingLifecycleManager.ts - Worker App
 *
 * Coordinates live travel GPS tracking specifically for active customer jobs.
 *
 * Responsibilities:
 * - Module-scoped TaskManager.defineTask for robust Android foreground service.
 * - Persistent notification with clear partner branding and status.
 * - Enforces booking-specific tracking authorization.
 * - Stops booking-specific travel GPS collection immediately upon ARRIVED, COMPLETED, CANCELLED.
 * - Handles 409 Conflict rejection when session is closed on backend.
 * - Offline GPS ring buffer (max 10 points) safe from memory bloat.
 * - CRITICAL: Preserves general worker online availability in locationService.ts.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { workerApiService } from '../api/workerApiService';
import { locationService, LocationData } from './locationService';

export const BACKGROUND_TRACKING_TASK = 'HOMEEASE_WORKER_BACKGROUND_LOCATION';

interface BufferedCoordinate {
  bookingId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

class WorkerTrackingLifecycleManager {
  private static instance: WorkerTrackingLifecycleManager;

  private activeIntervals = new Map<string, any>();
  private activeSessions = new Set<string>();
  private isBackgroundStarted: boolean = false;
  private offlineBuffer: BufferedCoordinate[] = [];
  private static readonly MAX_BUFFER_SIZE = 10;
  private static readonly STALE_THRESHOLD_MS = 120_000; // 2 minutes

  private locationCallbacks = new Map<string, (loc: LocationData) => void>();
  private distanceCallbacks = new Map<string, (data: { distanceKm: number; etaMinutes: number }) => void>();
  private customerLocations = new Map<string, { latitude?: number; longitude?: number }>();

  private constructor() {}

  public static getInstance(): WorkerTrackingLifecycleManager {
    if (!WorkerTrackingLifecycleManager.instance) {
      WorkerTrackingLifecycleManager.instance = new WorkerTrackingLifecycleManager();
    }
    return WorkerTrackingLifecycleManager.instance;
  }

  public isTrackingActive(bookingId?: string): boolean {
    if (bookingId) {
      return this.activeSessions.has(bookingId);
    }
    return this.activeSessions.size > 0;
  }

  /**
   * Called by the background TaskManager task when OS emits a location fix.
   */
  public async handleBackgroundGpsPoint(location: Location.LocationObject): Promise<void> {
    if (this.activeSessions.size === 0) {
      await this.stopBackgroundLocationUpdates();
      return;
    }

    const { latitude, longitude, heading, speed, accuracy } = location.coords;
    const now = Date.now();

    for (const bookingId of Array.from(this.activeSessions)) {
      const coordData: BufferedCoordinate = {
        bookingId,
        latitude,
        longitude,
        heading: typeof heading === 'number' && !isNaN(heading) ? heading : 0,
        speed: typeof speed === 'number' && !isNaN(speed) ? Math.max(0, speed) : 0,
        accuracy: typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 5.0,
        timestamp: now,
      };

      await this.dispatchLocationFix(coordData);
    }
  }

  private async dispatchLocationFix(coord: BufferedCoordinate): Promise<void> {
    const { bookingId, latitude, longitude, heading, speed, accuracy, timestamp } = coord;

    if (!this.activeSessions.has(bookingId)) return;

    // Update in-memory location UI callback if available
    const onLocationUpdate = this.locationCallbacks.get(bookingId);
    if (onLocationUpdate) {
      onLocationUpdate({
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        locality: '',
        city: '',
      });
    }

    try {
      // 1. Try to flush any buffered offline coordinates first
      await this.flushOfflineBuffer();

      // 2. Publish live coordinate to backend
      const trackRes = await workerApiService.publishLiveLocation(
        bookingId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        timestamp
      );

      // Stop if backend marked session as ARRIVED or STOPPED
      if (
        trackRes?.trackingActive === false ||
        trackRes?.status === 'ARRIVED' ||
        trackRes?.status === 'STOPPED' ||
        trackRes?.status === 'INACTIVE'
      ) {
        this.stopTracking(bookingId);
        return;
      }

      // 3. Update ETA if customer coordinates are known
      const custLoc = this.customerLocations.get(bookingId);
      const onDistUpdate = this.distanceCallbacks.get(bookingId);
      if (custLoc?.latitude && custLoc?.longitude && onDistUpdate) {
        const distanceData = await workerApiService.getLiveDistanceAndEta(
          bookingId,
          custLoc.latitude,
          custLoc.longitude
        );
        if (distanceData && this.activeSessions.has(bookingId)) {
          onDistUpdate(distanceData);
        }
      }
    } catch (err: any) {
      // 409 Conflict: backend session is closed/arrived -> immediately halt
      if (err?.status === 409 || err?.response?.status === 409) {
        this.stopTracking(bookingId);
        return;
      }

      // Network error or timeout: buffer coordinate for safe offline retry
      this.bufferCoordinate(coord);
    }
  }

  private bufferCoordinate(coord: BufferedCoordinate): void {
    if (this.offlineBuffer.length >= WorkerTrackingLifecycleManager.MAX_BUFFER_SIZE) {
      this.offlineBuffer.shift(); // Evict oldest
    }
    this.offlineBuffer.push(coord);
  }

  private async flushOfflineBuffer(): Promise<void> {
    if (this.offlineBuffer.length === 0) return;

    const now = Date.now();
    const pending = [...this.offlineBuffer];
    this.offlineBuffer = [];

    for (const item of pending) {
      if (now - item.timestamp > WorkerTrackingLifecycleManager.STALE_THRESHOLD_MS) {
        continue;
      }
      if (!this.activeSessions.has(item.bookingId)) {
        continue;
      }

      try {
        await workerApiService.publishLiveLocation(
          item.bookingId,
          item.latitude,
          item.longitude,
          item.heading,
          item.speed,
          item.accuracy,
          item.timestamp
        );
      } catch {
        this.bufferCoordinate(item);
        break;
      }
    }
  }

  private async startBackgroundLocationUpdates(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK).catch(() => false);
      if (isStarted) {
        this.isBackgroundStarted = true;
        return;
      }

      // Request background permission
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,
        distanceInterval: 5,
        deferredUpdatesInterval: 4000,
        deferredUpdatesDistance: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'HomeEase Partner Travel Active',
          notificationBody: 'Broadcasting live arrival coordinates to customer',
          notificationColor: '#0052FF',
          killServiceOnDestroy: true,
        },
        pausesUpdatesAutomatically: false,
      });

      this.isBackgroundStarted = true;
    } catch {
      // Fallback gracefully to foreground timer if background task launch fails
    }
  }

  private async stopBackgroundLocationUpdates(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK).catch(() => false);
      if (isStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK);
      }
      this.isBackgroundStarted = false;
    } catch {
      // Handled silently
    }
  }

  /**
   * Starts booking travel GPS streaming to tracking backend.
   */
  public startTravelTracking(
    bookingId: string,
    onLocationUpdate?: (loc: LocationData) => void,
    onDistanceUpdate?: (data: { distanceKm: number; etaMinutes: number }) => void,
    customerLocation?: { latitude?: number; longitude?: number }
  ): void {
    if (!bookingId) return;

    // Stop any existing stream for this booking
    this.stopTracking(bookingId);
    this.activeSessions.add(bookingId);

    if (onLocationUpdate) this.locationCallbacks.set(bookingId, onLocationUpdate);
    if (onDistanceUpdate) this.distanceCallbacks.set(bookingId, onDistanceUpdate);
    if (customerLocation) this.customerLocations.set(bookingId, customerLocation);

    // Launch Android foreground background location service
    void this.startBackgroundLocationUpdates();

    // Foreground periodic tick (for smooth immediate in-app UI animations)
    const publishForegroundLocation = async () => {
      if (!this.activeSessions.has(bookingId)) return;

      try {
        const loc = await locationService.getCurrentLocation(true);
        if (loc && this.activeSessions.has(bookingId)) {
          await this.dispatchLocationFix({
            bookingId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading ?? 0,
            speed: loc.speed ?? 0,
            accuracy: loc.accuracy ?? 5.0,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Handled silently
      }
    };

    // Immediate first tick
    void publishForegroundLocation();

    // 4-second adaptive interval while travelling
    const timer = setInterval(publishForegroundLocation, 4000);
    this.activeIntervals.set(bookingId, timer);
  }

  /**
   * CRITICAL: Immediately stops booking-specific travel tracking.
   * Does NOT touch worker general online availability.
   */
  public stopTracking(bookingId: string): void {
    if (!bookingId) return;
    this.activeSessions.delete(bookingId);
    this.locationCallbacks.delete(bookingId);
    this.distanceCallbacks.delete(bookingId);
    this.customerLocations.delete(bookingId);

    const timer = this.activeIntervals.get(bookingId);
    if (timer) {
      clearInterval(timer);
      this.activeIntervals.delete(bookingId);
    }

    if (this.activeSessions.size === 0) {
      void this.stopBackgroundLocationUpdates();
      this.offlineBuffer = [];
    }
  }

  /**
   * Cleans up all active tracking sessions.
   */
  public stopAll(): void {
    this.activeIntervals.forEach((timer) => clearInterval(timer));
    this.activeIntervals.clear();
    this.activeSessions.clear();
    this.locationCallbacks.clear();
    this.distanceCallbacks.clear();
    this.customerLocations.clear();
    this.offlineBuffer = [];
    void this.stopBackgroundLocationUpdates();
  }
}

export const workerTrackingLifecycle = WorkerTrackingLifecycleManager.getInstance();

// Module-scope definition of background task for Expo TaskManager
try {
  if (!TaskManager.isTaskDefined(BACKGROUND_TRACKING_TASK)) {
    TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }: { data: any; error: any }) => {
      if (error) {
        return;
      }
      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
          const latest = locations[locations.length - 1];
          await workerTrackingLifecycle.handleBackgroundGpsPoint(latest);
        }
      }
    });
  }
} catch {
  // Graceful fallback for non-native environments
}
