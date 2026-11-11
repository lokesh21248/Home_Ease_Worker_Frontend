import React from 'react';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { NavigationTrackingScreen } from '../src/screens/jobs/NavigationTrackingScreen';
import { useWorkerStore } from '../src/store/useWorkerStore';

export default function NavigationTrackingRoute() {
  const navigation = useAppNavigation() as any;
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

