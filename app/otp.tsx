import React from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { OtpVerificationScreen } from '../src/screens/auth/OtpVerificationScreen';

export default function OtpRoute() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const navigation = useNavigation<any>();

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
