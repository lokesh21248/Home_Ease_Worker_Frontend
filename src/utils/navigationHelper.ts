import { Linking, Platform, Alert } from 'react-native';

interface NavigationTarget {
  latitude: number;
  longitude: number;
  label?: string;
  address?: string;
}

/**
 * 1-Tap Cross-Platform Turn-by-Turn GPS Navigation Launcher
 * Opens Google Maps on Android and Apple Maps (or Google Maps) on iOS directly to customer coordinates.
 */
export const openTurnByTurnNavigation = async ({
  latitude,
  longitude,
  label = 'Customer Location',
  address,
}: NavigationTarget): Promise<void> => {
  if (!latitude || !longitude) {
    Alert.alert('Location Missing', 'Customer GPS coordinates are unavailable for this booking.');
    return;
  }

  const encodedLabel = encodeURIComponent(label || address || 'Customer Job Location');

  // Android: Google Navigation intent launches driving mode directly
  const googleNavigationUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
  // iOS: Apple Maps turn-by-turn driving directions scheme
  const appleMapsUrl = `maps:0,0?q=${encodedLabel}&daddr=${latitude},${longitude}&dirflg=d`;
  // Cross-platform Universal Google Maps Web Direction fallback
  const googleWebFallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    if (Platform.OS === 'ios') {
      const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenApple) {
        await Linking.openURL(appleMapsUrl);
        return;
      }
    } else if (Platform.OS === 'android') {
      const canOpenGoogle = await Linking.canOpenURL(googleNavigationUrl);
      if (canOpenGoogle) {
        await Linking.openURL(googleNavigationUrl);
        return;
      }
    }

    // Fallback if native URI scheme failed
    await Linking.openURL(googleWebFallbackUrl);
  } catch (error) {
    console.warn('[NavigationHelper] Failed opening native maps, trying browser fallback:', error);
    try {
      await Linking.openURL(googleWebFallbackUrl);
    } catch {
      Alert.alert(
        'Navigation Error',
        'Could not open navigation application. Please check your map app installation.'
      );
    }
  }
};

/**
 * Safely navigates backwards if history exists, or redirects to the Worker Dashboard
 * to prevent the unhandled 'GO_BACK' action crash in React Navigation.
 */
export const safeGoBack = (
  navigation: any,
  fallbackRoute: string = 'MainTabs',
  fallbackParams: any = { screen: 'HomeTab' }
): void => {
  if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
    navigation.goBack();
  } else if (navigation && typeof navigation.reset === 'function') {
    navigation.reset({
      index: 0,
      routes: [{ name: fallbackRoute, params: fallbackParams }],
    });
  } else if (navigation && typeof navigation.navigate === 'function') {
    navigation.navigate(fallbackRoute, fallbackParams);
  }
};
