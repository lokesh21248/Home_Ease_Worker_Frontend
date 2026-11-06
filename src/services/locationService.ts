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
  private lastGeocodedCoords: { latitude: number; longitude: number } | null = null;
  private cachedGeocode: { locality: string; city: string; district: string; fullAddress: string } | null = null;
  private isNativeGeocoderSupported: boolean = true;

  /**
   * Check if foreground location permission is granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
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
    } catch {
      return false;
    }
  }

  /**
   * Check if GPS hardware / Location provider is enabled on device
   */
  async isGpsProviderEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  }

  /**
   * Fetch current location and perform reverse geocoding to extract Locality & City
   */
  async getCurrentLocation(skipGeocode: boolean = false): Promise<LocationData | null> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      const isProviderOn = await this.isGpsProviderEnabled();
      if (!isProviderOn) {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      let reverse = this.cachedGeocode;

      if (!skipGeocode || !reverse) {
        reverse = await this.reverseGeocode(latitude, longitude);
      }

      const locationData: LocationData = {
        latitude,
        longitude,
        locality: reverse?.locality || 'Madhapur',
        city: reverse?.city || 'Hyderabad',
        district: reverse?.district || '',
        fullAddress: reverse?.fullAddress || `${reverse?.locality || 'Madhapur'}, ${reverse?.city || 'Hyderabad'}`,
        heading: typeof heading === 'number' && !isNaN(heading) ? heading : 0,
        speed: typeof speed === 'number' && !isNaN(speed) ? Math.max(0, speed) : 0,
        accuracy: typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 5.0,
      };

      this.lastLocation = locationData;
      return locationData;
    } catch {
      return this.lastLocation;
    }
  }

  /**
   * Live reverse geocode coordinates to City and Locality with caching and network fallback.
   * Handles Android environments where the native Geocoder daemon is not present.
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ locality: string; city: string; district: string; fullAddress: string }> {
    // 1. Check if coordinates are close to last geocoded point (~250m) to save resources
    if (this.lastGeocodedCoords && this.cachedGeocode) {
      const dLat = Math.abs(this.lastGeocodedCoords.latitude - latitude);
      const dLng = Math.abs(this.lastGeocodedCoords.longitude - longitude);
      if (dLat < 0.0025 && dLng < 0.0025) {
        return this.cachedGeocode;
      }
    }

    // 2. Try native Expo Location reverseGeocodeAsync if supported on this device
    if (this.isNativeGeocoderSupported) {
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

          const result = {
            locality,
            city,
            district: p.district || '',
            fullAddress,
          };
          this.cachedGeocode = result;
          this.lastGeocodedCoords = { latitude, longitude };
          return result;
        }
      } catch {
        // "Geocoder is not running" happens on emulators/devices without Google Play Services.
        // Disable native calls for future requests and fall back gracefully without logging errors.
        this.isNativeGeocoderSupported = false;
      }
    }

    // 3. Fallback: Fast web reverse geocode (OpenStreetMap Nominatim) with 2s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
        {
          headers: { 'User-Agent': 'HomeEaseWorker/1.0' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.city_district ||
            addr.county ||
            'Madhapur';
          const city = addr.city || addr.town || addr.state_district || 'Hyderabad';
          const fullAddress = data.display_name || `${locality}, ${city}`;

          const webResult = {
            locality,
            city,
            district: addr.county || '',
            fullAddress,
          };
          this.cachedGeocode = webResult;
          this.lastGeocodedCoords = { latitude, longitude };
          return webResult;
        }
      }
    } catch {
      // Network fallback silently handled
    }

    // 4. Default graceful fallback
    const fallback = {
      locality: this.cachedGeocode?.locality || 'Madhapur',
      city: this.cachedGeocode?.city || 'Hyderabad',
      district: this.cachedGeocode?.district || '',
      fullAddress: this.cachedGeocode?.fullAddress || 'Madhapur, Hyderabad',
    };
    this.cachedGeocode = fallback;
    this.lastGeocodedCoords = { latitude, longitude };
    return fallback;
  }

  /**
   * Start live GPS tracking when online:
   * Periodic updates (every 8-10 seconds) syncing with backend Redis GEO.
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

    // Immediately fetch initial location with geocoding
    this.getCurrentLocation(false).then((loc) => {
      if (loc) {
        onLocationUpdate?.(loc);
        workerApiService.updateLiveLocation(loc.latitude, loc.longitude).catch(() => {});
      }
    });

    // Periodic heartbeat sync to Redis GEO via backend (skip geocode to preserve battery & performance)
    this.trackingInterval = setInterval(async () => {
      if (!this.isTrackingActive) return;
      try {
        const loc = await this.getCurrentLocation(true);
        if (loc) {
          onLocationUpdate?.(loc);
          await workerApiService.updateLiveLocation(loc.latitude, loc.longitude);
        }
      } catch {
        // Silent handling for interval
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
