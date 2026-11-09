/**
 * TrackingLifecycleManager.ts - Worker App
 *
 * Coordinates live travel GPS tracking specifically for active jobs.
 *
 * Responsibilities:
 * - Emits live GPS updates (every 3-5 seconds adaptive) while travelling to customer.
 * - Stops booking-specific travel GPS collection immediately upon ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED.
 * - Handles 409 Conflict rejection when session is closed on backend.
 * - CRITICAL: Preserves general worker online availability and general duty location tracking in locationService.
 */

import { workerApiService } from '../api/workerApiService';
import { locationService, LocationData } from './locationService';

class WorkerTrackingLifecycleManager {
  private static instance: WorkerTrackingLifecycleManager;

  private activeIntervals = new Map<string, any>();
  private activeSessions = new Set<string>();

  private constructor() {}

  public static getInstance(): WorkerTrackingLifecycleManager {
    if (!WorkerTrackingLifecycleManager.instance) {
      WorkerTrackingLifecycleManager.instance = new WorkerTrackingLifecycleManager();
    }
    return WorkerTrackingLifecycleManager.instance;
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

    const publishLocation = async () => {
      if (!this.activeSessions.has(bookingId)) return;

      try {
        const loc = await locationService.getCurrentLocation(true);
        if (loc && this.activeSessions.has(bookingId)) {
          if (onLocationUpdate) onLocationUpdate(loc);

          const trackRes = await workerApiService.publishLiveLocation(
            bookingId,
            loc.latitude,
            loc.longitude,
            loc.heading ?? 0,
            loc.speed ?? 0,
            loc.accuracy ?? 5.0,
            Date.now()
          );

          // Stop if session is ARRIVED or STOPPED on backend
          if (
            trackRes?.trackingActive === false ||
            trackRes?.status === 'ARRIVED' ||
            trackRes?.status === 'STOPPED' ||
            trackRes?.status === 'INACTIVE'
          ) {
            this.stopTracking(bookingId);
            return;
          }

          // Fetch distance and ETA if customer coords available
          if (customerLocation?.latitude && customerLocation?.longitude) {
            const distanceData = await workerApiService.getLiveDistanceAndEta(
              bookingId,
              customerLocation.latitude,
              customerLocation.longitude
            );
            if (distanceData && onDistanceUpdate && this.activeSessions.has(bookingId)) {
              onDistanceUpdate(distanceData);
            }
          }
        }
      } catch (err: any) {
        // Handle 409 Conflict rejection if session is ARRIVED or STOPPED
        if (err?.status === 409 || err?.response?.status === 409) {
          this.stopTracking(bookingId);
        }
      }
    };

    // Immediate first tick
    void publishLocation();

    // 4-second adaptive interval while travelling
    const timer = setInterval(publishLocation, 4000);
    this.activeIntervals.set(bookingId, timer);
  }

  /**
   * CRITICAL: Immediately stops booking-specific travel tracking.
   * Does NOT touch worker general online availability.
   */
  public stopTracking(bookingId: string): void {
    if (!bookingId) return;
    this.activeSessions.delete(bookingId);

    const timer = this.activeIntervals.get(bookingId);
    if (timer) {
      clearInterval(timer);
      this.activeIntervals.delete(bookingId);
    }
  }

  /**
   * Cleans up all active tracking sessions.
   */
  public stopAll(): void {
    this.activeIntervals.forEach((timer) => clearInterval(timer));
    this.activeIntervals.clear();
    this.activeSessions.clear();
  }
}

export const workerTrackingLifecycle = WorkerTrackingLifecycleManager.getInstance();

