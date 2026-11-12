import { router } from 'expo-router';

/**
 * Universal Navigation Adapter for Expo Router
 * Provides 100% backward compatibility for legacy React Navigation `navigation.navigate(...)`,
 * `navigation.goBack()`, and `navigation.reset(...)` calls without requiring NavigationContainer.
 */
export const useAppNavigation = () => {
  return {
    navigate: (route: string, params?: any) => {
      switch (route) {
        case 'ActiveJob':
          router.push({
            pathname: '/jobs/active',
            params: params ? { bookingId: params.bookingId, jobId: params.job?.jobId } : undefined,
          });
          break;
        case 'JobRequests':
          router.push('/jobs/requests');
          break;
        case 'JobDetails':
          router.push(`/jobs/${params?.job?.id || params?.job?.bookingId || params?.bookingId || 'current'}`);
          break;
        case 'JobCompletion':
          router.push({
            pathname: '/jobs/completion',
            params: params ? { bookingId: params.bookingId || params.job?.bookingId || params.job?.id, jobId: params.job?.jobId } : undefined,
          });
          break;
        case 'NavigationTracking':
          router.push({
            pathname: '/navigation-tracking',
            params: params ? { bookingId: params.bookingId || params.job?.bookingId || params.job?.id, jobId: params.job?.jobId } : undefined,
          });
          break;
        case 'Wallet':
          router.push('/wallet');
          break;
        case 'MainTabs':
          if (params?.screen === 'HomeTab') router.push('/(tabs)');
          else if (params?.screen === 'SlotsTab') router.push('/(tabs)/slots');
          else if (params?.screen === 'JobsTab') router.push('/(tabs)/jobs');
          else if (params?.screen === 'EarningsTab') router.push('/(tabs)/earnings');
          else if (params?.screen === 'ProfileTab') router.push('/(tabs)/profile');
          else router.push('/(tabs)');
          break;
        case 'Earnings':
          router.push('/(tabs)/earnings');
          break;
        case 'Notifications':
          router.push('/notifications');
          break;
        case 'Login':
          router.replace('/login');
          break;
        case 'OtpVerification':
          router.push({ pathname: '/otp', params });
          break;
        case 'CreateAccount':
          router.push({
            pathname: '/create-account',
            params: params ? { phoneNumber: params.phoneNumber } : undefined,
          });
          break;
        case 'ProfileSetup':
          router.push('/profile-setup');
          break;
        case 'BankDetails':
          router.push('/bank-details');
          break;
        case 'Support':
          router.push('/support');
          break;
        case 'Settings':
          router.push('/settings');
          break;
        case 'DocumentUpload':
          router.push({
            pathname: '/document-upload',
            params: params ? { isOnboarding: params.isOnboarding ? 'true' : 'false' } : undefined,
          });
          break;
        case 'ServiceSelection':
          router.push({
            pathname: '/service-selection',
            params: params ? { isOnboarding: params.isOnboarding ? 'true' : 'false' } : undefined,
          });
          break;
        case 'AvailabilitySetup':
          router.push({
            pathname: '/availability-setup',
            params: params ? { isOnboarding: params.isOnboarding ? 'true' : 'false', tab: params.tab } : undefined,
          });
          break;
        case 'ReviewsRatings':
          router.push('/reviews-ratings');
          break;
        default:
          router.push('/(tabs)');
          break;
      }
    },
    goBack: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    },
    canGoBack: () => router.canGoBack(),
    reset: (options: any) => {
      const targetRoute = options?.routes?.[0];
      const targetName = targetRoute?.name;
      const targetParams = targetRoute?.params;
      if (targetName === 'Login') {
        router.replace('/login');
      } else if (targetName === 'MainTabs') {
        if (targetParams?.screen === 'EarningsTab') router.replace('/(tabs)/earnings');
        else if (targetParams?.screen === 'JobsTab') router.replace('/(tabs)/jobs');
        else if (targetParams?.screen === 'SlotsTab') router.replace('/(tabs)/slots');
        else if (targetParams?.screen === 'ProfileTab') router.replace('/(tabs)/profile');
        else router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    },
    setOptions: () => {},
  };
};

export const useNavigation = useAppNavigation;
export default useAppNavigation;
