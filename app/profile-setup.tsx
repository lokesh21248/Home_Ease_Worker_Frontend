import React from 'react';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { ProfileSetupScreen } from '../src/screens/auth/ProfileSetupScreen';

export default function ProfileSetupRoute() {
  const navigation = useAppNavigation() as any;

  return (
    <ProfileSetupScreen
      route={{
        key: 'profile-setup',
        name: 'ProfileSetup',
        params: undefined,
      }}
      navigation={navigation}
    />
  );
}
