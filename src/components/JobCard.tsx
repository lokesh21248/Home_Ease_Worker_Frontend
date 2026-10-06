import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import Badge, { BadgeVariant } from './Badge';
import Button from './Button';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onNavigate?: () => void;
  showActions?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onAccept,
  onReject,
  onNavigate,
  showActions = true,
}) => {
  const getStatusBadge = (status: Job['status']): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'requested':
        return { label: 'New Request', variant: 'warning' };
      case 'accepted':
        return { label: 'Accepted', variant: 'info' };
      case 'travelling':
        return { label: 'On Route', variant: 'info' };
      case 'arrived':
        return { label: 'Arrived at Site', variant: 'primary' };
      case 'started':
        return { label: 'In Progress', variant: 'success' };
      case 'completed':
        return { label: 'Completed', variant: 'success' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'danger' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  const badgeInfo = getStatusBadge(job.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.cardContainer}
    >
      {/* Header Row: Job ID, Service Tag & Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.jobIdText}>{job.jobId}</Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.scheduleText}>
            {job.scheduledDate}, {job.scheduledTime}
          </Text>
        </View>
        <Badge label={badgeInfo.label} variant={badgeInfo.variant} size="sm" />
      </View>

      {/* Main Details Row */}
      <View style={styles.mainRow}>
        {/* Customer Avatar & Initials */}
        <Image
          source={{ uri: job.customer.avatar }}
          style={styles.avatar}
        />

        <View style={styles.contentColumn}>
          <Text style={styles.customerName}>{job.customer.name}</Text>
          <Text style={styles.serviceName}>{job.serviceName}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-sharp" size={14} color={colors.primary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.location.city} ({job.location.distanceKm} km away)
              </Text>
            </View>
          </View>
        </View>

        {/* Payout & Price Column */}
        <View style={styles.payoutColumn}>
          <Text style={styles.priceLabel}>Net Payout</Text>
          <Text style={styles.priceValue}>₹{job.netPayout}</Text>
          <Text style={styles.grossText}>Bill: ₹{job.price}</Text>
        </View>
      </View>

      {/* Address Strip */}
      <View style={styles.addressStrip}>
        <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.addressText} numberOfLines={1}>
          {job.location.address}
        </Text>
      </View>

      {/* Optional Action Buttons: Accept / Reject or Navigate */}
      {showActions && (
        <View style={styles.actionRow}>
          {job.status === 'requested' && (
            <>
              <View style={styles.btnWrapper}>
                <Button
                  title="Decline"
                  variant="outline"
                  size="sm"
                  onPress={onReject || (() => {})}
                  style={styles.rejectBtn}
                  textStyle={styles.rejectBtnText}
                />
              </View>
              <View style={styles.btnWrapper}>
                <Button
                  title="Accept Job"
                  variant="primary"
                  size="sm"
                  onPress={onAccept || (() => {})}
                  icon={<Ionicons name="checkmark-circle" size={16} color={colors.textInverse} />}
                />
              </View>
            </>
          )}

          {(job.status === 'accepted' || job.status === 'travelling') && (
            <>
              <View style={styles.btnWrapper}>
                <Button
                  title="Track & Navigate"
                  variant="secondary"
                  size="sm"
                  onPress={onNavigate || onPress || (() => {})}
                  icon={<Ionicons name="navigate" size={16} color={colors.textInverse} />}
                />
              </View>
              <View style={styles.btnWrapper}>
                <Button
                  title="View Details"
                  variant="outline"
                  size="sm"
                  onPress={onPress || (() => {})}
                />
              </View>
            </>
          )}

          {job.status === 'started' && (
            <View style={styles.fullBtnWrapper}>
              <Button
                title="Active Service in Progress ⚡"
                variant="success"
                size="sm"
                onPress={onPress || (() => {})}
              />
            </View>
          )}

          {job.status === 'completed' && (
            <View style={styles.completedRow}>
              <Ionicons name="checkmark-done-circle" size={18} color={colors.success} />
              <Text style={styles.completedText}>Earned ₹{job.netPayout} • Payout Settled</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIdText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    marginHorizontal: spacing.sm,
  },
  scheduleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  contentColumn: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  serviceName: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 3,
  },
  payoutColumn: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceValue: {
    ...typography.h3,
    color: colors.success,
    fontWeight: '800',
  },
  grossText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  addressStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  btnWrapper: {
    flex: 1,
  },
  fullBtnWrapper: {
    flex: 1,
  },
  rejectBtn: {
    borderColor: colors.danger,
  },
  rejectBtnText: {
    color: colors.danger,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  completedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
});

export default JobCard;
