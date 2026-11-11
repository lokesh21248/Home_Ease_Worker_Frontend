import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { JobDetailsScreen } from '../../src/screens/jobs/JobDetailsScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';
import { useApp } from '../../src/state/AppContext';
import { CustomHeader } from '../../src/components/CustomHeader';
import { EmptyState } from '../../src/components/EmptyState';

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

  const foundJob =
    allJobs.find((j) => j.id === id || j.bookingId === id || j.jobId === id) ||
    appActive ||
    storeActive ||
    (allJobs.length > 0 ? allJobs[0] : null);

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

