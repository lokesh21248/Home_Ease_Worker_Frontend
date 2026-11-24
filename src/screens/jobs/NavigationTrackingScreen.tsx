import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { CustomHeader } from '../../components/CustomHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation, safeGoBack } from '../../utils/navigationHelper';
import { alertFeedbackService } from '../../services/alertFeedbackService';
import { LocationData } from '../../services/locationService';
import { workerApiService } from '../../api/workerApiService';
import { workerTrackingLifecycle, TrackingStatus } from '../../services/TrackingLifecycleManager';
import {
  currentStepIndex,
  decodePolyline,
  distanceToRouteMeters,
  maneuverIcon,
} from '../../services/trackingPolicy';
import { resolveBookingUuid } from '../../utils/uuid';
import { PartnerGoogleMapView, PartnerGoogleMapHandle } from '../../components/map/PartnerGoogleMapView';

type Props = NativeStackScreenProps<RootStackParamList, 'NavigationTracking'>;

/** Provider (Google Routes) step as returned by GET /tracking/{bookingId}/route. */
interface RouteStep {
  instruction: string;
  maneuver: string;
  distanceMeters: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

interface RouteState {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  staticDurationSeconds: number | null;
  steps: RouteStep[];
  calculatedAtMs: number;
  refreshAfterSeconds: number;
}

/** Support line for the SOS button; configured per build. Never a placeholder number. */
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE?.trim() || '';
const OFF_ROUTE_METERS = 60;
const PERIODIC_REFRESH_MS = 45_000;

function formatKm(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatMinutes(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

const STATUS_LABEL: Record<TrackingStatus['state'], { text: string; color: string }> = {
  IDLE: { text: 'Location sharing off', color: '#6B7280' },
  STARTING: { text: 'Starting GPS...', color: '#6B7280' },
  LIVE: { text: 'Live - customer can see you', color: '#16A34A' },
  RETRYING: { text: 'No connection - retrying', color: '#D97706' },
  PERMISSION_DENIED: { text: 'Location permission denied', color: '#DC2626' },
  GPS_DISABLED: { text: 'GPS is switched off', color: '#DC2626' },
  AUTH_REQUIRED: { text: 'Signed out - sign in again', color: '#DC2626' },
  ENDED: { text: 'Location sharing ended', color: '#6B7280' },
};

export const NavigationTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { updateJobStatus } = useApp();
  const bookingId = resolveBookingUuid(job.bookingId, job.id);

  const mapRef = useRef<PartnerGoogleMapHandle | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>(workerTrackingLifecycle.getStatus());
  const [routeState, setRouteState] = useState<RouteState | null>(null);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);
  const [isArriving, setIsArriving] = useState(false);

  const routeRef = useRef<RouteState | null>(null);
  const routeInFlight = useRef(false);
  const lastRouteAttemptAt = useRef(0);
  const offRouteStrikes = useRef(0);

  // ───────────────────────── provider road route (distance, ETA, steps) ─────────────────────────

  const loadRoute = useCallback(
    async (reason: 'INITIAL' | 'PERIODIC' | 'OFF_ROUTE') => {
      if (routeInFlight.current) return;
      routeInFlight.current = true;
      lastRouteAttemptAt.current = Date.now();
      try {
        const res = await workerApiService.getBookingRoute(bookingId, reason);
        const d = res.data;
        if (res.status === 200 && d?.polyline) {
          const next: RouteState = {
            coordinates: decodePolyline(d.polyline),
            distanceMeters: Number(d.distanceMeters) || 0,
            durationSeconds: Number(d.durationSeconds) || 0,
            staticDurationSeconds: typeof d.staticDurationSeconds === 'number' ? d.staticDurationSeconds : null,
            steps: Array.isArray(d.steps) ? d.steps : [],
            calculatedAtMs: Number(d.calculatedAtEpochMs) || Date.now(),
            refreshAfterSeconds: Number(d.refreshAfterSeconds) || 20,
          };
          routeRef.current = next;
          offRouteStrikes.current = 0;
          setRouteState(next);
          setRouteNotice(null);
        } else if (res.status === 409 && d?.code?.startsWith('WORKER_LOCATION')) {
          setRouteNotice('Waiting for your first GPS fix to plan the route...');
        } else if (res.status === 401) {
          setRouteNotice('Sign in again to load the route.');
        } else if (res.status !== null) {
          setRouteNotice(d?.message || 'Route is temporarily unavailable.');
        } else {
          setRouteNotice('No connection. The route will refresh when you are back online.');
        }
      } catch (e: any) {
        setRouteNotice(e?.message || 'Route is temporarily unavailable.');
      } finally {
        routeInFlight.current = false;
      }
    },
    [bookingId]
  );

  // ───────────────────────── start trip + live GPS ─────────────────────────

  useEffect(() => {
    let mounted = true;
    const unsubscribe = workerTrackingLifecycle.subscribeStatus((s) => {
      if (mounted) setTrackingStatus(s);
    });

    (async () => {
      // The parent ActiveJob action is the SINGLE owner of the server travel transition.
      // Opening/reopening navigation must never send a duplicate status change or try to
      // bypass a failed backend transition.
      if (job.status !== 'travelling') {
        if (mounted) Alert.alert('Travel not started', 'Return to the job and tap Start Travelling first.');
        return;
      }
      await workerTrackingLifecycle.startTravelTracking(
        bookingId,
        (loc) => {
          if (!mounted) return;
          setCurrentLocation({
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading,
            speed: loc.speed,
            accuracy: loc.accuracy,
            locality: '',
            city: '',
          });
          const r = routeRef.current;
          const now = Date.now();
          if (!r) {
            if (now - lastRouteAttemptAt.current > 5_000) void loadRoute('INITIAL');
            return;
          }
          // Off-route: two consecutive fixes > 60 m from the provider polyline -> ask for a new route
          const off = distanceToRouteMeters(loc, r.coordinates) > OFF_ROUTE_METERS;
          offRouteStrikes.current = off ? offRouteStrikes.current + 1 : 0;
          if (offRouteStrikes.current >= 2 && now - lastRouteAttemptAt.current > 8_000) {
            void loadRoute('OFF_ROUTE');
          } else if (now - lastRouteAttemptAt.current > Math.max(PERIODIC_REFRESH_MS, r.refreshAfterSeconds * 1000)) {
            void loadRoute('PERIODIC');
          }
        },
        undefined,
        { latitude: job.location.latitude, longitude: job.location.longitude }
      );
    })();

    return () => {
      mounted = false;
      unsubscribe();
      // Leaving the screen does NOT stop sharing: the partner is still travelling (background task keeps going).
    };
  }, [bookingId, job.location.latitude, job.location.longitude, loadRoute]);

  // ───────────────────────── actions ─────────────────────────

  const callCustomer = () => {
    if (!job.customer.phone) {
      Alert.alert('No phone number', 'This booking has no customer phone number.');
      return;
    }
    void Linking.openURL(`tel:${job.customer.phone}`);
  };

  const messageCustomer = () => {
    if (!job.customer.phone) {
      Alert.alert('No phone number', 'This booking has no customer phone number.');
      return;
    }
    void Linking.openURL(`sms:${job.customer.phone}`);
  };

  const handleSos = () => {
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call 112 (Emergency)', style: 'destructive', onPress: () => void Linking.openURL('tel:112') },
    ];
    if (SUPPORT_PHONE) {
      buttons.splice(1, 0, { text: 'Call HomeEase Support', onPress: () => void Linking.openURL(`tel:${SUPPORT_PHONE}`) });
    }
    Alert.alert(
      'Safety',
      SUPPORT_PHONE
        ? 'Call HomeEase support or emergency services.'
        : 'A HomeEase support line is not configured in this build. For emergencies call 112.',
      buttons
    );
  };

