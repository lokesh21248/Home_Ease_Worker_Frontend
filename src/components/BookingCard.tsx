import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { Job } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface BookingCardProps {
  job: Job;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onNavigate?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  job,
  onPress,
  onAccept,
  onReject,
  onNavigate,
}) => {
  const isRequested = job.status === 'requested';
  const isActive =
    job.status === 'accepted' ||
    job.status === 'travelling' ||
    job.status === 'arrived' ||
    job.status === 'started';
  const isCompleted = job.status === 'completed';

  const getStatusBadge = () => {
    switch (job.status) {
      case 'requested':
        return { label: 'New Request', bg: colors.primarySoft, text: colors.primary };
      case 'accepted':
        return { label: 'Accepted', bg: '#EFF6FF', text: colors.primary };
      case 'travelling':
        return { label: 'On The Way', bg: '#EFF6FF', text: colors.primary };
      case 'arrived':
        return { label: 'Arrived', bg: '#ECFDF5', text: '#059669' };
      case 'started':
        return { label: 'In Progress', bg: '#ECFDF5', text: '#059669' };
      case 'completed':
        return { label: 'Completed', bg: '#ECFDF5', text: '#059669' };
      case 'cancelled':
        return { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' };
      default:
        return { label: ((job.status as any) || 'REQUESTED').toUpperCase(), bg: colors.surfaceAlt, text: colors.textSecondary };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      {/* Top Header: Service Name & Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.serviceMeta}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {job.serviceName}
          </Text>
          <Text style={styles.jobIdText}>#{job.jobId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Customer Row */}
      <View style={styles.customerRow}>
        {job.customer.avatar ? (
          <Image source={{ uri: job.customer.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
        )}
        <View style={styles.customerInfo}>
          <View style={styles.customerNameRow}>
            <Text style={styles.customerName} numberOfLines={1}>
              {job.customer.name}
            </Text>
            {job.customer.rating ? (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{job.customer.rating}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.timeScheduleText}>
            {job.scheduledDate} • {job.scheduledTime}
          </Text>
        </View>

        {/* Payout Tag */}
        <View style={styles.payoutContainer}>
          <Text style={styles.payoutLabel}>Net Payout</Text>
          <Text style={styles.payoutValue}>₹{job.netPayout || job.price}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Address & Distance */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
        <Text style={styles.addressText} numberOfLines={2}>
          {job.location.address}
          {job.location.distanceKm ? ` (${job.location.distanceKm} km away)` : ''}
        </Text>
      </View>

      {/* Actions */}
      {isRequested && (onAccept || onReject) ? (
        <View style={styles.actionsRow}>
          {onReject ? (
            <SecondaryButton
              title="Decline"
              size="sm"
              onPress={onReject}
              style={styles.actionBtn}
              textStyle={{ color: colors.textSecondary }}
            />
          ) : null}
          {onAccept ? (
            <PrimaryButton
              title="Accept Job"
              size="sm"
              onPress={onAccept}
              style={styles.actionBtn}
            />
          ) : null}
        </View>
      ) : null}

      {isActive ? (
        <View style={styles.actionsRow}>
          {onNavigate ? (
            <SecondaryButton
              title="Directions"
              size="sm"
              icon={<Ionicons name="navigate-outline" size={15} color={colors.primary} />}
              onPress={onNavigate}
              style={styles.actionBtn}
            />
          ) : null}
          <PrimaryButton
            title="View Active Job"
            size="sm"
            iconRight={<Ionicons name="arrow-forward" size={15} color="#FFFFFF" />}
            onPress={onPress}
            style={styles.actionBtn}
          />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  serviceMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  jobIdText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.xs,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 2,
  },
  timeScheduleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payoutContainer: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  payoutValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});

export default BookingCard;
