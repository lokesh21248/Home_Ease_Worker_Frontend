import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, spacing, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Job } from '../types';

interface BookingRequestCardProps {
  job: Job;
  onAccept: (job: Job) => void;
  onReject: (job: Job) => void;
  isAccepting?: boolean;
  style?: ViewStyle;
}

export const BookingRequestCard: React.FC<BookingRequestCardProps> = ({
  job,
  onAccept,
  onReject,
  isAccepting = false,
  style,
}) => {
  const serviceName = job.serviceName || 'Home Service';
  const customerLocation = job.location?.address || job.location?.city || 'Customer Location';
  const distanceText = job.location?.distanceKm ? `${job.location.distanceKm} km away` : 'Nearby';
  const payoutAmount = job.netPayout || job.price || 0;
  const isInstant = job.bookingType === 'INSTANT' || !job.bookingType;

  return (
    <View style={[styles.card, style]}>
      {/* Header Tag */}
      <View style={styles.headerRow}>
        <View style={styles.tagPill}>
          <Ionicons
            name={isInstant ? 'flash' : 'calendar'}
            size={12}
            color={colors.primary}
          />
          <Text style={styles.tagText}>
            {isInstant ? 'INSTANT DISPATCH' : 'SCHEDULED REQUEST'}
          </Text>
        </View>

        <Text style={styles.payoutText}>₹{payoutAmount}</Text>
      </View>

      {/* Title & Customer */}
      <Text style={styles.serviceTitle}>{serviceName}</Text>
      <Text style={styles.customerName}>Customer: {job.customer?.name || 'HomeEase Customer'}</Text>

      {/* Meta Information */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.metaLocation} numberOfLines={1}>
            {customerLocation}
          </Text>
        </View>

        <View style={styles.metaDetails}>
          <View style={styles.metaPill}>
            <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaDetailText}>{distanceText}</Text>
          </View>

          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaDetailText}>{job.scheduledTime || 'Immediate'}</Text>
          </View>

          <View style={styles.metaPill}>
            <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaDetailText}>{job.paymentMode || 'Online'}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={() => onReject(job)}
          activeOpacity={0.8}
        >
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, isAccepting && styles.btnDisabled]}
          onPress={() => onAccept(job)}
          activeOpacity={0.85}
          disabled={isAccepting}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.textInverse} />
          <Text style={styles.acceptBtnText}>
            {isAccepting ? 'Accepting...' : 'Accept Job'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  payoutText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  serviceTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  customerName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaContainer: {
    marginVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaLocation: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  metaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaDetailText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  declineBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textInverse,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default BookingRequestCard;
