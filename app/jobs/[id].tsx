import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { JobDetailsScreen } from '../../src/screens/jobs/JobDetailsScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';

export default function JobDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useAppNavigation() as any;
  const { activeJob, jobRequests, completedJobs } = useWorkerStore();

  const foundJob =
    (activeJob?.id === id || activeJob?.bookingId === id ? activeJob : null) ||
    jobRequests.find((j) => j.id === id || j.bookingId === id) ||
    completedJobs.find((j) => j.id === id || j.bookingId === id);

  if (!foundJob) {
    return null;
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

