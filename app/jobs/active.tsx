import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { ActiveJobScreen } from '../../src/screens/jobs/ActiveJobScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';

export default function ActiveJobRoute() {
  const params = useLocalSearchParams<{ bookingId?: string; jobId?: string }>();
  const navigation = useAppNavigation() as any;
  const activeJob = useWorkerStore((s) => s.activeJob);

  return (
    <ActiveJobScreen
      route={{
        key: 'active-job',
        name: 'ActiveJob',
        params: {
          job: activeJob || undefined,
          bookingId: params.bookingId || activeJob?.bookingId || activeJob?.id,
        },
      }}
      navigation={navigation}
    />
  );
}

