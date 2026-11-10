import { create } from 'zustand';
import {
  WorkerProfile,
  Job,
  ServiceCategory,
  DocumentItem,
  BankDetails,
  DaySchedule,
  TimeOffItem,
  WorkerScheduleSlot,
  WorkerTodaySchedule,
  NotificationItem,
  AppSettings,
} from '../types';
import { LocationData, GpsStatus } from '../services/locationService';
import {
  mockInitialWorker,
  mockServices,
  mockDocuments,
  mockBankDetails,
} from '../mock/workers';
import { mockEarningsData } from '../mock/earnings';
import { mockWalletData } from '../mock/wallet';

export interface WorkerStoreState {
  // Authentication & Profile
  isAuthenticated: boolean;
  worker: WorkerProfile;
  workingPincodes: string[];

  // Jobs & Tracking
  activeJob: Job | null;
  jobRequests: Job[];
  completedJobs: Job[];
  workerLocation: { lat: number; lng: number };
  locationData: LocationData;
  gpsStatus: GpsStatus;

  // Services, KYC, Banking
  services: ServiceCategory[];
  documents: DocumentItem[];
  bankDetails: BankDetails;

  // Schedules & Slots
  weeklySchedule: DaySchedule[];
  timeOffList: TimeOffItem[];
  allScheduleSlots: WorkerScheduleSlot[];
  todaySchedule: WorkerTodaySchedule | null;
  upcomingSchedule: WorkerScheduleSlot[];

  // Financials
  earnings: typeof mockEarningsData;
  wallet: typeof mockWalletData;

  // System
  notifications: NotificationItem[];
  settings: AppSettings;
  activeBannerAlert: string | null;

  // Actions
  setIsAuthenticated: (val: boolean) => void;
  setWorker: (worker: WorkerProfile) => void;
  updateWorker: (updates: Partial<WorkerProfile>) => void;
  setWorkingPincodes: (pincodes: string[]) => void;
  setActiveJob: (job: Job | null) => void;
  setJobRequests: (requests: Job[]) => void;
  addJobRequest: (job: Job) => void;
  removeJobRequest: (id: string) => void;
  setCompletedJobs: (jobs: Job[]) => void;
  addCompletedJob: (job: Job) => void;
  setWorkerLocation: (loc: { lat: number; lng: number }) => void;
  setLocationData: (loc: LocationData) => void;
  setGpsStatus: (status: GpsStatus) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setServices: (services: ServiceCategory[]) => void;
  setDocuments: (docs: DocumentItem[]) => void;
  setBankDetails: (bank: BankDetails) => void;
  setEarnings: (earnings: typeof mockEarningsData) => void;
  setWallet: (wallet: typeof mockWalletData) => void;
  setAllScheduleSlots: (slots: WorkerScheduleSlot[]) => void;
  setTodaySchedule: (schedule: WorkerTodaySchedule | null) => void;
  setUpcomingSchedule: (slots: WorkerScheduleSlot[]) => void;
  setTimeOffList: (timeOff: TimeOffItem[]) => void;
  setNotifications: (notifs: NotificationItem[]) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  setActiveBannerAlert: (banner: string | null) => void;
  reset: () => void;
}

export const useWorkerStore = create<WorkerStoreState>((set) => ({
  isAuthenticated: true,
  worker: mockInitialWorker,
  workingPincodes: mockInitialWorker.workingPincodes || [
    '500081',
    '500072',
    '500032',
    '500033',
    '500034',
    '500104',
  ],

  activeJob: null,
  jobRequests: [],
  completedJobs: [],
  workerLocation: { lat: 17.447812, lng: 78.373954 },
  locationData: {
    latitude: 17.447812,
    longitude: 78.373954,
    locality: 'Madhapur',
    city: 'Hyderabad',
    fullAddress: 'Madhapur, Hyderabad',
  },
  gpsStatus: 'offline',

  services: mockServices,
  documents: mockDocuments,
  bankDetails: mockBankDetails,

  weeklySchedule: [],
  timeOffList: [],
  allScheduleSlots: [],
  todaySchedule: null,
  upcomingSchedule: [],

  earnings: mockEarningsData,
  wallet: mockWalletData,

  notifications: [],
  settings: {
    pushNotifications: true,
    soundAlerts: true,
    smsUpdates: true,
    language: 'English',
    darkMode: false,
  },
  activeBannerAlert: null,

  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  setWorker: (worker) => set({ worker }),
  updateWorker: (updates) =>
    set((state) => ({ worker: { ...state.worker, ...updates } })),
  setWorkingPincodes: (workingPincodes) => set({ workingPincodes }),
  setActiveJob: (activeJob) => set({ activeJob }),
  setJobRequests: (jobRequests) => set({ jobRequests }),
  addJobRequest: (job) =>
    set((state) => {
      const exists = state.jobRequests.some(
        (j) => (j.bookingId || j.id) === (job.bookingId || job.id)
      );
      if (exists) return state;
      return { jobRequests: [job, ...state.jobRequests] };
    }),
  removeJobRequest: (id) =>
    set((state) => ({
      jobRequests: state.jobRequests.filter((j) => j.id !== id && j.bookingId !== id),
    })),
  setCompletedJobs: (completedJobs) => set({ completedJobs }),
  addCompletedJob: (job) =>
    set((state) => ({
      completedJobs: [job, ...state.completedJobs],
      activeJob: null,
    })),
  setWorkerLocation: (workerLocation) => set({ workerLocation }),
  setLocationData: (locationData) => set({ locationData }),
  setGpsStatus: (gpsStatus) => set({ gpsStatus }),
  setOnlineStatus: (isOnline) =>
    set((state) => ({
      worker: {
        ...state.worker,
        availability: {
          ...state.worker.availability,
          isOnline,
        },
      },
    })),
  setServices: (services) => set({ services }),
  setDocuments: (documents) => set({ documents }),
  setBankDetails: (bankDetails) => set({ bankDetails }),
  setEarnings: (earnings) => set({ earnings }),
  setWallet: (wallet) => set({ wallet }),
  setAllScheduleSlots: (allScheduleSlots) => set({ allScheduleSlots }),
  setTodaySchedule: (todaySchedule) => set({ todaySchedule }),
  setUpcomingSchedule: (upcomingSchedule) => set({ upcomingSchedule }),
  setTimeOffList: (timeOffList) => set({ timeOffList }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (item) =>
    set((state) => ({
      notifications: [
        {
          ...item,
          id: `notif-${Date.now()}`,
          timestamp: 'Just now',
          isRead: false,
        },
        ...state.notifications,
      ],
    })),
  setSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
  setActiveBannerAlert: (activeBannerAlert) => set({ activeBannerAlert }),
  reset: () =>
    set({
      activeJob: null,
      jobRequests: [],
      completedJobs: [],
      notifications: [],
      activeBannerAlert: null,
    }),
}));
