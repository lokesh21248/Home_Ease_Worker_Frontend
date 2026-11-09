import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  WorkerProfile,
  ServiceCategory,
  SubService,
  DocumentItem,
  Job,
  JobStatus,
  BankDetails,
  AppSettings,
  NotificationItem,
  DaySchedule,
  TimeOffItem,
  WorkerScheduleSlot,
  WorkerTodaySchedule,
} from '../types';
import { mockServices, mockInitialWorker, mockDocuments, mockBankDetails } from '../mock/workers';
import { mockEarningsData, EarningPeriodData } from '../mock/earnings';
import { mockWalletData, WalletState } from '../mock/wallet';
import { mockReviewsData, RatingOverview } from '../mock/reviews';
import { mockNotifications } from '../mock/notifications';
import { fcmService } from '../services/fcmService';
import { workerApiService } from '../api/workerApiService';
import { apiClient } from '../api/client';
import { storageService } from '../services/storageService';
import { alertFeedbackService } from '../services/alertFeedbackService';
import { resolveBookingUuid } from '../utils/uuid';
import { mapBackendBookingToJob } from '../utils/bookingMapper';
import { locationService, LocationData, GpsStatus } from '../services/locationService';
import { workerTrackingLifecycle } from '../services/TrackingLifecycleManager';
import { webSocketService } from '../services/webSocketService';
import { Alert } from 'react-native';

interface AppContextType {
  // Auth & Session
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  worker: WorkerProfile;
  fetchWorkerProfile: () => Promise<any>;
  updateWorkerProfile: (updates: Partial<WorkerProfile>) => void;
  logout: () => void;

  // Services & Availability
  services: ServiceCategory[];
  workingPincodes: string[];
  updateWorkingPincodes: (pincodes: string[]) => Promise<boolean>;
  toggleServiceSelection: (serviceId: string) => void;
  updateAvailability: (availability: WorkerProfile['availability']) => void;
  toggleOnlineStatus: () => Promise<void> | void;
  weeklySchedule: DaySchedule[];
  timeOffList: TimeOffItem[];
  todaySchedule: WorkerTodaySchedule | null;
  upcomingSchedule: WorkerScheduleSlot[];
  allScheduleSlots: WorkerScheduleSlot[];
  fetchAvailabilityData: () => Promise<void>;
  saveWeeklySchedule: (schedule: DaySchedule[]) => Promise<boolean>;
  addWorkerTimeOff: (startDate: string, endDate: string, reason?: string) => Promise<boolean>;
  deleteWorkerTimeOff: (id: string) => Promise<boolean>;
  fetchSchedules: () => Promise<void>;
  fetchAllScheduleSlots: () => Promise<void>;
  updateSlotStatus: (bookingId: string, status: string) => Promise<void>;
  setSlotAvailability: (bookingId: string, isAvailable: boolean) => void;

  // Documents & KYC
  documents: DocumentItem[];
  uploadDocument: (docId: string, fileName: string, fileUri?: string) => void;
  submitKycRegistration: (data: any) => Promise<any>;

  // Bank Details
  bankDetails: BankDetails;
  updateBankDetails: (details: BankDetails) => void;

  // Jobs
  jobRequests: Job[];
  activeJob: Job | null;
  completedJobs: Job[];
  fetchJobRequests: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<void> | void;
  rejectJob: (jobId: string, reason?: string) => Promise<void> | void;
  updateJobStatus: (status: JobStatus) => void;
  verifyJobPin: (jobId: string, pinCode: string) => Promise<{ success: boolean; message: string; errorCode?: string; data?: any }>;
  addSubServiceToJob: (jobId: string, subServiceId: string, quantity: number) => Promise<{ success: boolean; message: string }>;
  workerLocation: { lat: number; lng: number };
  locationData: LocationData;
  gpsStatus: GpsStatus;
  refreshLocation: () => Promise<void>;
  dashboardMetrics: {
    todayJobs: number;
    todayEarnings: number;
    completedJobs: number;
    pendingRequests: number;
    activeJobs: number;
    averageRating: number;
  };
  completeActiveJob: (completionData: {
    beforeImageUri?: string;
    afterImageUri?: string;
    customerSignatureUri?: string;
    notes?: string;
  }) => Promise<void> | void;
  setActiveJobDirectly: (job: Job | null) => void;

  // Earnings & Wallet
  earnings: {
    daily: EarningPeriodData;
    weekly: EarningPeriodData;
    monthly: EarningPeriodData;
  };
  wallet: WalletState;
  fetchEarningsOverview: () => Promise<any>;
  withdrawFromWallet: (amount: number) => { success: boolean; message: string };

  // Reviews
  reviewsOverview: RatingOverview;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // In-app alert banner
  activeBannerAlert: string | null;
  dismissBannerAlert: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [worker, setWorker] = useState<WorkerProfile>(mockInitialWorker);
  const [workingPincodes, setWorkingPincodes] = useState<string[]>(
    mockInitialWorker.workingPincodes || ['500081', '500072', '500032', '500033', '500034', '500104']
  );

