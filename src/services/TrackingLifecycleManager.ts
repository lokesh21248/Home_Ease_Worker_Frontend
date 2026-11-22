/**
 * TrackingLifecycleManager.ts - Worker App
 *
 * Live GPS tracking has been disabled as per requirements:
 * Workers navigate using external maps (Google Maps) directly, without
 * continuous background location streaming or battery-heavy GPS tasks.
 */

export const BACKGROUND_TRACKING_TASK = 'HOMEEASE_WORKER_BACKGROUND_LOCATION';

class WorkerTrackingLifecycleManager {
  private static instance: WorkerTrackingLifecycleManager;

  private constructor() {}

  public static getInstance(): WorkerTrackingLifecycleManager {
    if (!WorkerTrackingLifecycleManager.instance) {
      WorkerTrackingLifecycleManager.instance = new WorkerTrackingLifecycleManager();
    }
    return WorkerTrackingLifecycleManager.instance;
  }

  public isTrackingActive(_bookingId?: string): boolean {
    return false;
  }

  public async handleBackgroundGpsPoint(_location: any): Promise<void> {
    // No-op: live GPS tracking removed
  }

  public startTravelTracking(
    _bookingId: string,
    _onLocationUpdate?: (loc: any) => void,
    _onDistanceUpdate?: (data: any) => void,
    _customerLocation?: any
  ): void {
    // No-op: live GPS tracking removed
  }

  public stopTracking(_bookingId?: string): void {
    // No-op: live GPS tracking removed
  }

  public stopAll(): void {
    // No-op: live GPS tracking removed
  }
}

export const workerTrackingLifecycle = WorkerTrackingLifecycleManager.getInstance();
export default workerTrackingLifecycle;
