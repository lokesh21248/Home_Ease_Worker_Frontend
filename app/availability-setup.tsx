import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { AvailabilitySetupScreen } from '../src/screens/auth/AvailabilitySetupScreen';

export default function AvailabilitySetupRoute() {
  const params = useLocalSearchParams<{ isOnboarding?: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <AvailabilitySetupScreen
      route={{
        key: 'availability-setup',
        name: 'AvailabilitySetup',
        params: { isOnboarding: params.isOnboarding === 'true' },
      }}
      navigation={navigation}
    />
  );
}

