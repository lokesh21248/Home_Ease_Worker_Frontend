import React from 'react';
import { useNavigation } from 'expo-router';
import { NavigationTrackingScreen } from '../src/screens/jobs/NavigationTrackingScreen';
import { useWorkerStore } from '../src/store/useWorkerStore';

export default function NavigationTrackingRoute() {
  const navigation = useNavigation<any>();
  const activeJob = useWorkerStore((s) => s.activeJob);

  if (!activeJob) {
    return null;
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

