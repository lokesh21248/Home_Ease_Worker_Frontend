import React from 'react';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { SplashScreen } from '../src/screens/auth/SplashScreen';

export default function SplashRoute() {
  const navigation = useAppNavigation() as any;

  return (
    <SplashScreen
      navigation={navigation}
      route={{
        key: 'splash-screen',
        name: 'Splash',
        params: undefined,
      }}
    />
  );
}
