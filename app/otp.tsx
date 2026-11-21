import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppNavigation } from '../src/navigation/useAppNavigation';
import { OtpVerificationScreen } from '../src/screens/auth/OtpVerificationScreen';

export default function OtpRoute() {
  const params = useLocalSearchParams<{ phone?: string; phoneNumber?: string; countryCode?: string }>();
  const navigation = useAppNavigation() as any;

  return (
    <OtpVerificationScreen
      route={{
        key: 'otp-screen',
        name: 'OtpVerification',
        params: {
          phoneNumber: params.phoneNumber || params.phone || '9876543210',
          countryCode: params.countryCode || '+91',
        },
      }}
      navigation={navigation}
    />
  );
}