  const handleArrived = async () => {
    if (isArriving) return;
    setIsArriving(true);
    try {
      // The server checks your GPS against the customer's address before issuing the customer's PIN.
      await updateJobStatus('arrived');
      alertFeedbackService.playSuccessFeedback();
      navigation.navigate('ActiveJob', { job: { ...job, bookingId, status: 'arrived' }, bookingId });
    } catch (err: any) {
      Alert.alert('Not marked as arrived', err?.message || 'Please try again when you reach the customer.');
    } finally {
      setIsArriving(false);
    }
  };

  // ───────────────────────── derived display ─────────────────────────

  const steps = routeState?.steps ?? [];
  const stepIdx = currentLocation && steps.length ? currentStepIndex(steps, currentLocation) : -1;
  const step = stepIdx >= 0 ? steps[stepIdx] : null;
  const metersToStepEnd =
    step && currentLocation
      ? Math.round(
          distanceToRouteMeters(currentLocation, [[step.endLng, step.endLat]])
        )
      : null;
  const status = STATUS_LABEL[trackingStatus.state];
  const arrivalClock = routeState
    ? new Date(routeState.calculatedAtMs + routeState.durationSeconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const initials = (job.customer.name || '?')
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Navigation"
        subtitle={`To ${job.customer.name}'s location`}
        showBack
        onBack={() => safeGoBack(navigation, 'ActiveJob', { jobId: job.id, job })}
      />

      {/* Turn-by-turn: the provider's own instruction for the current step, or an honest placeholder */}
      <View style={styles.turnBanner}>
        <View style={styles.turnIconCircle}>
          <Ionicons name={(step ? maneuverIcon(step.maneuver) : 'navigate') as any} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.turnInfoCol}>
          {step ? (
            <>
              <Text style={styles.turnDistance}>
                {metersToStepEnd !== null ? `In ${formatKm(metersToStepEnd)}` : ''}
              </Text>
              <Text style={styles.turnInstruction} numberOfLines={2}>
                {step.instruction || 'Continue on the route'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.turnDistance}>Turn-by-turn</Text>
              <Text style={styles.turnInstruction} numberOfLines={2}>
                {routeNotice || 'Loading route...'} Tap Maps for voice navigation.
              </Text>
            </>
          )}
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedText}>
            {currentLocation?.speed && currentLocation.speed > 0 ? Math.round(currentLocation.speed * 3.6) : 0}
          </Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>

      <View style={styles.mapArea}>
        <PartnerGoogleMapView
          ref={mapRef}
          workerLat={currentLocation?.latitude}
          workerLng={currentLocation?.longitude}
          workerHeading={currentLocation?.heading}
          customerLat={job.location.latitude}
          customerLng={job.location.longitude}
          customerAddress={job.location.address}
          customerName={job.customer.name}
          routeCoordinates={routeState?.coordinates ?? []}
          trafficEnabled={trafficEnabled}
        />

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapBtn}
            activeOpacity={0.8}
            onPress={() => mapRef.current?.recenterToWorker()}
            accessibilityLabel="Recenter on my position"
          >
            <Ionicons name="locate-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapBtn, trafficEnabled && styles.mapBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTrafficEnabled((prev) => !prev)}
            accessibilityLabel="Toggle traffic"
          >
            <Ionicons name="layers-outline" size={20} color={trafficEnabled ? colors.primary : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Road distance + traffic-aware ETA from the routing provider only; nothing is estimated on the phone */}
        <View style={styles.etaFloatingBar}>
          <View style={styles.etaCol}>
            <Text style={styles.etaValue}>{routeState ? formatMinutes(routeState.durationSeconds) : '--'}</Text>
            <Text style={styles.etaLabel}>
              {routeState
                ? `${formatKm(routeState.distanceMeters)} by road${
                    routeState.staticDurationSeconds !== null &&
                    routeState.durationSeconds > routeState.staticDurationSeconds + 60
                      ? ' - traffic'
                      : ''
                  }`
                : routeNotice || 'Calculating route...'}
            </Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.arrivalCol}>
            <Text style={styles.arrivalLabel}>Est. Arrival</Text>
            <Text style={styles.arrivalValue}>{arrivalClock || '--:--'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.dragPill} />

        <View style={styles.statusPillRow}>
          <View style={[styles.statusPill, { backgroundColor: '#F3F4F6' }]}>
            <View style={[styles.statusPillDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
        {trackingStatus.message ? <Text style={styles.noticeText}>{trackingStatus.message}</Text> : null}

        <View style={styles.customerRow}>
          {job.customer.avatar ? (
            <Image source={{ uri: job.customer.avatar }} style={styles.customerAvatar} />
          ) : (
            <View style={[styles.customerAvatar, styles.avatarInitials]}>
              <Text style={styles.avatarInitialsText}>{initials}</Text>
            </View>
          )}
          <View style={styles.customerMeta}>
            <Text style={styles.customerName}>{job.customer.name}</Text>
            <Text style={styles.jobType}>{job.serviceName}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.circleActionButton} activeOpacity={0.8} onPress={callCustomer}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleActionButton} activeOpacity={0.8} onPress={messageCustomer}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>SMS</Text>
          </TouchableOpacity>

          {/* Full voice turn-by-turn navigation is delegated to Google Maps (Navigation intent) */}
          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() =>
              openTurnByTurnNavigation({
                latitude: job.location.latitude,
                longitude: job.location.longitude,
                label: `${job.customer.name} - ${job.serviceName}`,
                address: job.location.address,
              })
            }
          >
            <Ionicons name="navigate-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.circleActionText}>Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleActionButton} activeOpacity={0.8} onPress={handleSos}>
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title={isArriving ? 'Confirming arrival...' : 'I have arrived - notify customer'}
          size="lg"
          fullWidth
          loading={isArriving}
          onPress={handleArrived}
          icon={<Ionicons name="location-outline" size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  noticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  avatarInitials: {
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  turnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnInfoCol: {
    flex: 1,
  },
  turnDistance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  turnInstruction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  speedPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  speedUnit: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#EAF0FC',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridHorizontal1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D6E2F7',
  },
  mapGridHorizontal2: {
    position: 'absolute',
    top: '65%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D6E2F7',
  },
  mapGridVertical1: {
    position: 'absolute',
    left: '35%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D6E2F7',
  },
  mapGridVertical2: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D6E2F7',
  },
  routeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerPin: {
    position: 'absolute',
    bottom: '22%',
    left: '28%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  workerPulseCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(36, 84, 214, 0.25)',
  },
  roadTrack: {
    position: 'absolute',
    bottom: '26%',
    left: '33%',
    width: '42%',
    height: 140,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 60,
  },
  roadProgressTrack: {
    width: '100%',
    height: '100%',
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: colors.primary,
    borderTopRightRadius: 60,
  },
  destinationPin: {
    position: 'absolute',
    top: '25%',
    right: '22%',
    alignItems: 'center',
  },
  destBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  destBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  mapBtnActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  etaFloatingBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  etaCol: {
    flex: 1,
  },
  etaValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  etaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  etaDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  arrivalCol: {
    alignItems: 'flex-end',
  },
  arrivalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  arrivalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    ...shadows.md,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  customerMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  jobType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  circleActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  circleActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatScroll: {
    flex: 1,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  chatBubbleWorker: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  chatBubbleCustomer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTextWorker: {
    color: '#FFFFFF',
  },
  chatTextCustomer: {
    color: colors.textPrimary,
  },
  chatTimeText: {
    fontSize: 10,
    marginTop: 4,
  },
  chatTimeWorker: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  chatTimeCustomer: {
    color: colors.textSecondary,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  chatTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
});

export default NavigationTrackingScreen;
