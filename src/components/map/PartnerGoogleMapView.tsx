import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  Animated,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { isValidCoordinate, toGoogleMapCoordinates, LatLngCoordinate } from '../../utils/coordinates';

export interface PartnerGoogleMapHandle {
  recenterToWorker: () => void;
  fitRouteBounds: () => void;
  animateToRegion: (region: Region, duration?: number) => void;
}

export interface PartnerGoogleMapViewProps {
  /** Worker's current live GPS coordinates */
  workerLat?: number | null;
  workerLng?: number | null;
  workerHeading?: number | null;

  /** Customer / Destination location */
  customerLat: number;
  customerLng: number;
  customerAddress?: string;
  customerName?: string;

  /** Route coordinates: GeoJSON [lng, lat] array from backend /tracking/route */
  routeCoordinates?: [number, number][];

  /** Traffic layer toggle */
  trafficEnabled?: boolean;

  /** Style for container */
  style?: StyleProp<ViewStyle>;
}

export const PartnerGoogleMapView = forwardRef<PartnerGoogleMapHandle, PartnerGoogleMapViewProps>(
  (
    {
      workerLat,
      workerLng,
      workerHeading = 0,
      customerLat,
      customerLng,
      customerAddress = 'Customer Destination',
      customerName = 'Customer',
      routeCoordinates = [],
      trafficEnabled = false,
      style,
    },
    ref
  ) => {
    const mapRef = useRef<MapView | null>(null);
    const hasInitialCentered = useRef(false);

    // Pulse animation for worker marker
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }, [pulseAnim]);

    const hasValidWorker = isValidCoordinate(workerLat, workerLng);
    const hasValidCustomer = isValidCoordinate(customerLat, customerLng);

    // Parse route coordinates to LatLng array
    const parsedPolyline = useMemo<LatLngCoordinate[]>(() => {
      if (!routeCoordinates || routeCoordinates.length === 0) {
        if (hasValidWorker && hasValidCustomer) {
          return [
            { latitude: workerLat!, longitude: workerLng! },
            { latitude: customerLat, longitude: customerLng },
          ];
        }
        return [];
      }
      return toGoogleMapCoordinates(routeCoordinates, 'geojson');
    }, [routeCoordinates, workerLat, workerLng, customerLat, customerLng, hasValidWorker, hasValidCustomer]);

    // Initial region calculation
    const initialRegion: Region = useMemo(() => {
      const lat = hasValidWorker ? workerLat! : customerLat;
      const lng = hasValidWorker ? workerLng! : customerLng;
      return {
        latitude: lat || 17.4485,
        longitude: lng || 78.3748,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }, [hasValidWorker, workerLat, workerLng, customerLat, customerLng]);

    // Fit camera to both worker and destination on first valid coordinates
    useEffect(() => {
      if (!hasInitialCentered.current && mapRef.current && hasValidWorker && hasValidCustomer) {
        hasInitialCentered.current = true;
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            [
              { latitude: workerLat!, longitude: workerLng! },
              { latitude: customerLat, longitude: customerLng },
            ],
            {
              edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
              animated: true,
            }
          );
        }, 500);
      }
    }, [hasValidWorker, hasValidCustomer, workerLat, workerLng, customerLat, customerLng]);

    const recenterToWorker = useCallback(() => {
      if (mapRef.current && hasValidWorker) {
        mapRef.current.animateToRegion(
          {
            latitude: workerLat!,
            longitude: workerLng!,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          600
        );
      }
    }, [hasValidWorker, workerLat, workerLng]);

    const fitRouteBounds = useCallback(() => {
      if (!mapRef.current) return;
      if (parsedPolyline.length > 1) {
        mapRef.current.fitToCoordinates(parsedPolyline, {
          edgePadding: { top: 120, right: 60, bottom: 240, left: 60 },
          animated: true,
        });
      } else if (hasValidWorker && hasValidCustomer) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: workerLat!, longitude: workerLng! },
            { latitude: customerLat, longitude: customerLng },
          ],
          {
            edgePadding: { top: 120, right: 60, bottom: 240, left: 60 },
            animated: true,
          }
        );
      }
    }, [parsedPolyline, hasValidWorker, hasValidCustomer, workerLat, workerLng, customerLat, customerLng]);

    const animateToRegion = useCallback((region: Region, duration: number = 500) => {
      mapRef.current?.animateToRegion(region, duration);
    }, []);

    useImperativeHandle(ref, () => ({
      recenterToWorker,
      fitRouteBounds,
      animateToRegion,
    }));

    if (!hasValidCustomer && !hasValidWorker) {
      return (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Google Maps...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={trafficEnabled}
          toolbarEnabled={false}
          mapPadding={{ top: 80, right: 16, bottom: 200, left: 16 }}
        >
          {/* Driving Route Polyline */}
          {parsedPolyline.length > 1 && (
            <Polyline
              coordinates={parsedPolyline}
              strokeColor={colors.primary}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Customer Destination Marker */}
          {hasValidCustomer && (
            <Marker
              coordinate={{ latitude: customerLat, longitude: customerLng }}
              anchor={{ x: 0.5, y: 0.9 }}
              title={customerName}
              description={customerAddress}
            >
              <View style={styles.destMarkerWrapper}>
                <View style={styles.destBadge}>
                  <Text style={styles.destBadgeTitle} numberOfLines={1}>
                    {customerName}
                  </Text>
                  <Text style={styles.destBadgeSubtitle} numberOfLines={1}>
                    {customerAddress}
                  </Text>
                </View>
                <View style={styles.destPinBody}>
                  <Ionicons name="home" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.destPinPointer} />
              </View>
            </Marker>
          )}

          {/* Worker / Partner Live Marker */}
          {hasValidWorker && (
            <Marker
              coordinate={{ latitude: workerLat!, longitude: workerLng! }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              rotation={workerHeading ?? 0}
              title="Your Location"
            >
              <View style={styles.workerMarkerContainer}>
                <Animated.View
                  style={[
                    styles.workerRadarRing,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                <View style={styles.workerMarkerCore}>
                  <Ionicons name="bicycle" size={18} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      </View>
    );
  }
);

PartnerGoogleMapView.displayName = 'PartnerGoogleMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Worker live GPS marker
  workerMarkerContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerRadarRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(23, 105, 224, 0.22)',
  },
  workerMarkerCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Destination marker
  destMarkerWrapper: {
    alignItems: 'center',
  },
  destBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 160,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  destBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  destBadgeSubtitle: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  destPinBody: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  destPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DC2626',
    alignSelf: 'center',
    marginTop: -1,
  },
});
