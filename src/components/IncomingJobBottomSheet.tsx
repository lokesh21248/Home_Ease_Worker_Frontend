import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Zap, Clock, Navigation, CheckCircle2, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Job } from '../types';

interface IncomingJobBottomSheetProps {
  job: Job | null;
  onAccept: (job: Job) => void;
  onReject: (job: Job) => void;
  onClose?: () => void;
  countdownSeconds?: number;
}

export const IncomingJobBottomSheet: React.FC<IncomingJobBottomSheetProps> = ({
  job,
  onAccept,
  onReject,
  onClose,
  countdownSeconds = 30,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  useEffect(() => {
    if (job) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [job]);

  if (!job) return null;

  const payout = job.netPayout || job.price || 0;
  const distance = job.location?.distanceKm ? `${job.location.distanceKm} km` : '2.4 km';
  const eta = job.estimatedArrivalMinutes ? `${job.estimatedArrivalMinutes} mins` : '12 mins';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      )}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={styles.content}>
        {/* Header Tag */}
        <View style={styles.topRow}>
          <View style={styles.tag}>
            <Zap size={14} color={colors.primary} />
            <Text style={styles.tagText}>NEW INSTANT DISPATCH</Text>
          </View>

          <View style={styles.payoutBadge}>
            <Text style={styles.payoutValue}>₹{payout}</Text>
          </View>
        </View>

        {/* Service Title */}
        <Text style={styles.serviceName}>{job.serviceName}</Text>
        <Text style={styles.customerName}>For {job.customer?.name || 'Customer'}</Text>

        {/* Location Box */}
        <View style={styles.locationBox}>
          <Text style={styles.addressText} numberOfLines={2}>
            {job.location?.address || job.location?.city || 'Customer Address'}
          </Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Navigation size={16} color={colors.primary} />
            <Text style={styles.metricVal}>{distance}</Text>
            <Text style={styles.metricLbl}>Distance</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.metricVal}>{eta}</Text>
            <Text style={styles.metricLbl}>Travel Time</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.metricVal}>{job.estimatedDuration || '45m'}</Text>
            <Text style={styles.metricLbl}>Est. Duration</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => onReject(job)}
            activeOpacity={0.8}
          >
            <X size={18} color={colors.textSecondary} />
            <Text style={styles.declineBtnText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAccept(job)}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color="#FFFFFF" />
            <Text style={styles.acceptBtnText}>Accept Job ({countdownSeconds}s)</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  handle: {
    backgroundColor: '#CBD5E1',
    width: 44,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  payoutBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  payoutValue: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: '#059669',
  },
  serviceName: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  customerName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  locationBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  addressText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  metricLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  declineBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  acceptBtn: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
