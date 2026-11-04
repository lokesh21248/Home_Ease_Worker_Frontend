import * as Location from 'expo-location';
import { Linking, Alert, Platform } from 'react-native';
import { workerApiService } from '../api/workerApiService';

export interface LocationData {
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  district?: string;
  fullAddress?: string;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export type GpsStatus = 'online' | 'offline' | 'unavailable';

class LocationService {
  private trackingInterval: any = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private lastLocation: LocationData | null = null;
  private isTrackingActive: boolean = false;

  /**
   * Check if foreground location permission is granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('[LocationService] checkPermission error:', error);
      return false;
    }
  }

  /**
   * Request foreground location permission with graceful rationale and settings redirect
   */
  async requestPermission(): Promise<boolean> {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === Location.PermissionStatus.GRANTED) {
        return true;
      }

      const requested = await Location.requestForegroundPermissionsAsync();
      if (requested.status === Location.PermissionStatus.GRANTED) {
        return true;
      }

      // If permanently denied (cannot ask again), offer redirect to device settings
      if (!requested.canAskAgain) {
        Alert.alert(
          'Location Permission Required',
          'HomeEase Partner requires location access to receive nearby service requests and route customer jobs. Please enable location permissions in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
      return false;
    } catch (error) {
      console.warn('[LocationService] requestPermission error:', error);
      return false;
    }
  }

  /**
   * Check if GPS hardware / Location provider is enabled on device
   */
  async isGpsProviderEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.warn('[LocationService] hasServicesEnabledAsync error:', error);
      return false;
    }
  }

  /**
   * Fetch current location and perform reverse geocoding to extract Locality & City
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      const isProviderOn = await this.isGpsProviderEnabled();
      if (!isProviderOn) {
        console.warn('[LocationService] GPS is turned off on device');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      const reverse = await this.reverseGeocode(latitude, longitude);

      const locationData: LocationData = {
        latitude,
        longitude,
        locality: reverse.locality,
        city: reverse.city,
        district: reverse.district,
        fullAddress: reverse.fullAddress,
        heading: typeof heading === 'number' && !isNaN(heading) ? heading : 0,
        speed: typeof speed === 'number' && !isNaN(speed) ? Math.max(0, speed) : 0,
        accuracy: typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 5.0,
      };

      this.lastLocation = locationData;
      return locationData;
    } catch (error) {
      console.warn('[LocationService] getCurrentLocation error:', error);
      return this.lastLocation;
    }
  }

  /**
   * Live reverse geocode coordinates to City and Locality
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ locality: string; city: string; district: string; fullAddress: string }> {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places && places.length > 0) {
        const p = places[0];
        const locality =
          p.district || p.subregion || p.street || p.name || 'Madhapur';
        const city = p.city || p.region || 'Hyderabad';
        const fullAddress = [p.name, p.street, locality, city, p.postalCode]
          .filter(Boolean)
          .join(', ');

        return {
          locality,
          city,
          district: p.district || '',
          fullAddress,
        };
      }
    } catch (error) {
      console.warn('[LocationService] reverseGeocode error:', error);
    }
    return {
      locality: 'Current Location',
      city: 'Hyderabad',
      district: '',
      fullAddress: 'Current Location, Hyderabad',
    };
  }

  /**
   * Start live GPS tracking when online:
   * Periodic updates (every 8-10 seconds) syncing with backend.
   * Zero network pings when offline.
   */
  startLiveTracking(
    onLocationUpdate?: (location: LocationData) => void,
    intervalMs: number = 10000
  ): void {
    if (this.isTrackingActive) {
      return;
    }
    this.isTrackingActive = true;

    // Immediately fetch initial location
    this.getCurrentLocation().then((loc) => {
      if (loc) {
        onLocationUpdate?.(loc);
        workerApiService.updateLiveLocation(loc.latitude, loc.longitude).catch((e: any) => {
          console.warn('[LocationService] initial updateLiveLocation warning:', e?.message);
        });
      }
    });

    // Periodic heartbeat sync to Redis GEO via backend
    this.trackingInterval = setInterval(async () => {
      if (!this.isTrackingActive) return;
      try {
        const loc = await this.getCurrentLocation();
        if (loc) {
          onLocationUpdate?.(loc);
          await workerApiService.updateLiveLocation(loc.latitude, loc.longitude);
        }
      } catch (err: any) {
        console.warn('[LocationService] tracking interval error:', err?.message);
      }
    }, intervalMs);
  }

  /**
   * Completely stop GPS tracking and clean up intervals when offline
   */
  stopLiveTracking(): void {
    this.isTrackingActive = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  getLastKnownLocation(): LocationData | null {
    return this.lastLocation;
  }
}

export const locationService = new LocationService();
