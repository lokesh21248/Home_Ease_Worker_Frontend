import React from 'react';
import { useNavigation } from 'expo-router';
import { JobCompletionScreen } from '../../src/screens/jobs/JobCompletionScreen';
import { useWorkerStore } from '../../src/store/useWorkerStore';

export default function JobCompletionRoute() {
  const navigation = useNavigation<any>();
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
