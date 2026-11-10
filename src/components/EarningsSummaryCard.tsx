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

interface EarningsSummaryCardProps {
  todayEarnings: number;
  completedJobsCount: number;
  activeJobsCount?: number;
  pendingRequestsCount?: number;
  onPressViewDetails?: () => void;
  style?: ViewStyle;
}

export const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({
  todayEarnings = 0,
  completedJobsCount = 0,
  activeJobsCount = 0,
  pendingRequestsCount = 0,
  onPressViewDetails,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Top Row: Title & Action */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="wallet" size={16} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Today's Earnings</Text>
        </View>

        {onPressViewDetails && (
          <TouchableOpacity
            style={styles.detailLink}
            onPress={onPressViewDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.detailLinkText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Metric */}
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amountText}>
          {Number(todayEarnings || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Text>
        <Text style={styles.netLabel}>Net Payout</Text>
      </View>

      {/* Sub-Metrics Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{completedJobsCount}</Text>
          <Text style={styles.statLabel}>Jobs Completed</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: activeJobsCount > 0 ? colors.primary : colors.textPrimary }]}>
            {activeJobsCount}
          </Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: pendingRequestsCount > 0 ? colors.warning : colors.textPrimary }]}>
            {pendingRequestsCount}
          </Text>
          <Text style={styles.statLabel}>Incoming</Text>
        </View>
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
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLinkText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    marginRight: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: 2,
  },
  amountText: {
    fontSize: 34,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  netLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
});

export default EarningsSummaryCard;
