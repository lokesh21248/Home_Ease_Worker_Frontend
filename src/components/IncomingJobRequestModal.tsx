import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Job } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { alertFeedbackService } from '../services/alertFeedbackService';

interface IncomingJobRequestModalProps {
  visible: boolean;
  job: Job | null;
  onAccept: (job: Job) => void;
  onReject: (job: Job) => void;
  countdownSeconds?: number;
}

const { width } = Dimensions.get('window');

export const IncomingJobRequestModal: React.FC<IncomingJobRequestModalProps> = ({
  visible,
  job,
  onAccept,
  onReject,
  countdownSeconds = 20,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(countdownSeconds);
  const timerRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Reset countdown and trigger sound/vibration feedback whenever a new request opens
  useEffect(() => {
    if (visible && job) {
      setTimeLeft(countdownSeconds);
      alertFeedbackService.playJobAlertFeedback();

      // Pulsing alert animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onReject(job);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, job]);

  if (!visible || !job) {
    return null;
  }

  const progress = Math.max(0, Math.min(1, timeLeft / countdownSeconds));
  const isUrgent = timeLeft <= 10;
  const payoutAmount = job.netPayout || job.price || 425;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Urgency Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isUrgent ? colors.danger : colors.primary,
                },
              ]}
            />
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Header with Countdown Clock */}
            <View style={styles.headerRow}>
              <View style={styles.alertHeaderBadge}>
                <Animated.View
                  style={[
                    styles.pulseDot,
                    {
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: isUrgent ? colors.danger : colors.primary,
                    },
                  ]}
                />
                <Text style={styles.alertTitle}>NEW SERVICE ORDER</Text>
              </View>

              {/* Countdown Pill */}
              <View
                style={[
                  styles.countdownPill,
                  isUrgent && styles.countdownPillUrgent,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={isUrgent ? colors.danger : colors.primary}
                />
                <Text
                  style={[
                    styles.countdownText,
                    isUrgent && styles.countdownTextUrgent,
                  ]}
                >
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* Service Title & Order ID */}
            <View style={styles.titleSection}>
              <Text style={styles.serviceName}>{job.serviceName}</Text>
              <Text style={styles.orderNumber}>
                Order #{job.jobId} • {job.category || 'Home Service'}
              </Text>
            </View>

            {/* Payout & Earnings Ribbon */}
            <View style={styles.payoutCard}>
              <View>
                <Text style={styles.payoutLabel}>Estimated Partner Earning</Text>
                <Text style={styles.payoutSubtext}>Direct bank payout after completion</Text>
              </View>
              <Text style={styles.payoutValue}>₹{payoutAmount}</Text>
            </View>

            {/* Key Distance, ETA & Duration Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.metricValue}>
                  {job.location?.distanceKm ? `${job.location.distanceKm} km` : '2.4 km'}
                </Text>
                <Text style={styles.metricLabel}>Distance</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                <Text style={styles.metricValue}>
                  {job.estimatedArrivalMinutes ? `${job.estimatedArrivalMinutes} mins` : '12 mins'}
                </Text>
                <Text style={styles.metricLabel}>Est. Travel</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
                <Text style={styles.metricValue}>{job.estimatedDuration || '30–60m'}</Text>
                <Text style={styles.metricLabel}>Est. Work</Text>
              </View>
            </View>

            {/* Sub Services Included */}
            {job.subServices && job.subServices.length > 0 && (
              <View style={styles.subServicesCard}>
                <Text style={styles.sectionTitle}>Tasks to Perform</Text>
                {job.subServices.map((sub, index) => (
                  <View key={index} style={styles.subServiceRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                    <Text style={styles.subServiceText}>
                      {typeof sub === 'string' ? sub : sub.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Customer Location & Area */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeaderRow}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.customerName}>
                    {job.customer?.name || 'Customer'}
                  </Text>
                  <Text style={styles.customerArea} numberOfLines={1}>
                    {job.location?.landmark || job.location?.city || 'Madhapur, Hyderabad'}
                  </Text>
                </View>
              </View>

              <View style={styles.addressBox}>
                <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.fullAddressText} numberOfLines={2}>
                  {job.location?.address || 'Address provided upon acceptance'}
                </Text>
              </View>

              {job.instructions ? (
                <View style={styles.instructionsBox}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
                  <Text style={styles.instructionsText}>
                    "{job.instructions}"
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Accept / Decline Action Buttons */}
            <View style={styles.actionButtonsCol}>
              <PrimaryButton
                title={`Accept Order (${timeLeft}s)`}
                size="lg"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                onPress={() => onAccept(job)}
              />

              <SecondaryButton
                title="Decline Request"
                size="md"
                onPress={() => onReject(job)}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 54, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '88%',
    overflow: 'hidden',
    ...shadows.lg,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  countdownPillUrgent: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  countdownTextUrgent: {
    color: colors.danger,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  payoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  payoutSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payoutValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  subServicesCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  subServiceText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  locationCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customerArea: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullAddressText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    lineHeight: 17,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  instructionsText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionButtonsCol: {
    width: '100%',
  },
});
