import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import BottomTabs from './BottomTabs';

// Screen Imports
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import DocumentUploadScreen from '../screens/auth/DocumentUploadScreen';
import ServiceSelectionScreen from '../screens/auth/ServiceSelectionScreen';
import AvailabilitySetupScreen from '../screens/auth/AvailabilitySetupScreen';

import JobRequestsScreen from '../screens/jobs/JobRequestsScreen';
import JobDetailsScreen from '../screens/jobs/JobDetailsScreen';
import NavigationTrackingScreen from '../screens/jobs/NavigationTrackingScreen';
import ActiveJobScreen from '../screens/jobs/ActiveJobScreen';
import JobCompletionScreen from '../screens/jobs/JobCompletionScreen';

import EarningsScreen from '../screens/earnings/EarningsScreen';
import WalletScreen from '../screens/earnings/WalletScreen';
import ReviewsRatingsScreen from '../screens/profile/ReviewsRatingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import BankDetailsScreen from '../screens/profile/BankDetailsScreen';
import SupportScreen from '../screens/support/SupportScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding & Auth Stack */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="AvailabilitySetup" component={AvailabilitySetupScreen} />

      {/* Main Tab Navigator */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* Job Management Stack */}
      <Stack.Screen name="JobRequests" component={JobRequestsScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="NavigationTracking" component={NavigationTrackingScreen} />
      <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
      <Stack.Screen name="JobCompletion" component={JobCompletionScreen} />

      {/* Financials & Profile Subscreens */}
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="ReviewsRatings" component={ReviewsRatingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
