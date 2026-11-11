import React from 'react';
import { useAppNavigation } from '../../src/navigation/useAppNavigation';
import { JobCompletionScreen } from '../../src/screens/jobs/JobCompletionScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';

export default function JobCompletionRoute() {
  const navigation = useAppNavigation() as any;
  const activeJob = useWorkerStore((s) => s.activeJob);

  if (!activeJob) {
    return null;
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

