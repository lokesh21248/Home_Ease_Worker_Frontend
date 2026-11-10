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
import { BookingStatusBadge } from './BookingStatusBadge';

interface ScheduledBookingCardProps {
  bookingId: string;
  serviceName: string;
  customerName?: string;
  scheduledTime: string;
  scheduledDate?: string;
  durationMins?: number;
  locality?: string;
  status: string;
  payoutAmount?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ScheduledBookingCard: React.FC<ScheduledBookingCardProps> = ({
  serviceName,
  customerName,
  scheduledTime,
  scheduledDate,
  durationMins = 60,
  locality = 'Hyderabad',
  status,
  payoutAmount,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      {/* Header: Date/Time Badge & Status */}
      <View style={styles.headerRow}>
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={13} color={colors.primary} />
          <Text style={styles.timeBadgeText}>
            {scheduledDate ? `${scheduledDate} • ` : ''}{scheduledTime}
          </Text>
        </View>

        <BookingStatusBadge status={status} size="sm" />
      </View>

      {/* Main Info */}
      <View style={styles.body}>
        <Text style={styles.serviceName}>{serviceName}</Text>
        {customerName && (
          <Text style={styles.customerName}>Customer: {customerName}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {locality}
            </Text>
          </View>

          <View style={styles.metaDot} />

          <View style={styles.metaItem}>
            <Ionicons name="hourglass-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{durationMins} Mins</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      {payoutAmount !== undefined && (
        <View style={styles.footer}>
          <Text style={styles.payoutLabel}>Est. Earnings</Text>
          <Text style={styles.payoutValue}>₹{payoutAmount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  timeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    marginLeft: 4,
  },
  body: {
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  customerName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.borderDark,
    marginHorizontal: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  payoutLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  payoutValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
});

export default ScheduledBookingCard;
