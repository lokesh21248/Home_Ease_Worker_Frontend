import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Job, JobStatus } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation } from '../../utils/navigationHelper';
import { resolveBookingUuid } from '../../utils/uuid';
import { mockJobs } from '../../mock/jobs';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveJob'>;

const STATUS_STEPS: { key: JobStatus; label: string; icon: string }[] = [
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { key: 'travelling', label: 'Travelling', icon: 'bicycle' },
  { key: 'arrived', label: 'Arrived', icon: 'location' },
  { key: 'started', label: 'In Progress', icon: 'timer' },
  { key: 'completed', label: 'Completed', icon: 'shield-checkmark' },
];

export const ActiveJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialJob = route.params?.job;
  const { activeJob, updateJobStatus, services, verifyJobPin, addSubServiceToJob } = useApp();

  const currentJob: Job =
    activeJob ||
    initialJob ||
    mockJobs.find((j) => j.bookingId === (route.params as any)?.bookingId) ||
    mockJobs[0];

  // Live Stopwatch timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(1420);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(
    currentJob.status === 'started'
  );

  // 4-Digit Doorstep Security PIN Verification (POST /workers/bookings/{id}/verify-pin)
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['4', '8', '2', '1']);
  const [pinError, setPinError] = useState<string>('');

  // Extra Sub-Service Upsell Modal (POST /workers/bookings/{id}/add-sub-service)
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState<boolean>(false);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string>(
    'aa6fa960-d2fd-4cd6-8ed1-730d1e1a1cf0'
  );
  const [upsellQuantity, setUpsellQuantity] = useState<number>(1);

  // Service checklist items
  const [checklist, setChecklist] = useState([
    { id: 1, title: 'Identity & Safety Mask Verification', done: true },
    { id: 2, title: 'Pre-service Inspection & Photo capture', done: true },
    { id: 3, title: 'Deep Service Execution & Treatment', done: currentJob.status === 'started' },
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
    // Open Customer Doorstep 4-digit PIN verification modal
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPinSubmit = async () => {
    const fullPin = pinDigits.join('').trim();
    if (fullPin.length !== 4) {
      setPinError('Please enter the full 4-digit security PIN.');
      return;
    }

    setPinError('');

    // ✅ Pass the real Booking UUID: Always use the bookingId from the accepted dispatch (e.g. c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a)
    // Ensures local mock strings (like 'job-req-003') never leak into backend API routes
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
    navigation.navigate('JobCompletion', { job: currentJob });
  };

  const getStepIndex = (status: JobStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIdx = getStepIndex(currentJob.status);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Active Job ${currentJob.jobId}`}
        subtitle={currentJob.serviceName}
        showBack
        onBack={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Stepper Tracker */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Service Progression Flow</Text>
          <View style={styles.stepperRow}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <React.Fragment key={step.key}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        isPast && styles.stepDotPast,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={14}
                        color={
                          isCurrent || isPast ? colors.textInverse : colors.textMuted
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        (isCurrent || isPast) && styles.stepLabelActive,
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
        </View>

        {/* Live Timer Card (When started) */}
        <View style={styles.timerCard}>
          <View style={styles.timerHeaderRow}>
            <View style={styles.timerPill}>
              <View style={styles.recordingPulse} />
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
              <Text style={styles.timelineLbl}>Accepted At</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.acceptedAt || '09:15 AM'}</Text>
            </View>
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLbl}>Arrived At</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.arrivedAt || '09:50 AM'}</Text>
            </View>
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLbl}>Started At</Text>
              <Text style={styles.timelineVal}>{currentJob.timeline.startedAt || '10:05 AM'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Card with Call & Address */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Image source={{ uri: currentJob.customer.avatar }} style={styles.avatar} />
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
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 1-Tap Turn-by-Turn GPS Navigation Launchers */}
          <View style={styles.navRowWrapper}>
            <TouchableOpacity
              style={styles.primaryNavBtn}
              activeOpacity={0.8}
              onPress={() =>
                openTurnByTurnNavigation({
                  latitude: currentJob.location.latitude,
                  longitude: currentJob.location.longitude,
                  label: `${currentJob.customer.name} - ${currentJob.serviceName}`,
                  address: currentJob.location.address,
                })
              }
            >
              <Ionicons name="navigate" size={18} color={colors.textInverse} />
              <Text style={styles.primaryNavBtnText}>
                Turn-by-Turn GPS ({currentJob.location.distanceKm} km)
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.textInverse} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryNavBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NavigationTracking', { job: currentJob })}
            >
              <Ionicons name="map-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Standard Checklist */}
        <View style={styles.card}>
          <View style={styles.checklistHeaderRow}>
            <Text style={styles.sectionHeader}>Service SOP Checklist</Text>
            <Text style={styles.completedCount}>
              {checklist.filter((i) => i.done).length}/{checklist.length} Completed
            </Text>
          </View>
          <Text style={styles.checklistSub}>
            Tap items as you complete them to maintain 5-star partner compliance:
          </Text>

          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistItem}
              activeOpacity={0.7}
              onPress={() => toggleChecklistItem(item.id)}
            >
              <View
                style={[styles.checkbox, item.done && styles.checkboxDone]}
              >
                {item.done && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
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
        </View>

        {/* Added Extra Sub-Services (Upsells) Card */}
        {currentJob.subServices && currentJob.subServices.length > 0 && (
          <View style={styles.card}>
            <View style={styles.checklistHeaderRow}>
              <Text style={styles.sectionHeader}>On-Site Added Sub-Services</Text>
              <Badge label="Upsell Active" variant="success" size="sm" />
            </View>
            {currentJob.subServices.map((sub, idx) => (
              <View key={idx} style={styles.extraServiceItem}>
                <Ionicons name="add-circle" size={18} color={colors.success} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.extraServiceName}>{sub.name}</Text>
                  <Text style={styles.extraServiceQty}>Qty: {sub.quantity} × ₹{sub.price}</Text>
                </View>
                <Text style={styles.extraServiceAmount}>+₹{sub.quantity * sub.price}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Upsell Trigger Button when job is in progress */}
        {currentJob.status === 'started' && (
          <View style={styles.upsellActionCard}>
            <View style={styles.upsellLeft}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.upsellCardTitle}>Customer Needs Extra Repairs?</Text>
                <Text style={styles.upsellCardSub}>Add sub-services directly to this booking invoice</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addUpsellBtn}
              activeOpacity={0.8}
              onPress={() => setIsUpsellModalOpen(true)}
            >
              <Ionicons name="add" size={16} color={colors.textInverse} />
              <Text style={styles.addUpsellBtnText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {currentJob.status !== 'started' ? (
          <Button
            title="Verify Doorstep PIN & Start ⏱️"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleStartJob}
          />
        ) : (
          <Button
            title="Complete Job & Upload Proofs 📸"
            variant="success"
            size="lg"
            fullWidth
            onPress={handleCompleteJob}
            icon={<Ionicons name="checkmark-done" size={20} color={colors.textInverse} />}
          />
        )}
      </View>

      {/* 4-Digit Customer PIN Verification Modal (POST /workers/bookings/{id}/verify-pin) */}
      <Modal visible={isPinModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pinModalCard}>
            <View style={styles.pinModalIconCircle}>
              <Ionicons name="keypad" size={28} color={colors.primary} />
            </View>

            <Text style={styles.pinModalTitle}>Enter Customer PIN</Text>
            <Text style={styles.pinModalSubtitle}>
              Ask the customer for their 4-digit security code to start the service:
            </Text>

            {/* 4 PIN Digit Boxes */}
            <View style={styles.pinBoxesRow}>
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
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {pinError ? (
              <Text style={styles.pinErrorText}>{pinError}</Text>
            ) : (
              <View style={styles.demoPinNotice}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={styles.demoPinNoticeText}>
                  Default Customer Security PIN: {currentJob.pinCode || '4821'}
                </Text>
              </View>
            )}

            <Button
              title="Verify PIN & Unlock Job"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleVerifyPinSubmit}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity
              onPress={() => setIsPinModalOpen(false)}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Extra Sub-Service Upsell Modal (POST /workers/bookings/{id}/add-sub-service) */}
      <Modal visible={isUpsellModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.upsellModalCard}>
            <View style={styles.upsellModalHeader}>
              <View>
                <Text style={styles.upsellModalTitle}>Add Extra Sub-Service</Text>
                <Text style={styles.upsellModalSubtitle}>On-site customer upsell request</Text>
              </View>
              <TouchableOpacity onPress={() => setIsUpsellModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.upsellSubLabel}>Select Service Add-On:</Text>
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
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
                        {sub.description && (
                          <Text style={styles.subServiceSelectDesc}>{sub.description}</Text>
                        )}
                      </View>
                      <Text style={styles.subServiceSelectPrice}>₹{sub.price}</Text>
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

            <Button
              title="Add Extra Service to Booking"
              variant="success"
              size="lg"
              fullWidth
              onPress={handleConfirmUpsell}
              style={{ marginTop: spacing.lg }}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  sectionHeader: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
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
    width: 52,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotPast: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  timerCard: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  recordingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  timerPillText: {
    ...typography.caption,
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  estDuration: {
    ...typography.caption,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerUnit: {
    ...typography.caption,
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  timelineCol: {
    alignItems: 'center',
  },
  timelineLbl: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 10,
  },
  timelineVal: {
    ...typography.subtitle2,
    color: '#F8FAFC',
    fontWeight: '700',
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceAlt,
  },
  customerMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  customerPhone: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  callCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedCount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  checklistSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checklistText: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
  },
  checklistTextDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pinModalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.lg,
  },
  pinModalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pinModalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  pinModalSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  pinBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    marginBottom: spacing.md,
  },
  pinDigitBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pinDigitBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pinDigitBoxError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  pinErrorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 4,
  },
  demoPinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
  demoPinNoticeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginLeft: 4,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelBtnText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  extraServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  extraServiceName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  extraServiceQty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  extraServiceAmount: {
    ...typography.subtitle2,
    color: colors.success,
    fontWeight: '800',
  },
  upsellActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  upsellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upsellCardTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  upsellCardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  addUpsellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  addUpsellBtnText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
    marginLeft: 2,
  },
  upsellModalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  upsellModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  upsellModalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  upsellModalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upsellSubLabel: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subServiceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  subServiceSelectCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  subServiceSelectName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  subServiceSelectNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  subServiceSelectDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  subServiceSelectPrice: {
    ...typography.subtitle1,
    color: colors.success,
    fontWeight: '800',
    marginLeft: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  qtyLabel: {
    ...typography.subtitle2,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  navRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  primaryNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryNavBtnText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '700',
  },
  secondaryNavBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default ActiveJobScreen;
