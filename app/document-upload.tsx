import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { DocumentUploadScreen } from '../src/screens/auth/DocumentUploadScreen';

export default function DocumentUploadRoute() {
  const params = useLocalSearchParams<{ isOnboarding?: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <DocumentUploadScreen
      route={{
        key: 'document-upload',
        name: 'DocumentUpload',
        params: { isOnboarding: params.isOnboarding === 'true' },
      }}
      navigation={navigation}
    />
  );
}

