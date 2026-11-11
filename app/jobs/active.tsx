import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { ActiveJobScreen } from '../../src/screens/jobs/ActiveJobScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';
import { useApp } from '../../src/state/AppContext';

export default function ActiveJobRoute() {
  const params = useLocalSearchParams<{ bookingId?: string; jobId?: string }>();
  const navigation = useAppNavigation() as any;
  const { activeJob: appActiveJob, jobRequests } = useApp();
  const storeActiveJob = useWorkerStore((s) => s.activeJob);

  const activeJob =
    appActiveJob ||
    storeActiveJob ||
    (params.bookingId ? jobRequests.find((j) => j.bookingId === params.bookingId || j.id === params.bookingId) : null) ||
    (jobRequests.length > 0 ? jobRequests[0] : null);

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

