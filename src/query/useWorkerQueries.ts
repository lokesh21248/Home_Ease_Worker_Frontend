import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerApiService } from '../api/workerApiService';
import { useWorkerStore } from '../store/useWorkerStore';
import { resolveBookingUuid } from '../utils/uuid';
import { JobStatus } from '../types';
import { workerTrackingLifecycle } from '../services/TrackingLifecycleManager';

export const QUERY_KEYS = {
  workerProfile: ['worker', 'profile'] as const,
  services: ['services', 'catalog'] as const,
  earnings: ['earnings', 'overview'] as const,
  todaySchedule: ['schedule', 'today'] as const,
  upcomingSchedule: ['schedule', 'upcoming'] as const,
  bookingDetails: (id: string) => ['booking', id] as const,
};

export const useWorkerProfileQuery = () => {
  const setWorker = useWorkerStore((s) => s.setWorker);

  return useQuery({
    queryKey: QUERY_KEYS.workerProfile,
    queryFn: async () => {
      const data = await workerApiService.getWorkerProfile();
      if (data) {
        setWorker(data);
      }
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
};

export const useServiceCatalogQuery = () => {
  const setServices = useWorkerStore((s) => s.setServices);

  return useQuery({
    queryKey: QUERY_KEYS.services,
    queryFn: async () => {
      const data = await workerApiService.getServices();
      if (Array.isArray(data) && data.length > 0) {
        setServices(data);
      }
      return data;
    },
    staleTime: 1000 * 60 * 15,
  });
};

export const useEarningsOverviewQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.earnings,
    queryFn: async () => {
      return await workerApiService.getEarnings();
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useTodayScheduleQuery = () => {
  const setTodaySchedule = useWorkerStore((s) => s.setTodaySchedule);

  return useQuery({
    queryKey: QUERY_KEYS.todaySchedule,
    queryFn: async () => {
      const data = await workerApiService.getTodaySchedule();
      if (data) {
        setTodaySchedule(data);
      }
      return data;
    },
    staleTime: 1000 * 60 * 1,
  });
};

export const useUpcomingScheduleQuery = () => {
  const setUpcomingSchedule = useWorkerStore((s) => s.setUpcomingSchedule);

  return useQuery({
    queryKey: QUERY_KEYS.upcomingSchedule,
    queryFn: async () => {
      const data = await workerApiService.getUpcomingSchedule();
      if (Array.isArray(data)) {
        setUpcomingSchedule(data);
      }
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useBookingDetailsQuery = (bookingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookingDetails(bookingId),
    queryFn: async () => {
      const bUuid = resolveBookingUuid(bookingId);
      return await workerApiService.getBookingDetails(bUuid);
    },
    enabled: Boolean(bookingId),
    staleTime: 1000 * 30, // 30 seconds
  });
};

// ----------------- MUTATIONS -----------------

export const useAcceptJobMutation = () => {
  const queryClient = useQueryClient();
  const removeJobRequest = useWorkerStore((s) => s.removeJobRequest);
  const setActiveJob = useWorkerStore((s) => s.setActiveJob);
  const jobRequests = useWorkerStore((s) => s.jobRequests);

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const bUuid = resolveBookingUuid(bookingId);
      const res = await workerApiService.acceptBooking(bUuid);
      const matched = jobRequests.find((j) => (j.bookingId || j.id) === bookingId);
      if (matched) {
        setActiveJob({ ...matched, status: 'accepted', bookingId: bUuid });
        removeJobRequest(bookingId);
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useRejectJobMutation = () => {
  const removeJobRequest = useWorkerStore((s) => s.removeJobRequest);

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const bUuid = resolveBookingUuid(bookingId);
      const res = await workerApiService.rejectBooking(bUuid, reason);
      removeJobRequest(bookingId);
      return res;
    },
  });
};

export const useUpdateJobStatusMutation = () => {
  const queryClient = useQueryClient();
  const activeJob = useWorkerStore((s) => s.activeJob);
  const setActiveJob = useWorkerStore((s) => s.setActiveJob);

  return useMutation({
    mutationFn: async ({ status }: { status: JobStatus }) => {
      if (!activeJob) throw new Error('No active job');
      const bId = resolveBookingUuid(activeJob.bookingId, activeJob.id);

      if (status === 'travelling') {
        await workerApiService.startTravelling(bId);
      } else if (status === 'arrived') {
        workerTrackingLifecycle.stopTracking(bId);
        await workerApiService.arriveAtCustomer(bId);
      } else if (status === 'started' || status === 'completed') {
        workerTrackingLifecycle.stopTracking(bId);
      }

      setActiveJob({ ...activeJob, status });
      return { success: true, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
};

export const useVerifyPinMutation = () => {
  const queryClient = useQueryClient();
  const activeJob = useWorkerStore((s) => s.activeJob);
  const setActiveJob = useWorkerStore((s) => s.setActiveJob);

  return useMutation({
    mutationFn: async ({ bookingId, pin }: { bookingId: string; pin: string }) => {
      const bId = resolveBookingUuid(bookingId);
      const res = await workerApiService.verifyBookingPin(bId, pin);
      if (res && (res.status === 'IN_PROGRESS' || res.bookingId) && activeJob) {
        setActiveJob({ ...activeJob, status: 'started' });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
};
