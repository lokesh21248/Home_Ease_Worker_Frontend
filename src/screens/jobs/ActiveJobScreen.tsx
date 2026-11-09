import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Job, JobStatus } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation } from '../../utils/navigationHelper';
import { resolveBookingUuid } from '../../utils/uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveJob'>;

const STATUS_STEPS: { key: JobStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'travelling', label: 'Travelling', icon: 'bicycle-outline' },
  { key: 'arrived', label: 'Arrived', icon: 'location-outline' },
  { key: 'started', label: 'In Progress', icon: 'timer-outline' },
  { key: 'completed', label: 'Completed', icon: 'shield-checkmark-outline' },
];

export const ActiveJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialJob = route.params?.job;
  const { activeJob, updateJobStatus, services, verifyJobPin, addSubServiceToJob } = useApp();

  const currentJob: Job | null = activeJob || initialJob || null;

  // Live Stopwatch timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(
    currentJob?.status === 'started'
  );

  // 4-Digit Doorstep Security PIN Verification
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [pinError, setPinError] = useState<string>('');
  const pinRefs = useRef<React.ElementRef<typeof TextInput>[]>([]);
  const pinShakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pinError && pinError.toLowerCase().includes('pin')) {
      Animated.sequence([
        Animated.timing(pinShakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(pinShakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(pinShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(pinShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(pinShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [pinError]);

  // Extra Sub-Service Upsell Modal
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState<boolean>(false);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string>(
    'aa6fa960-d2fd-4cd6-8ed1-730d1e1a1cf0'
  );
  const [upsellQuantity, setUpsellQuantity] = useState<number>(1);

  // Service checklist items
  const [checklist, setChecklist] = useState([
    { id: 1, title: 'Identity & Safety Verification', done: true },
    { id: 2, title: 'Pre-service Inspection & Photo capture', done: true },
    { id: 3, title: 'Deep Service Execution & Treatment', done: currentJob?.status === 'started' },
    { id: 4, title: 'Post-service Area Cleanup & Polish', done: false },
    { id: 5, title: 'Customer Satisfaction Review & Sign-off', done: false },
  ]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleStartJob = () => {
    setPinError('');
    setPinDigits(['', '', '', '']);
    setIsPinModalOpen(true);
    // Auto-focus first digit after modal opens
    setTimeout(() => { pinRefs.current[0]?.focus(); }, 300);
  };

  const handleVerifyPinSubmit = async () => {
    const fullPin = pinDigits.join('').trim();
    if (fullPin.length !== 4) {
      setPinError('Please enter the full 4-digit security PIN.');
      return;
    }

    setPinError('');

    const activeBookingId = resolveBookingUuid(
      (route.params as any)?.bookingId,
      (route.params as any)?.booking?.bookingId,
      (route.params as any)?.booking?.id,
      currentJob?.bookingId,
      currentJob?.id
    );

    const res = await verifyJobPin(activeBookingId, fullPin);
    if (res.success) {
      setIsTimerRunning(true);
      setIsPinModalOpen(false);
      Alert.alert('Job Started', res.message || 'Job started successfully!');
    } else {
      setPinError(res.message);
      if (res.errorCode !== 'INVALID_PIN') {
        Alert.alert('Notice', res.message);
      }
    }
  };

  const handleConfirmUpsell = async () => {
    const bookingId = resolveBookingUuid(currentJob?.bookingId, currentJob?.id);
    const res = await addSubServiceToJob(bookingId, selectedSubServiceId, upsellQuantity);
    if (res.success) {
      setIsUpsellModalOpen(false);
      setUpsellQuantity(1);
      Alert.alert('Extra Service Added', res.message);
    }
  };

  const handleCompleteJob = () => {
    if (currentJob) {
      navigation.navigate('JobCompletion', { job: currentJob });
    }
  };

  const getStepIndex = (status: JobStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = currentJob ? getStepIndex(currentJob.status) : 0;

  if (!currentJob) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CustomHeader
          title="Active Job"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        />
        <EmptyState
          icon="briefcase-outline"
          title="No Active Job in Progress"
          description="Accept an incoming service request from your dashboard to view active details and live navigation here."
          actionLabel="Go to Dashboard"
          onAction={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title={`Active Job #${currentJob.jobId}`}
        subtitle={currentJob.serviceName}
        showBack
        onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progression Stepper */}
        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Service Progression</Text>
          <View style={styles.stepperRow}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isActive = isCurrent || isPast;

              return (
                <React.Fragment key={step.key}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        isActive && styles.stepDotActive,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={isActive ? '#FFFFFF' : colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < currentStepIdx && styles.stepLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </PremiumCard>

        {/* Live Stopwatch Card */}
        <PremiumCard style={styles.timerCard}>
          <View style={styles.timerHeaderRow}>
            <View style={styles.timerPill}>
              <View
                style={[
                  styles.recordingPulse,
                  currentJob.status === 'started' && styles.pulseActive,
                ]}
              />
              <Text style={styles.timerPillText}>
                {currentJob.status === 'started' ? 'LIVE ON SITE' : 'STANDBY'}
              </Text>
            </View>
            <Text style={styles.estDuration}>Est: {currentJob.estimatedDuration}</Text>
          </View>

          <View style={styles.timerDisplay}>
            <Text style={styles.timerDigits}>{formatTimer(secondsElapsed)}</Text>
            <Text style={styles.timerUnit}>Elapsed Working Time</Text>
          </View>

          <View style={styles.timelineDetailsRow}>
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLbl}>Accepted</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.acceptedAt || '09:15 AM'}</Text>
            </View>
            <View style={styles.timelineDivider} />
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLbl}>Arrived</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.arrivedAt || '09:50 AM'}</Text>
            </View>
            <View style={styles.timelineDivider} />
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLbl}>Started</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.startedAt || '10:05 AM'}</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Customer Card with Call & Address */}
        <PremiumCard style={styles.card}>
          <View style={styles.customerRow}>
            <Image
              source={{
                uri:
                  currentJob.customer.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{currentJob.customer.name}</Text>
              <Text style={styles.customerPhone}>{currentJob.customer.phone}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {currentJob.location.address}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.callCircle}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Calling Customer', `Dialing ${currentJob.customer.phone}`)}
            >
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Turn-by-Turn GPS Navigation Launcher */}
          <View style={styles.navRowWrapper}>
            <TouchableOpacity
              style={styles.primaryNavBtn}
              activeOpacity={0.85}
              onPress={() =>
                openTurnByTurnNavigation({
                  latitude: currentJob.location.latitude,
                  longitude: currentJob.location.longitude,
                  label: `${currentJob.customer.name} - ${currentJob.serviceName}`,
                  address: currentJob.location.address,
                })
              }
            >
              <Ionicons name="navigate-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryNavBtnText}>
                Turn-by-Turn GPS ({currentJob.location.distanceKm} km)
              </Text>
              <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryNavBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('NavigationTracking', { job: currentJob })}
            >
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </PremiumCard>

        {/* Service Standard Checklist */}
        <PremiumCard style={styles.card}>
          <View style={styles.checklistHeaderRow}>
            <Text style={styles.cardTitle}>Service SOP Checklist</Text>
            <View style={styles.completedCountPill}>
              <Text style={styles.completedCountText}>
                {checklist.filter((i) => i.done).length}/{checklist.length} Done
              </Text>
            </View>
          </View>
          <Text style={styles.checklistSub}>
            Complete each step to maintain 5-star partner compliance:
          </Text>

          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistItem}
              activeOpacity={0.7}
              onPress={() => toggleChecklistItem(item.id)}
            >
              <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                {item.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text
                style={[
                  styles.checklistText,
                  item.done && styles.checklistTextDone,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </PremiumCard>

        {/* Added Extra Sub-Services (Upsells) Card */}
        {currentJob.subServices && currentJob.subServices.length > 0 && (
          <PremiumCard style={styles.card}>
            <View style={styles.checklistHeaderRow}>
              <Text style={styles.cardTitle}>On-Site Added Add-ons</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Add-on Active</Text>
              </View>
            </View>
            {currentJob.subServices.map((sub, idx) => (
              <View key={idx} style={styles.extraServiceItem}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.extraServiceName}>{sub.name}</Text>
                  <Text style={styles.extraServiceQty}>Qty: {sub.quantity} × ₹{sub.price}</Text>
                </View>
                <Text style={styles.extraServiceAmount}>+₹{sub.quantity * sub.price}</Text>
              </View>
            ))}
          </PremiumCard>
        )}

        {/* Upsell Trigger Card when in progress */}
        {currentJob.status === 'started' && (
          <PremiumCard style={styles.upsellActionCard}>
            <View style={styles.upsellLeft}>
              <View style={styles.upsellIconWrap}>
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={styles.upsellCardTitle}>Customer Needs Extra Repairs?</Text>
                <Text style={styles.upsellCardSub}>Add sub-services directly to this invoice</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addUpsellBtn}
              activeOpacity={0.8}
              onPress={() => setIsUpsellModalOpen(true)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addUpsellBtnText}>Add Service</Text>
            </TouchableOpacity>
          </PremiumCard>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {currentJob.status !== 'started' ? (
          <PrimaryButton
            title="Verify Doorstep PIN & Start"
            size="lg"
            fullWidth
            onPress={handleStartJob}
            icon={<Ionicons name="keypad-outline" size={20} color="#FFFFFF" />}
          />
        ) : (
          <PrimaryButton
            title="Complete Job & Upload Proofs"
            size="lg"
            fullWidth
            onPress={handleCompleteJob}
            icon={<Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />}
          />
        )}
      </View>

      {/* 4-Digit Doorstep Security PIN Modal */}
      <Modal visible={isPinModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pinModalCard}>
            <View style={styles.pinModalIconCircle}>
              <Ionicons name="keypad-outline" size={28} color={colors.primary} />
            </View>

            <Text style={styles.pinModalTitle}>Enter Customer PIN</Text>
            <Text style={styles.pinModalSubtitle}>
              Ask the customer for their 4-digit security code to start the service:
            </Text>

            {/* 4 PIN Digit Boxes */}
            <Animated.View
              style={[styles.pinBoxesRow, { transform: [{ translateX: pinShakeAnim }] }]}
            >
              {pinDigits.map((d, i) => (
                <TextInput
                  key={i}
                  style={[
                    styles.pinDigitBox,
                    Boolean(d) && styles.pinDigitBoxFilled,
                    Boolean(pinError) && styles.pinDigitBoxError,
                  ]}
                  value={d}
                  onChangeText={(val) => {
                    const updated = [...pinDigits];
                    updated[i] = val.slice(-1);
                    setPinDigits(updated);
                    if (pinError) setPinError('');
                    // Auto-advance to next box
                    if (val.length > 0 && i < 3) {
                      pinRefs.current[i + 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  ref={(r) => { if (r) pinRefs.current[i] = r; }}
                  autoFocus={i === 0}
                />
              ))}
            </Animated.View>

            {pinError ? (
              <Text style={styles.pinErrorText}>{pinError}</Text>
            ) : (
              <View style={styles.demoPinNotice}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                <Text style={styles.demoPinNoticeText}>
                  Ask the customer for the 4-digit Service Start PIN shown on their HomeEase tracking screen.
                </Text>
              </View>
            )}

            <PrimaryButton
              title="Verify PIN & Unlock Job"
              size="lg"
              fullWidth
              onPress={handleVerifyPinSubmit}
              style={{ marginTop: spacing.md }}
            />

            <SecondaryButton
              title="Cancel"
              size="md"
              fullWidth
              variant="subtle"
              onPress={() => {
                setIsPinModalOpen(false);
                setPinDigits(['', '', '', '']);
                setPinError('');
              }}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        </View>
      </Modal>

      {/* Extra Sub-Service Upsell Modal */}
      <Modal visible={isUpsellModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.upsellModalCard}>
            <View style={styles.upsellModalHeader}>
              <View>
                <Text style={styles.upsellModalTitle}>Add Extra Service</Text>
                <Text style={styles.upsellModalSubtitle}>On-site customer upsell request</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsUpsellModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.upsellSubLabel}>Select Service Add-On:</Text>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {services
                .flatMap((cat) => cat.subServices || [])
                .map((sub) => {
                  const isSelected = selectedSubServiceId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setSelectedSubServiceId(sub.id)}
                      style={[
                        styles.subServiceSelectCard,
                        isSelected && styles.subServiceSelectCardActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.subServiceSelectName,
                            isSelected && styles.subServiceSelectNameActive,
                          ]}
                        >
                          {sub.name}
                        </Text>
                        {sub.description ? (
                          <Text style={styles.subServiceSelectDesc}>{sub.description}</Text>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.subServiceSelectPrice,
                          isSelected && styles.subServiceSelectPriceActive,
                        ]}
                      >
                        ₹{sub.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Quantity Selector */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity:</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setUpsellQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{upsellQuantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setUpsellQuantity((q) => q + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <PrimaryButton
              title="Add Extra Service to Booking"
              size="lg"
              fullWidth
              onPress={handleConfirmUpsell}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginHorizontal: 2,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  timerCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  recordingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  pulseActive: {
    backgroundColor: colors.primary,
  },
  timerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  estDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  timerDigits: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  timerUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  timelineDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  timelineCol: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  timelineLbl: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timelineVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },
  customerMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  callCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowWrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  primaryNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryNavBtn: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completedCountPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  completedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  checklistSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checklistText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  checklistTextDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  badgePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  extraServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  extraServiceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  extraServiceQty: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  extraServiceAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  upsellActionCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upsellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upsellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  upsellCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addUpsellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addUpsellBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pinModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  pinModalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pinModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pinModalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  pinBoxesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pinDigitBox: {
    width: 52,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  pinDigitBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  pinDigitBoxError: {
    borderColor: colors.danger,
  },
  pinErrorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  demoPinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  demoPinNoticeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  upsellModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  upsellModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  upsellModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  upsellModalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  upsellSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subServiceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  subServiceSelectCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  subServiceSelectName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subServiceSelectNameActive: {
    color: colors.primary,
  },
  subServiceSelectDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subServiceSelectPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  subServiceSelectPriceActive: {
    color: colors.primary,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default ActiveJobScreen;
