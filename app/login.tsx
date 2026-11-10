import React from 'react';
import { useNavigation } from 'expo-router';
import { LoginScreen } from '../src/screens/auth/LoginScreen';

export default function LoginRoute() {
  const navigation = useNavigation<any>();
  return (
    <LoginScreen
      navigation={navigation}
      route={{ key: 'login', name: 'Login', params: undefined }}
    />
  );
}
