import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { JobCompletionScreen } from '../../src/screens/jobs/JobCompletionScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';
import { useApp } from '../../src/state/AppContext';
import { CustomHeader } from '../../src/components/CustomHeader';
import { EmptyState } from '../../src/components/EmptyState';

export default function JobCompletionRoute() {
  const params = useLocalSearchParams<{ bookingId?: string; jobId?: string }>();
  const navigation = useAppNavigation() as any;
  const { activeJob: appActiveJob, completedJobs } = useApp();
  const storeActiveJob = useWorkerStore((s) => s.activeJob);

  const activeJob =
    appActiveJob ||
    storeActiveJob ||
    (params.bookingId ? completedJobs.find((j) => j.bookingId === params.bookingId || j.id === params.bookingId) : null) ||
    (completedJobs.length > 0 ? completedJobs[0] : null);

  if (!activeJob) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F7FC' }}>
        <CustomHeader
          title="Job Completion"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'JobsTab' })}
        />
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="No Active Job to Complete"
          description="You do not currently have an active job in progress to complete."
          actionLabel="View All Jobs"
          onAction={() => navigation.navigate('MainTabs', { screen: 'JobsTab' })}
        />
      </View>
    );
  }

  return (
    <JobCompletionScreen
      route={{
        key: 'job-completion',
        name: 'JobCompletion',
        params: { job: activeJob },
      }}
      navigation={navigation}
    />
  );
}

