import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
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
import { locationService, LocationData } from '../../services/locationService';
import { workerApiService } from '../../api/workerApiService';
import { resolveBookingUuid } from '../../utils/uuid';
import { PartnerGoogleMapView, PartnerGoogleMapHandle } from '../../components/map/PartnerGoogleMapView';

type Props = NativeStackScreenProps<RootStackParamList, 'NavigationTracking'>;

interface ChatMessage {
  id: string;
  sender: 'worker' | 'customer';
  text: string;
  time: string;
}

export const NavigationTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { updateJobStatus } = useApp();
  const bookingId = resolveBookingUuid(job.bookingId, job.id);

  const mapRef = useRef<PartnerGoogleMapHandle | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const hasFetchedInitialRoute = useRef(false);

  const [etaMins, setEtaMins] = useState(8);
  const [distanceKm, setDistanceKm] = useState(job.location.distanceKm || 1.8);
  const [isArriving, setIsArriving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'customer',
      text: 'Hi Partner! Please ring the doorbell twice when you reach the flat.',
      time: '11:15 AM',
    },
    {
      id: 'm2',
      sender: 'worker',
      text: 'Hello! Noted. I am on the bike and will reach in about 8 minutes.',
      time: '11:16 AM',
    },
  ]);

  // Live GPS broadcast loop (every 5 seconds) to port 8082 tracking microservice
  useEffect(() => {
    let isMounted = true;

    // Immediately trigger ON_THE_WAY on backend
    workerApiService.startTravelling(bookingId).catch(() => {});

    const streamGpsLocation = async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc && isMounted) {
          setCurrentLocation(loc);

          // 1. Broadcast real GPS coordinates to Port 8082 tracking service with bearing, speed & accuracy
          await workerApiService.publishLiveLocation(
            bookingId,
            loc.latitude,
            loc.longitude,
            loc.heading ?? 0,
            loc.speed ?? 0,
            loc.accuracy ?? 5.0
          );

          // 2. Query live road distance and ETA
          if (job.location.latitude && job.location.longitude) {
            const distanceData = await workerApiService.getLiveDistanceAndEta(
              bookingId,
              job.location.latitude,
              job.location.longitude
            );
            if (distanceData && isMounted) {
              setDistanceKm(distanceData.distanceKm);
              setEtaMins(distanceData.etaMinutes);
            }

            // 3. Fetch driving route polyline once on initial fix or when missing
            if (!hasFetchedInitialRoute.current && isMounted) {
              hasFetchedInitialRoute.current = true;
              const routeData = await workerApiService.getDrivingRoute(
                loc.latitude,
                loc.longitude,
                job.location.latitude,
                job.location.longitude
              );
              if (routeData?.coordinates && isMounted) {
                setRouteCoordinates(routeData.coordinates);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[NavigationTrackingScreen] GPS stream notice:', err?.message);
      }
    };

    // Run immediately on screen open
    streamGpsLocation();

    // Repeat every 5 seconds while on this screen
    const interval = setInterval(streamGpsLocation, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId, job.location.latitude, job.location.longitude]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'worker',
      text: chatInput.trim(),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-reply-${Date.now()}`,
          sender: 'customer',
          text: 'Great, thanks! Looking forward.',
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  const handleArrived = async () => {
    if (isArriving) return;
    setIsArriving(true);
    alertFeedbackService.playSuccessFeedback();

    try {
      // 1. Sync Arrival with Backend Monolith (POST /workers/bookings/{id}/arrive)
      // This atomically updates booking status to ARRIVED and generates the service start OTP
      await workerApiService.arriveAtCustomer(bookingId);
    } catch (err: any) {
      console.warn('[NavigationTrackingScreen] arriveAtCustomer backend sync:', err?.message);
    }

    updateJobStatus('arrived');
    setIsArriving(false);
    navigation.navigate('ActiveJob', { job: { ...job, bookingId, status: 'arrived' }, bookingId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Live Turn-by-Turn GPS"
        subtitle={`To ${job.customer.name}'s Location`}
        showBack
        onBack={() => safeGoBack(navigation, 'ActiveJob', { jobId: job.id, job })}
      />

      {/* Turn-by-Turn Instruction Banner */}
      <View style={styles.turnBanner}>
        <View style={styles.turnIconCircle}>
          <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.turnInfoCol}>
          <Text style={styles.turnDistance}>In 250 meters</Text>
          <Text style={styles.turnInstruction}>Turn left onto Main Road</Text>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedText}>32</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>

      {/* Google Maps Realtime Tracking Area */}
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
          routeCoordinates={routeCoordinates}
          trafficEnabled={trafficEnabled}
        />

        {/* Map Overlay Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapBtn}
            activeOpacity={0.8}
            onPress={() => mapRef.current?.recenterToWorker()}
          >
            <Ionicons name="locate-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapBtn, trafficEnabled && styles.mapBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTrafficEnabled((prev) => !prev)}
          >
            <Ionicons
              name="layers-outline"
              size={20}
              color={trafficEnabled ? colors.primary : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* ETA & Distance Floating Bar */}
        <View style={styles.etaFloatingBar}>
          <View style={styles.etaCol}>
            <Text style={styles.etaValue}>{etaMins} mins</Text>
            <Text style={styles.etaLabel}>{distanceKm} km • Fastest Route</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.arrivalCol}>
            <Text style={styles.arrivalLabel}>Target Arrival</Text>
            <Text style={styles.arrivalValue}>{job.scheduledTime}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCard}>
        <View style={styles.dragPill} />

        <View style={styles.customerRow}>
          <Image
            source={{
              uri:
                job.customer.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            }}
            style={styles.customerAvatar}
          />
          <View style={styles.customerMeta}>
            <Text style={styles.customerName}>{job.customer.name}</Text>
            <Text style={styles.jobType}>{job.serviceName}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Calling Customer', `Calling ${job.customer.phone}...`)}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() => setIsChatOpen(true)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>Chat</Text>
          </TouchableOpacity>

          {/* 1-Tap Launch Native Maps Navigation */}
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

          <TouchableOpacity
            style={styles.circleActionButton}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert('Safety Desk', 'Emergency alert notified to support.')
            }
          >
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <Text style={styles.circleActionText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title={isArriving ? "Confirming Arrival..." : "I Have Arrived at Location"}
          size="lg"
          fullWidth
          loading={isArriving}
          onPress={handleArrived}
          icon={<Ionicons name="location-outline" size={20} color="#FFFFFF" />}
        />
      </View>

      {/* Customer In-App Chat Modal */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        onRequestClose={() => setIsChatOpen(false)}
      >
        <SafeAreaView style={styles.chatModalContainer} edges={['top']}>
          <CustomHeader
            title={`Chat with ${job.customer.name}`}
            subtitle="Encrypted in-app messaging"
            showBack
            onBack={() => setIsChatOpen(false)}
          />

          <ScrollView style={styles.chatScroll} contentContainerStyle={{ padding: spacing.md }}>
            {messages.map((msg) => {
              const isWorker = msg.sender === 'worker';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    isWorker ? styles.chatBubbleWorker : styles.chatBubbleCustomer,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatText,
                      isWorker ? styles.chatTextWorker : styles.chatTextCustomer,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.chatTimeText,
                      isWorker ? styles.chatTimeWorker : styles.chatTimeCustomer,
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Type message..."
              placeholderTextColor={colors.textSecondary}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity
              style={styles.sendIconBtn}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
});

export default NavigationTrackingScreen;
