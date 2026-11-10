import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MapPin, Navigation, ArrowRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Job } from '../types';
import { BookingStatusBadge } from './BookingStatusBadge';

interface ActiveJobCardProps {
  job: Job;
  onPress: () => void;
  onPressNavigate?: () => void;
  style?: ViewStyle;
}

export const ActiveJobCard: React.FC<ActiveJobCardProps> = ({
  job,
  onPress,
  onPressNavigate,
  style,
}) => {
  const customerName = job.customer?.name || 'Customer';
  const serviceName = job.serviceName || 'Home Service';
  const locationText = job.location?.address || job.location?.city || 'Customer Location';
  const payout = job.netPayout || job.price || 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Banner */}
      <View style={styles.topRow}>
        <View style={styles.badgeWrapper}>
          <View style={styles.livePulseDot} />
          <Text style={styles.badgeLabel}>ACTIVE JOB IN PROGRESS</Text>
        </View>

        <BookingStatusBadge status={job.status} size="sm" />
      </View>

      {/* Main Info */}
      <View style={styles.body}>
        <Text style={styles.serviceName}>{serviceName}</Text>
        <Text style={styles.customerName}>For {customerName}</Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.payoutBlock}>
          <Text style={styles.payoutLabel}>Est. Payout</Text>
          <Text style={styles.payoutValue}>₹{payout}</Text>
        </View>

        <View style={styles.actionRow}>
          {onPressNavigate && (
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={onPressNavigate}
              activeOpacity={0.8}
              accessibilityLabel="Navigate"
            >
              <Navigation size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>View Job Details</Text>
            <ArrowRight size={14} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  body: {
    marginVertical: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  customerName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  payoutBlock: {
    justifyContent: 'center',
  },
  payoutLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  payoutValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: borderRadius.md,
  },
  ctaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.textInverse,
    marginRight: 4,
  },
});

export default ActiveJobCard;
