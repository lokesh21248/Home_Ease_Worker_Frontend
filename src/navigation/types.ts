import { NavigatorScreenParams } from '@react-navigation/native';
import { Job } from '../types';

export type BottomTabParamList = {
  HomeTab: undefined;
  JobsTab: undefined;
  EarningsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  // Onboarding & Auth Flow
  Splash: undefined;
  Login: undefined;
  OtpVerification: { phoneNumber: string; countryCode: string };
  CreateAccount: { phoneNumber: string };
  ProfileSetup: undefined;
  DocumentUpload: { isOnboarding?: boolean };
  ServiceSelection: { isOnboarding?: boolean };
  AvailabilitySetup: { isOnboarding?: boolean };

  // Main Tabs
  MainTabs: NavigatorScreenParams<BottomTabParamList>;

  // Job Flow
  JobRequests: undefined;
  JobDetails: { job: Job };
  NavigationTracking: { job: Job };
  ActiveJob: { job?: Job; bookingId?: string; booking?: any };
  JobCompletion: { job: Job };

  // Financials & Account
  Earnings: undefined;
  Wallet: undefined;
  ReviewsRatings: undefined;
  Notifications: undefined;
  BankDetails: undefined;
  Support: undefined;
  Settings: undefined;
};
