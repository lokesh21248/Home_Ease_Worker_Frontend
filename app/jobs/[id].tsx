import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { JobDetailsScreen } from '../../src/screens/jobs/JobDetailsScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';
import { useApp } from '../../src/state/AppContext';
import { CustomHeader } from '../../src/components/CustomHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { workerApiService } from '../../src/api/workerApiService';
import { mapBackendBookingToJob } from '../../src/utils/bookingMapper';
import { Job } from '../../src/types';

export default function JobDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useAppNavigation() as any;
  const { activeJob: appActive, jobRequests: appRequests, completedJobs: appCompleted } = useApp();
  const { activeJob: storeActive, jobRequests: storeRequests, completedJobs: storeCompleted } = useWorkerStore();

  const allJobs = [
    ...(appActive ? [appActive] : []),
    ...(storeActive ? [storeActive] : []),
    ...appRequests,
    ...storeRequests,
    ...appCompleted,
    ...storeCompleted,
  ];

  const inMemoryJob =
    allJobs.find((j) => j.id === id || j.bookingId === id || j.jobId === id) ||
    appActive ||
    storeActive ||
    null;

  const [job, setJob] = useState<Job | null>(inMemoryJob);
  const [loading, setLoading] = useState<boolean>(!inMemoryJob && !!id);

  useEffect(() => {
    if (!inMemoryJob && id) {
      let isMounted = true;
      setLoading(true);
      workerApiService.getBookingDetails(id)
        .then((data) => {
          if (isMounted && data) {
            setJob(mapBackendBookingToJob(data));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => { isMounted = false; };
    }
  }, [id, inMemoryJob]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F7FC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  const foundJob = job || (allJobs.length > 0 ? allJobs[0] : null);

  if (!foundJob) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F7FC' }}>
        <CustomHeader
          title="Job Details"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'JobsTab' })}
        />
        <EmptyState
          icon="document-text-outline"
          title="Booking Not Found"
          description={`Could not locate booking details for ID: ${id || 'unknown'}.`}
          actionLabel="Back to Jobs"
          onAction={() => navigation.navigate('MainTabs', { screen: 'JobsTab' })}
        />
      </View>
    );
  }

  return (
    <JobDetailsScreen
      route={{
        key: `job-${id}`,
        name: 'JobDetails',
        params: { job: foundJob },
      }}
      navigation={navigation}
    />
  );
}

