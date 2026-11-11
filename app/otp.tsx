import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { OtpVerificationScreen } from '../src/screens/auth/OtpVerificationScreen';

export default function OtpRoute() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <OtpVerificationScreen
      route={{
        key: 'otp-screen',
        name: 'OtpVerification',
        params: {
          phoneNumber: phone || '9876543210',
          countryCode: '+91',
        },
      }}
      navigation={navigation}
    />
  );
}
