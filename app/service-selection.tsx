import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { ServiceSelectionScreen } from '../src/screens/auth/ServiceSelectionScreen';

export default function ServiceSelectionRoute() {
  const params = useLocalSearchParams<{ isOnboarding?: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <ServiceSelectionScreen
      route={{
        key: 'service-selection',
        name: 'ServiceSelection',
        params: { isOnboarding: params.isOnboarding === 'true' },
      }}
      navigation={navigation}
    />
  );
}
