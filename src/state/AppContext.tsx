import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  WorkerProfile,
  ServiceCategory,
  DocumentItem,
  Job,
  JobStatus,
  BankDetails,
  AppSettings,
  NotificationItem,
} from '../types';
import { mockServices, mockInitialWorker, mockDocuments, mockBankDetails } from '../mock/workers';
import { mockJobs } from '../mock/jobs';
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
  toggleServiceSelection: (serviceId: string) => void;
  updateAvailability: (availability: WorkerProfile['availability']) => void;
  toggleOnlineStatus: () => Promise<void> | void;

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

  // Services & Documents
  const [services] = useState<ServiceCategory[]>(mockServices);
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments);
  const [bankDetails, setBankDetails] = useState<BankDetails>(mockBankDetails);

  // Jobs State
  const [jobRequests, setJobRequests] = useState<Job[]>(
    mockJobs.filter((j) => j.status === 'requested')
  );
  const [activeJob, setActiveJob] = useState<Job | null>(
    mockJobs.find((j) => j.status === 'started' || j.status === 'accepted' || j.status === 'travelling' || j.status === 'arrived') || null
  );
  const [completedJobs, setCompletedJobs] = useState<Job[]>(
    mockJobs.filter((j) => j.status === 'completed')
  );

  // Financials
  const [earnings, setEarnings] = useState(mockEarningsData);
  const [wallet, setWallet] = useState<WalletState>(mockWalletData);
  const [reviewsOverview] = useState<RatingOverview>(mockReviewsData);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activeBannerAlert, setActiveBannerAlert] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    pushNotifications: true,
    soundAlerts: true,
    smsUpdates: true,
    language: 'English',
    darkMode: false,
  });

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
        }));

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
    } catch (err) {
      console.warn('[AppContext] fetchWorkerProfile error:', err);
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
      if (Array.isArray(backendRequests) && backendRequests.length > 0) {
        const mappedJobs = backendRequests.map(mapBackendBookingToJob);
        setJobRequests((prev) => {
          const prevIds = new Set(prev.map((j) => j.bookingId || j.id));
          const hasNew = mappedJobs.some((j) => !prevIds.has(j.bookingId || j.id));
          if (hasNew) {
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
          fetchWorkerProfile().catch(() => {});
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
      }
    };
    restorePersistedState();
  }, []);

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
      }, 15000);
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
      return { ...prev, selectedServices: updated };
    });
  };

  const updateAvailability = (availability: WorkerProfile['availability']) => {
    setWorker((prev) => ({ ...prev, availability }));
  };

  const toggleOnlineStatus = async () => {
    const nextStatus = !worker.availability.isOnline;
    alertFeedbackService.playTouchFeedback('medium');

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
      const res = await workerApiService.updateDutyStatus(nextStatus);
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
        workerApiService.sendLocationHeartbeat(workerLocation.lat, workerLocation.lng).catch(() => {});
        fetchJobRequests().catch(() => {});
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
      storageService.saveDutyStatus(!nextStatus);

      // Alert the worker clearly
      setActiveBannerAlert(`Duty Notice: ${errorMsg}`);
      alertFeedbackService.playTouchFeedback('heavy');
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
    } catch (err) {
      console.warn('[AppContext] acceptJob backend sync notice:', err);
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

    // End-to-end Backend Job Complete (POST /workers/bookings/{bookingId}/complete)
    try {
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
        toggleServiceSelection,
        updateAvailability,
        toggleOnlineStatus,
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
