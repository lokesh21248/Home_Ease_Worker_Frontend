import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, WorkerProfile } from '../types';

const STORAGE_KEYS = {
  ACTIVE_JOB: '@homeease_worker:active_job',
  IS_ONLINE: '@homeease_worker:is_online',
  SAVED_TIMESTAMP: '@homeease_worker:saved_timestamp',
  AUTH_TOKEN: '@homeease_worker:auth_token',
  USER_ID: '@homeease_worker:user_id',
  WORKER_PROFILE: '@homeease_worker:worker_profile',
};

class StorageService {
  /**
   * Persist the ongoing active job state to device storage
   * Protects against unexpected phone reboots, battery drain, or low memory kills.
   */
  public async saveActiveJob(job: Job | null): Promise<void> {
    try {
      if (job) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_JOB, JSON.stringify(job));
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TIMESTAMP, Date.now().toString());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_TIMESTAMP);
      }
    } catch (error) {
      console.warn('[StorageService] Error saving active job:', error);
    }
  }

  /**
   * Load the active job state from storage upon app restart/wakeup
   */
  public async loadActiveJob(): Promise<Job | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_JOB);
      if (!data) return null;
      return JSON.parse(data) as Job;
    } catch (error) {
      console.warn('[StorageService] Error loading active job:', error);
      return null;
    }
  }

  /**
   * Clear active job cache when job is completed or cancelled
   */
  public async clearActiveJob(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB);
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_TIMESTAMP);
    } catch (error) {
      console.warn('[StorageService] Error clearing active job:', error);
    }
  }

  /**
   * Save worker online/offline duty status across restarts
   */
  public async saveDutyStatus(isOnline: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_ONLINE, JSON.stringify(isOnline));
    } catch (error) {
      console.warn('[StorageService] Error saving duty status:', error);
    }
  }

  /**
   * Load worker online/offline duty status from storage
   */
  public async loadDutyStatus(): Promise<boolean | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.IS_ONLINE);
      if (data === null) return null;
      return JSON.parse(data) as boolean;
    } catch (error) {
      console.warn('[StorageService] Error loading duty status:', error);
      return null;
    }
  }

  /**
   * Save authenticated worker credentials and profile
   */
  public async saveAuthSession(
    token: string,
    userId: string,
    workerProfile?: WorkerProfile
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      if (workerProfile) {
        await AsyncStorage.setItem(STORAGE_KEYS.WORKER_PROFILE, JSON.stringify(workerProfile));
      }
    } catch (error) {
      console.warn('[StorageService] Error saving auth session:', error);
    }
  }

  /**
   * Load authenticated worker credentials and profile across app restarts
   */
  public async loadAuthSession(): Promise<{
    token: string | null;
    userId: string | null;
    workerProfile: WorkerProfile | null;
  }> {
    try {
      const [token, userId, profileData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.WORKER_PROFILE),
      ]);

      const workerProfile = profileData ? (JSON.parse(profileData) as WorkerProfile) : null;
      return { token, userId, workerProfile };
    } catch (error) {
      console.warn('[StorageService] Error loading auth session:', error);
      return { token: null, userId: null, workerProfile: null };
    }
  }

  /**
   * Clear session on logout
   */
  public async clearAuthSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.WORKER_PROFILE,
        STORAGE_KEYS.ACTIVE_JOB,
      ]);
    } catch (error) {
      console.warn('[StorageService] Error clearing auth session:', error);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
