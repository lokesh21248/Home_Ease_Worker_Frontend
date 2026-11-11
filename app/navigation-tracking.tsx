import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { NavigationTrackingScreen } from '../src/screens/jobs/NavigationTrackingScreen';
import { useWorkerStore } from '../src/store/useWorkerStore';
import { useApp } from '../src/state/AppContext';
import { CustomHeader } from '../src/components/CustomHeader';
import { EmptyState } from '../src/components/EmptyState';

export default function NavigationTrackingRoute() {
  const params = useLocalSearchParams<{ bookingId?: string; jobId?: string }>();
  const navigation = useAppNavigation() as any;
  const { activeJob: appActiveJob, jobRequests } = useApp();
  const storeActiveJob = useWorkerStore((s) => s.activeJob);

  const activeJob =
    appActiveJob ||
    storeActiveJob ||
    (params.bookingId ? jobRequests.find((j) => j.bookingId === params.bookingId || j.id === params.bookingId) : null) ||
    (jobRequests.length > 0 ? jobRequests[0] : null);

  if (!activeJob) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F7FC' }}>
        <CustomHeader
          title="Turn-by-Turn Navigation"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        />
        <EmptyState
          icon="navigate-outline"
          title="No Active Job to Navigate"
          description="Accept a job request or view an active booking to launch GPS navigation."
          actionLabel="Go to Dashboard"
          onAction={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        />
      </View>
    );
  }

  return (
    <NavigationTrackingScreen
      route={{
        key: 'navigation-tracking',
        name: 'NavigationTracking',
        params: { job: activeJob },
      }}
      navigation={navigation}
    />
  );
}

