import React from 'react';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { LoginScreen } from '../src/screens/auth/LoginScreen';

export default function LoginRoute() {
  const navigation = useAppNavigation() as any;
  return (
    <LoginScreen
      navigation={navigation}
      route={{ key: 'login', name: 'Login', params: undefined }}
    />
  );
}
