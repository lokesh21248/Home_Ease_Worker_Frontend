import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { CreateAccountScreen } from '../src/screens/auth/CreateAccountScreen';

export default function CreateAccountRoute() {
  const params = useLocalSearchParams<{ phoneNumber?: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <CreateAccountScreen
      route={{
        key: 'create-account',
        name: 'CreateAccount',
        params: { phoneNumber: params.phoneNumber || '' },
      }}
      navigation={navigation}
    />
  );
}