  // Services & Documents
  const [services, setServices] = useState<ServiceCategory[]>(mockServices);
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments);
  const [bankDetails, setBankDetails] = useState<BankDetails>(mockBankDetails);

  // Jobs State (Live from backend, purged mock data)
  const [jobRequests, setJobRequests] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);

  // Financials & Notifications (Purged fake notifications)
  const [earnings, setEarnings] = useState(mockEarningsData);
  const [wallet, setWallet] = useState<WalletState>(mockWalletData);
  const [reviewsOverview] = useState<RatingOverview>(mockReviewsData);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeBannerAlert, setActiveBannerAlert] = useState<string | null>(null);

  // Live Location & GPS
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: 17.447812,
    longitude: 78.373954,
    locality: 'Madhapur',
    city: 'Hyderabad',
    fullAddress: 'Madhapur, Hyderabad',
  });
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('offline');

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    pushNotifications: true,
    soundAlerts: true,
    smsUpdates: true,
    language: 'English',
    darkMode: false,
  });

  // Availability & Scheduling State
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [timeOffList, setTimeOffList] = useState<TimeOffItem[]>([]);
  // Live Schedule & Slots
  const [allScheduleSlots, setAllScheduleSlots] = useState<WorkerScheduleSlot[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<WorkerTodaySchedule | null>(null);
  const [upcomingSchedule, setUpcomingSchedule] = useState<WorkerScheduleSlot[]>([]);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Listen for FCM foreground pushes & trigger penetrating haptic alert
  useEffect(() => {
    const unsubscribe = fcmService.onMessage((msg) => {
      if (msg.notification) {
        // High-priority sound & haptic alert feedback for incoming dispatch
        alertFeedbackService.playJobAlertFeedback();
        setActiveBannerAlert(`${msg.notification.title} - ${msg.notification.body}`);
        addNotification({
          title: msg.notification.title,
          body: msg.notification.body,
          type: 'job',
        });
      }
    });
    return unsubscribe;
  }, []);


  /**
   * Fetch Live Service Catalog from Backend: GET /services
   * Replaces mock service IDs with real PostgreSQL database UUIDs
   */
  const fetchServicesCatalog = async () => {
    try {
      const liveServices = await workerApiService.getServices();
      if (Array.isArray(liveServices) && liveServices.length > 0) {
        const mappedServices: ServiceCategory[] = liveServices.map((item: any, index: number) => {
          const serviceId = item.serviceId || item.id || `srv-${index}`;
          const mockMatch = mockServices.find(
            (m) => m.name.toLowerCase() === (item.name || '').toLowerCase()
          );

          const subServices: SubService[] = Array.isArray(item.subServices)
            ? item.subServices.map((sub: any) => ({
                id: sub.subServiceId || sub.id,
                serviceCategoryId: serviceId,
                name: sub.name,
                description: sub.unitLabel || sub.description,
                price: Number(sub.basePrice || sub.price || 199),
              }))
            : (mockMatch?.subServices || []);

          return {
            id: serviceId,
            name: item.name,
            icon: mockMatch?.icon || 'construct',
            description: item.description || mockMatch?.description || '',
            basePrice: subServices.length > 0 ? subServices[0].price : (item.basePrice || 299),
            selected: worker.selectedServices.includes(serviceId),
            subServices,
          };
        });

        setServices(mappedServices);
      }
    } catch (err) {
      console.info('[AppContext] fetchServicesCatalog notice:', err);
    }
  };

  // GPS Location Stream (matches backend POST /workers/location)
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number }>({
    lat: 17.447812,
    lng: 78.373954,
  });

  /**
   * Fetch Live Worker Profile: GET /workers/profile
   * Matches AppContext.tsx fields directly from live backend contract.
   */
  const fetchWorkerProfile = async (): Promise<any> => {
    try {
      const profile = await workerApiService.getWorkerProfile();
      if (profile) {
        const workerId = profile.workerId || profile.userId;
        const fullName = profile.fullName || profile.user?.fullName || worker.name;
        const phone = profile.phoneNumber || profile.user?.phoneNumber || worker.phone;
        const email = profile.user?.email || worker.email;

        setWorker((prev) => ({
          ...prev,
          id: workerId || prev.id,
          name: fullName,
          phone,
          email,
          address: profile.address || prev.address,
          rating: typeof profile.rating === 'number' ? profile.rating : prev.rating,
          completedJobsCount: typeof profile.jobsCompleted === 'number' ? profile.jobsCompleted : prev.completedJobsCount,
          isVerified: profile.isVerified ?? prev.isVerified,
          isKycVerified: profile.isVerified ?? prev.isKycVerified,
          availability: {
            ...prev.availability,
            isOnline: profile.isOnline ?? prev.availability.isOnline,
          },
          workingPincodes: profile.workingPincodes
            ? (profile.workingPincodes as string).split(',').map((s: string) => s.trim()).filter(Boolean)
            : prev.workingPincodes,
        }));

        if (profile.workingPincodes) {
          const codes = (profile.workingPincodes as string)
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (codes.length > 0) {
            setWorkingPincodes(codes);
          }
        }

        if (profile.userId) {
          apiClient.setUserId(profile.userId);
        }

        const currentToken = apiClient.getAuthToken();
        if (currentToken && (profile.userId || workerId)) {
          storageService.saveAuthSession(currentToken, profile.userId || workerId, {
            ...worker,
            id: workerId || worker.id,
            name: fullName,
            phone,
            email,
            isVerified: profile.isVerified ?? worker.isVerified,
          });
        }

        return profile;
      }
    } catch (err: any) {
      const status: number | undefined = err?.status ?? err?.response?.status;
      if (status === 401 || status === 403) {
        // Session expired / invalid token -- re-throw so session restore can handle it
        console.warn('[AppContext] fetchWorkerProfile: auth error, re-throwing', status);
      throw err;
      }
      // Network / server errors: log but do not crash the UI -- UI still shows cached data
      console.warn('[AppContext] fetchWorkerProfile error:', status, err?.message);
      return null;
    }
    return null;
  };

  /**
   * Fetch Live Pending Requests: GET /workers/bookings/requests
   * Maps incoming booking payloads directly into verified Job objects.
   */
  const fetchJobRequests = async () => {
    try {
      const backendRequests = await workerApiService.getJobRequests();
      if (Array.isArray(backendRequests)) {
        // Deduplicate by stable bookingId to prevent duplicate React keys when backend returns repeated entries
        const seen = new Set<string>();
        const mappedJobs = backendRequests
          .map(mapBackendBookingToJob)
          .filter((j) => {
            const key = j.bookingId || j.id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setJobRequests((prev) => {
          const prevIds = new Set(prev.map((j) => j.bookingId || j.id));
          const hasNew = mappedJobs.some((j) => !prevIds.has(j.bookingId || j.id));
          if (hasNew && mappedJobs.length > 0) {
            alertFeedbackService.playJobAlertFeedback();
            setActiveBannerAlert(`⚡ New job dispatch available: ${mappedJobs[0].serviceName}`);
          }
          return mappedJobs;
        });
      }
    } catch (err) {
      console.warn('[AppContext] fetchJobRequests notice:', err);
    }
  };

  const refreshLocation = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocationData(loc);
        setWorkerLocation({ lat: loc.latitude, lng: loc.longitude });
        await workerApiService.updateLiveLocation(loc.latitude, loc.longitude);
        alertFeedbackService.playTouchFeedback('light');
        setActiveBannerAlert(`📍 Location refreshed: ${loc.locality}, ${loc.city}`);
      }
    } catch (e: any) {
      console.warn('[AppContext] refreshLocation error:', e?.message);
    }
  };

  // Low-Connectivity Caching & Session: Restore active job, duty status, and auth session
  useEffect(() => {
    const restorePersistedState = async () => {
      try {
        const authSession = await storageService.loadAuthSession();
        if (authSession.token && authSession.userId) {
          apiClient.setAuthToken(authSession.token);
          apiClient.setUserId(authSession.userId);
          setIsAuthenticated(true);
          if (authSession.workerProfile) {
            setWorker(authSession.workerProfile);
          }
          // Fetch live worker profile from backend GET /workers/profile
          await fetchWorkerProfile().catch(() => {});
        } else {
          const defaultUid = worker?.userId || worker?.id || '1270d52d-9f4e-4399-9a80-15cab07f1763';
          apiClient.setUserId(defaultUid);
          await fetchWorkerProfile().catch(() => {});
        }

        const cachedJob = await storageService.loadActiveJob();
        if (cachedJob && cachedJob.status !== 'completed' && cachedJob.status !== 'cancelled') {
          setActiveJob(cachedJob);
        }
        const cachedDuty = await storageService.loadDutyStatus();
        if (cachedDuty !== null) {
          setWorker((prev) => ({
            ...prev,
            availability: { ...prev.availability, isOnline: cachedDuty },
          }));
        }
      } catch (err) {
        console.warn('[AppContext] Error restoring persisted state:', err);
      } finally {
        fetchServicesCatalog();
        fetchAvailabilityData();
        fetchSchedules();
        fcmService.getFCMToken().catch(() => {});
      }
    };
    restorePersistedState();

    // Initialize current location silently
    locationService.getCurrentLocation().then((loc) => {
      if (loc) {
        setLocationData(loc);
        setWorkerLocation({ lat: loc.latitude, lng: loc.longitude });
      }
    }).catch(() => {});
  }, []);

  // Real-time WebSocket Order Subscription
  useEffect(() => {
    const targetUserId = apiClient.getUserId() || worker.userId || worker.id || '1270d52d-9f4e-4399-9a80-15cab07f1763';
    if (targetUserId) {
      webSocketService.connect(targetUserId, worker.id);
    }

    const unsubWs = webSocketService.onNewJobRequest((payload) => {
      console.log('[AppContext] Real-time job request received via WebSocket:', payload);
      alertFeedbackService.playJobAlertFeedback();
      const newJob = mapBackendBookingToJob(payload);
      setJobRequests((prev) => {
        const exists = prev.some((j) => (j.bookingId || j.id) === (newJob.bookingId || newJob.id));
        if (exists) return prev;
        return [newJob, ...prev];
      });
      setActiveBannerAlert(`⚡ New job dispatch: ${newJob.serviceName} (${newJob.jobId})`);
      addNotification({
        title: '⚡ New Service Order Request!',
        body: `${newJob.serviceName} nearby in ${newJob.location.address}. Tap to view and accept.`,
        type: 'job',
        jobId: newJob.bookingId,
      });
    });

    return () => {
      unsubWs();
    };
  }, [worker.id, worker.userId]);

  // Low-Connectivity Caching: Persist active job whenever its state progresses or updates
  useEffect(() => {
    storageService.saveActiveJob(activeJob);
  }, [activeJob]);

  // Background/Foreground GPS heartbeat stream (every 20s) & incoming dispatch polling (every 15s) while online
  useEffect(() => {
    let heartbeatInterval: any;
    let requestsInterval: any;
    let immediateTimer: any;

    if (worker.availability.isOnline) {
      workerApiService.sendLocationHeartbeat(workerLocation.lat, workerLocation.lng).catch(() => {});
      immediateTimer = setTimeout(() => {
        fetchJobRequests().catch(() => {});
      }, 100);

      // Heartbeat every 20s (contract: 15-30s while online)
      heartbeatInterval = setInterval(() => {
        setWorkerLocation((prev) => {
          const next = {
            lat: Number((prev.lat + (Math.random() - 0.5) * 0.0002).toFixed(6)),
            lng: Number((prev.lng + (Math.random() - 0.5) * 0.0002).toFixed(6)),
          };
          workerApiService.sendLocationHeartbeat(next.lat, next.lng).catch(() => {});
          return next;
        });
      }, 20000);

      // Poll incoming job dispatch requests every 15s
      requestsInterval = setInterval(() => {
        fetchJobRequests().catch(() => {});
      }, 4000);
    }

    return () => {
      if (immediateTimer) clearTimeout(immediateTimer);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (requestsInterval) clearInterval(requestsInterval);
    };
  }, [worker.availability.isOnline]);

  const updateWorkerProfile = (updates: Partial<WorkerProfile>) => {
    setWorker((prev) => {
      const next = { ...prev, ...updates };
      const currentToken = apiClient.getAuthToken();
      const currentUserId = apiClient.getUserId() || next.id;
      if (currentToken && currentUserId) {
        storageService.saveAuthSession(currentToken, currentUserId, next);
      }
      return next;
    });
  };

  const toggleServiceSelection = (serviceId: string) => {
    setWorker((prev) => {
      const exists = prev.selectedServices.includes(serviceId);
      const updated = exists
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId];
      workerApiService.updateWorkerServices(updated).catch(() => {});
      return { ...prev, selectedServices: updated };
    });
  };

  const updateAvailability = (availability: WorkerProfile['availability']) => {
    setWorker((prev) => ({ ...prev, availability }));
  };

  const updateWorkingPincodes = async (pincodes: string[]): Promise<boolean> => {
    try {
      const cleaned = pincodes
        .map((p) => p.trim())
        .filter((p) => /^\d{6}$/.test(p));
      await workerApiService.updateWorkerServices(undefined, undefined, cleaned);
      setWorkingPincodes(cleaned);
      setWorker((prev) => ({
        ...prev,
        workingPincodes: cleaned,
      }));
      return true;
    } catch (err: any) {
      console.warn('[AppContext] updateWorkingPincodes failed:', err?.message);
      return false;
    }
  };

  const toggleOnlineStatus = async () => {
    const nextStatus = !worker.availability.isOnline;
    alertFeedbackService.playTouchFeedback('medium');

    if (nextStatus) {
      // Must verify location permission & GPS provider before going online
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        setGpsStatus('unavailable');
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to go online and receive customer service requests.'
        );
        return;
      }

      const hasGps = await locationService.isGpsProviderEnabled();
      if (!hasGps) {
        setGpsStatus('unavailable');
        Alert.alert(
          'GPS Disabled',
          'Please turn on GPS / Location services on your device to receive nearby orders.'
        );
        return;
      }

      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocationData(loc);
        setWorkerLocation({ lat: loc.latitude, lng: loc.longitude });
      }
      setGpsStatus('online');
    } else {
      setGpsStatus('offline');
      locationService.stopLiveTracking();
    }

    // Optimistically update
    setWorker((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        isOnline: nextStatus,
      },
    }));

    // End-to-end Backend Duty Toggle (POST /workers/status)
    try {
      let coords: { lat: number; lng: number } | undefined = undefined;
      try {
        const freshLoc = await locationService.getCurrentLocation();
        if (freshLoc && freshLoc.latitude && freshLoc.longitude) {
          coords = { lat: freshLoc.latitude, lng: freshLoc.longitude };
          setLocationData(freshLoc);
        }
      } catch (locErr) {
        if (locationData && locationData.latitude && locationData.longitude) {
          coords = { lat: locationData.latitude, lng: locationData.longitude };
        }
      }
      const res = await workerApiService.updateDutyStatus(nextStatus, coords);
      const updatedOnline = res?.isOnline !== undefined ? res.isOnline : nextStatus;
      setWorker((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          isOnline: updatedOnline,
        },
      }));
      storageService.saveDutyStatus(updatedOnline);

      if (updatedOnline) {
        setGpsStatus('online');
        locationService.startLiveTracking((loc) => {
          setLocationData(loc);
          setWorkerLocation({ lat: loc.latitude, lng: loc.longitude });
        }, 10000);

        const targetId = apiClient.getUserId() || worker.userId || worker.id;
        webSocketService.connect(targetId, worker.id);
        fetchJobRequests().catch(() => {});
      } else {
        setGpsStatus('offline');
        locationService.stopLiveTracking();
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Server rejected duty status update.';
      console.warn('[AppContext] toggleOnlineStatus rejected:', errorMsg);

      // Revert status to previous state
      setWorker((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          isOnline: !nextStatus,
        },
      }));
      setGpsStatus(!nextStatus ? 'online' : 'offline');
      storageService.saveDutyStatus(!nextStatus);

      // Alert the worker clearly
      setActiveBannerAlert(`Duty Notice: ${errorMsg}`);
      alertFeedbackService.playTouchFeedback('heavy');
    }
  };

  /**
   * Fetch Weekly Availability and Time-Off from backend
   */
  const fetchAvailabilityData = async () => {
    try {
      const [schedule, timeOff] = await Promise.all([
        workerApiService.getWeeklyAvailability(),
        workerApiService.getTimeOff(),
      ]);
      if (Array.isArray(schedule) && schedule.length > 0) {
        setWeeklySchedule(schedule);
        const activeDays = schedule
          .filter((d) => d.isAvailable)
          .map((d) => d.dayName.substring(0, 3));
        setWorker((prev) => ({
          ...prev,
          availability: {
            ...prev.availability,
            days: activeDays,
            startHour: schedule[0]?.startTime || prev.availability.startHour,
            endHour: schedule[0]?.endTime || prev.availability.endHour,
          },
        }));
      }
      if (Array.isArray(timeOff)) {
        setTimeOffList(timeOff);
      }
    } catch (err) {
      console.warn('[AppContext] fetchAvailabilityData notice:', err);
    }
  };

  /**
   * Save Weekly Availability schedule to backend: POST /workers/availability
   */
  const saveWeeklySchedule = async (schedule: DaySchedule[]): Promise<boolean> => {
    try {
      await workerApiService.saveWeeklyAvailability(schedule);
      setWeeklySchedule(schedule);
      const activeDays = schedule
        .filter((d) => d.isAvailable)
        .map((d) => d.dayName.substring(0, 3));
      setWorker((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          days: activeDays,
          startHour: schedule[0]?.startTime || prev.availability.startHour,
          endHour: schedule[0]?.endTime || prev.availability.endHour,
        },
      }));
      setActiveBannerAlert('✅ Weekly availability schedule updated successfully!');
      return true;
    } catch (err: any) {
      console.error('[AppContext] saveWeeklySchedule error:', err);
      setActiveBannerAlert('❌ Failed to update weekly schedule.');
      return false;
    }
  };

  /**
   * Add Blocked Date / Time-Off: POST /workers/time-off
   */
  const addWorkerTimeOff = async (
    startDate: string,
    endDate: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const created = await workerApiService.addTimeOff(startDate, endDate, reason);
      if (created) {
        setTimeOffList((prev) => [created, ...prev]);
        setActiveBannerAlert(`📅 Dates blocked (${startDate} to ${endDate})`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[AppContext] addWorkerTimeOff error:', err);
      const msg = err?.response?.data?.message || 'Failed to block dates.';
      setActiveBannerAlert(`❌ ${msg}`);
      return false;
    }
  };

  /**
   * Delete Blocked Date / Time-Off: DELETE /workers/time-off/{id}
   */
  const deleteWorkerTimeOff = async (id: string): Promise<boolean> => {
    try {
      await workerApiService.deleteTimeOff(id);
      setTimeOffList((prev) => prev.filter((item) => item.timeOffId !== id));
      setActiveBannerAlert('Unblocked selected date range.');
      return true;
    } catch (err: any) {
      console.error('[AppContext] deleteWorkerTimeOff error:', err);
      return false;
    }
  };
  const fetchAllScheduleSlots = async () => {
    try {
      const today = await workerApiService.getTodaySchedule();
      const upcoming = await workerApiService.getUpcomingSchedule();

      const slots: WorkerScheduleSlot[] = [];
      if (Array.isArray(today?.schedule)) {
        slots.push(...today.schedule);
      }
      if (Array.isArray(upcoming)) {
        slots.push(...upcoming);
      }

      // Sort by scheduled time
      slots.sort((a, b) => {
        const timeA = a.scheduledAt || a.timeWindow || '';
        const timeB = b.scheduledAt || b.timeWindow || '';
        return timeA.localeCompare(timeB);
      });

      setAllScheduleSlots(slots);
      setTodaySchedule(today);
      setUpcomingSchedule(upcoming);
    } catch (err) {
      console.warn('[AppContext] fetchAllScheduleSlots error:', err);
    }
  };

  const updateSlotStatus = async (bookingId: string, status: string) => {
    try {
      if (status === 'CANCELLED') {
        await workerApiService.rejectBooking(bookingId);
      } else {
        await workerApiService.acceptBooking(bookingId);
      }
      await fetchAllScheduleSlots();
      alertFeedbackService.playSuccessFeedback();
      setActiveBannerAlert(`Booking ${status === 'CANCELLED' ? 'cancelled' : 'updated'} successfully`);
    } catch (err: any) {
      console.warn('[AppContext] updateSlotStatus error:', err);
      alertFeedbackService.playTouchFeedback('heavy');
    }
  };

  const setSlotAvailability = (bookingId: string, isAvailable: boolean) => {
    setAllScheduleSlots((prev) =>
      prev.map((slot) =>
        slot.bookingId === bookingId
          ? { ...slot, isAvailable, status: isAvailable ? 'SCHEDULED' : 'CANCELLED' }
          : slot
      )
    );
  };

  /**
   * Fetch Today's & Upcoming Work Schedule: GET /workers/schedule/today & upcoming
   */
  const fetchSchedules = async () => {
    try {
      const [today, upcoming] = await Promise.all([
        workerApiService.getTodaySchedule(),
        workerApiService.getUpcomingSchedule(),
      ]);
      if (today) setTodaySchedule(today);
      if (Array.isArray(upcoming)) setUpcomingSchedule(upcoming);
    } catch (err) {
      console.warn('[AppContext] fetchSchedules notice:', err);
    }
  };

  const uploadDocument = (docId: string, fileName: string, fileUri?: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            fileName,
            fileUri,
            status: 'pending',
            uploadedAt: new Date().toISOString().split('T')[0],
          };
        }
        return doc;
      })
    );
  };

  const submitKycRegistration = async (kycData: {
    address: string;
    panNumber: string;
    panDocUrl: string;
    aadhaarDocUrl: string;
    bankAccountNo: string;
    bankIfsc: string;
    subServiceIds: string[];
  }) => {
    try {
      const res = await workerApiService.registerKyc(kycData);
      setWorker((prev) => {
        const next = {
          ...prev,
          isVerified: res?.isVerified ?? prev.isVerified,
          isKycVerified: res?.isVerified ?? prev.isKycVerified,
          rating: res?.rating ?? prev.rating,
          completedJobsCount: res?.jobsCompleted ?? prev.completedJobsCount,
        };
        const token = apiClient.getAuthToken();
        const userId = apiClient.getUserId() || next.id;
        if (token && userId) {
          storageService.saveAuthSession(token, userId, next);
        }
        return next;
      });
      return res;
    } catch (err) {
      console.warn('[AppContext] submitKycRegistration notice:', err);
      return null;
    }
  };

  const updateBankDetails = (details: BankDetails) => {
    setBankDetails(details);
  };

  const acceptJob = async (jobId: string) => {
    const job = jobRequests.find((j) => j.id === jobId || j.bookingId === jobId);
    if (!job) return;

    // Real Booking UUID: Always use the bookingId from the accepted dispatch
    const bId = resolveBookingUuid(job.bookingId, job.id, jobId);

    const acceptedJob: Job = {
      ...job,
      id: bId,
      bookingId: bId,
      status: 'accepted',
      timeline: {
        ...job.timeline,
        acceptedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };

    setJobRequests((prev) => prev.filter((j) => j.id !== jobId && j.bookingId !== jobId));
    setActiveJob(acceptedJob);
    alertFeedbackService.playSuccessFeedback();
    setActiveBannerAlert(`🎉 Job #${job.jobId} accepted! Navigate to customer location.`);

    addNotification({
      title: '✅ Job Accepted',
      body: `You accepted booking #${job.jobId} for ${job.customer.name}`,
      type: 'job',
      jobId: bId,
    });

    // End-to-end Backend Job Accept (POST /workers/bookings/{bookingId}/accept)
    try {
      const resp = await workerApiService.acceptBooking(bId);
      if (resp) {
        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                bookingId: resp.bookingId || prev.bookingId || bId,
                totalAmount: resp.totalAmount || prev.totalAmount,
                price: resp.totalAmount || prev.price,
              }
            : null
        );
      }
      fetchSchedules().catch(() => {});

      // Phase 2 Step 5: Initialize tracking session from partner's actual GPS location
      try {
        const currentLoc = await locationService.getCurrentLocation();
        if (currentLoc) {
          await workerApiService.publishLiveLocation(
            bId,
            currentLoc.latitude,
            currentLoc.longitude,
            currentLoc.heading ?? 0,
            currentLoc.speed ?? 0,
            currentLoc.accuracy ?? 5.0
          );
        }
      } catch (locErr: any) {
        console.warn('[AppContext] Initial GPS publish on acceptance notice:', locErr?.message);
      }
    } catch (err: any) {
      console.warn('[AppContext] acceptJob backend sync error:', err);
      const isConflict = err?.status === 409 || err?.isConflict || err?.response?.status === 409;
      const errorMsg = isConflict ? "Another partner accepted this job faster." : (err?.response?.data?.message || err?.message || "Failed to accept booking.");
      setActiveJob(null);
      setJobRequests((prev) => [job, ...prev.filter((j) => j.id !== jobId && j.bookingId !== jobId)]);
      setActiveBannerAlert(isConflict ? "⚠️ Job Taken: Another partner accepted this request faster." : `⚠️ Booking Conflict: ${errorMsg}`);
      alertFeedbackService.playTouchFeedback("heavy");
      throw err;
    }
  };

  const rejectJob = async (jobId: string, reason?: string) => {
    const job = jobRequests.find((j) => j.id === jobId || j.bookingId === jobId);
    setJobRequests((prev) => prev.filter((j) => j.id !== jobId && j.bookingId !== jobId));
    setActiveBannerAlert(
      '⚠️ Booking request rejected. Account temporarily blocked from new dispatches for 1 hour.'
    );

    // End-to-end Backend Job Reject (POST /workers/bookings/{bookingId}/reject)
    try {
      const bId = resolveBookingUuid(job?.bookingId, jobId);
      await workerApiService.rejectBooking(bId, job?.serviceId);
    } catch (err) {
      console.warn('[AppContext] rejectJob backend sync notice:', err);
    }
  };

  const verifyJobPin = async (
    jobId: string,
    pinCode: string
  ): Promise<{ success: boolean; message: string; errorCode?: string; data?: any }> => {
    // Real Booking UUID: Always use the bookingId from the accepted dispatch (e.g. c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a)
    const activeBookingId = resolveBookingUuid(jobId, activeJob?.bookingId, activeJob?.id);

    try {
      const res = await workerApiService.verifyBookingPin(
        activeBookingId,
        pinCode.trim()
      );

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (activeJob) {
        setActiveJob({
          ...activeJob,
          bookingId: res?.bookingId || activeJob.bookingId || activeBookingId,
          status: 'started',
          startedAt: res?.startedAt || new Date().toISOString(),
          timeline: {
            ...activeJob.timeline,
            startedAt: nowTime,
          },
        });
      }

      alertFeedbackService.playSuccessFeedback();
      workerTrackingLifecycle.stopTracking(activeBookingId);
      setActiveBannerAlert('Job started successfully!');
      return { success: true, message: 'Job started successfully!', data: res };
    } catch (err: any) {
      alertFeedbackService.playTouchFeedback('heavy');

      // ✅ Error Handling: Do not treat every 400 as "Wrong PIN". Only show "Wrong PIN" if error.response.data.error === "INVALID_PIN".
      let errorMessage = 'Failed to start job';
      const isInvalidPin = err.response?.data?.error === 'INVALID_PIN';

      if (isInvalidPin) {
        errorMessage = 'Incorrect 4-digit PIN. Please ask the customer.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Failed to start job';
      }

      setActiveBannerAlert(errorMessage);
      return {
        success: false,
        message: errorMessage,
        errorCode: err.response?.data?.error,
      };
    }
  };

  const addSubServiceToJob = async (
    jobId: string,
    subServiceId: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!activeJob) {
      return { success: false, message: 'No active job found.' };
    }

    let foundSubService: any = null;
    for (const cat of services) {
      const match = cat.subServices?.find((s) => s.id === subServiceId);
      if (match) {
        foundSubService = match;
        break;
      }
    }

    if (!foundSubService) {
      return { success: false, message: 'Sub-service not found in catalog.' };
    }

    const addedAmount = foundSubService.price * quantity;
    const newPrice = Math.round((activeJob.price + addedAmount) * 100) / 100;
    const newCommission = Math.round(newPrice * 0.15 * 100) / 100;
    const newNetPayout = Math.round((newPrice - newCommission) * 100) / 100;

    const existingSub = activeJob.subServices || [];
    const updatedSubServices = [
      ...existingSub,
      {
        subServiceId,
        name: foundSubService.name,
        quantity,
        price: foundSubService.price,
      },
    ];

    setActiveJob({
      ...activeJob,
      price: newPrice,
      totalAmount: newPrice,
      commission: newCommission,
      netPayout: newNetPayout,
      subServices: updatedSubServices,
    });

    setActiveBannerAlert(`Added +₹${addedAmount} (${foundSubService.name}) to #${activeJob.jobId}`);

    // End-to-end Backend Upsell Sub-Service (POST /workers/bookings/{bookingId}/add-sub-service)
    try {
      const bId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
      await workerApiService.addSubService(bId, subServiceId, quantity);
    } catch (err) {
      console.warn('[AppContext] addSubService backend sync notice:', err);
    }

    return {
      success: true,
      message: `Successfully added ${foundSubService.name} (x${quantity}) to the booking.`,
    };
  };

  const updateJobStatus = (newStatus: JobStatus) => {
    if (!activeJob) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedTimeline = { ...activeJob.timeline };

    if (newStatus === 'travelling') updatedTimeline.travellingAt = nowTime;
    if (newStatus === 'arrived') updatedTimeline.arrivedAt = nowTime;
    if (newStatus === 'started') updatedTimeline.startedAt = nowTime;

    setActiveJob({
      ...activeJob,
      status: newStatus,
      timeline: updatedTimeline,
    });

    const bId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
    if (newStatus === 'travelling') {
      workerApiService.startTravelling(bId).catch((e) => console.warn('[AppContext] startTravelling:', e?.message));
    } else if (newStatus === 'arrived') {
      workerTrackingLifecycle.stopTracking(bId);
      workerApiService.arriveAtCustomer(bId).catch((e) => console.warn('[AppContext] arriveAtCustomer:', e?.message));
    } else if (newStatus === 'started' || newStatus === 'completed') {
      workerTrackingLifecycle.stopTracking(bId);
    }
  };

  const completeActiveJob = async (completionData: {
    beforeImageUri?: string;
    afterImageUri?: string;
    customerSignatureUri?: string;
    notes?: string;
  }) => {
    if (!activeJob) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
    workerTrackingLifecycle.stopTracking(bId);

    // End-to-end Backend Job Complete (POST /workers/bookings/{bookingId}/complete)
    try {
      if (completionData.beforeImageUri) {
        await workerApiService.uploadJobProof(bId, completionData.beforeImageUri, 'before').catch(() => {});
      }
      if (completionData.afterImageUri) {
        await workerApiService.uploadJobProof(bId, completionData.afterImageUri, 'after').catch(() => {});
      }
      await workerApiService.completeBooking(bId);
    } catch (err) {
      console.warn('[AppContext] completeBooking backend sync notice:', err);
    }

    const finishedJob: Job = {
      ...activeJob,
      status: 'completed',
      timeline: {
        ...activeJob.timeline,
        completedAt: nowTime,
      },
      completionData: {
        ...completionData,
        completedAt: `Today, ${nowTime}`,
      },
    };

    // Update completed jobs
    setCompletedJobs((prev) => [finishedJob, ...prev]);

    // Update worker stats
    setWorker((prev) => ({
      ...prev,
      completedJobsCount: prev.completedJobsCount + 1,
    }));

    // Credit earnings & wallet
    const payout = activeJob.netPayout;
    setWallet((prev) => ({
      ...prev,
      availableBalance: prev.availableBalance + payout,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          transactionId: `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
          title: `Job Payout: ${activeJob.serviceName} (${activeJob.jobId})`,
          type: 'credit',
          amount: payout,
          date: 'Today',
          time: nowTime,
          status: 'success',
          paymentMethod: 'Direct Wallet Credit',
        },
        ...prev.transactions,
      ],
    }));

    // Update daily earnings
    setEarnings((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        netPayout: prev.daily.netPayout + payout,
        totalGross: prev.daily.totalGross + activeJob.price,
        commission: prev.daily.commission + activeJob.commission,
        completedJobs: prev.daily.completedJobs + 1,
      },
    }));

    // Clear active job in memory and persistent storage
    setActiveJob(null);
    storageService.clearActiveJob();
    alertFeedbackService.playSuccessFeedback();

    // Notify
    addNotification({
      title: '💰 Job Completed & Paid!',
      body: `₹${payout} credited to your wallet for ${activeJob.jobId}.`,
      type: 'payment',
      jobId: activeJob.id,
    });

    setActiveBannerAlert(`🎉 ₹${payout} successfully credited to your wallet!`);
  };

  const fetchEarningsOverview = async () => {
    try {
      // End-to-end Backend Earnings Overview (GET /workers/earnings)
      const data = await workerApiService.getEarnings();
      if (data) {
        setEarnings((prev) => ({
          ...prev,
          daily: {
            ...prev.daily,
            totalGross: data.totalEarnings || prev.daily.totalGross,
            totalEarnings: data.totalEarnings,
            commission: data.totalCommissionPaid || prev.daily.commission,
            totalCommissionPaid: data.totalCommissionPaid,
            netPayout: data.netPayout || prev.daily.netPayout,
            completedJobs: data.completedBookingsCount || prev.daily.completedJobs,
            completedBookingsCount: data.completedBookingsCount,
          },
        }));
      }
      return data;
    } catch (err) {
      console.warn('[AppContext] fetchEarningsOverview notice:', err);
      return null;
    }
  };

  const withdrawFromWallet = (amount: number): { success: boolean; message: string } => {
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid amount' };
    }
    if (amount > wallet.availableBalance) {
      return { success: false, message: 'Amount exceeds available balance' };
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setWallet((prev) => ({
      ...prev,
      availableBalance: prev.availableBalance - amount,
      withdrawnAmount: prev.withdrawnAmount + amount,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          transactionId: `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
          title: `Withdrawal to ${bankDetails.bankName} (****${bankDetails.accountNumber.slice(-4)})`,
          type: 'payout',
          amount,
          date: 'Today',
          time: nowTime,
          status: 'success',
          paymentMethod: 'Instant IMPS Payout',
        },
        ...prev.transactions,
      ],
    }));

    addNotification({
      title: '🏦 Withdrawal Processed',
      body: `₹${amount} has been transferred to your ${bankDetails.bankName} account.`,
      type: 'payment',
    });

    return { success: true, message: `₹${amount} successfully transferred to your bank account.` };
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const logout = () => {
    storageService.clearAuthSession();
    storageService.clearActiveJob();
    apiClient.clearSession();
    setIsAuthenticated(false);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        worker,
        fetchWorkerProfile,
        updateWorkerProfile,
        logout,
        services,
        workingPincodes,
        updateWorkingPincodes,
        toggleServiceSelection,
        updateAvailability,
        toggleOnlineStatus,
        weeklySchedule,
        timeOffList,
        todaySchedule,
        upcomingSchedule,
        fetchAvailabilityData,
        saveWeeklySchedule,
        addWorkerTimeOff,
        deleteWorkerTimeOff,
        fetchSchedules,
        allScheduleSlots,
        fetchAllScheduleSlots,
        updateSlotStatus,
        setSlotAvailability,
        documents,
        uploadDocument,
        submitKycRegistration,
        bankDetails,
        updateBankDetails,
        jobRequests,
        fetchJobRequests,
        activeJob,
        completedJobs,
        acceptJob,
        rejectJob,
        updateJobStatus,
        verifyJobPin,
        addSubServiceToJob,
        workerLocation,
        locationData,
        gpsStatus,
        refreshLocation,
        dashboardMetrics: {
          todayJobs: (jobRequests.length > 0 ? jobRequests.length : 0) + completedJobs.length + (activeJob ? 1 : 0),
          todayEarnings: earnings?.daily?.netPayout ?? 0,
          completedJobs: worker.completedJobsCount || completedJobs.length,
          pendingRequests: jobRequests.length,
          activeJobs: activeJob ? 1 : 0,
          averageRating: typeof worker.rating === 'number' ? worker.rating : 4.9,
        },
        completeActiveJob,
        setActiveJobDirectly: setActiveJob,
        earnings,
        wallet,
        fetchEarningsOverview,
        withdrawFromWallet,
        reviewsOverview,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        settings,
        updateSettings,
        activeBannerAlert,
        dismissBannerAlert: () => setActiveBannerAlert(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
