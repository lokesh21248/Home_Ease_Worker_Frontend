import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface EarningCardProps {
  title: string;
  amount: string | number;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  trend?: string;
  style?: ViewStyle;
}

export const EarningCard: React.FC<EarningCardProps> = ({
  title,
  amount,
  subtitle,
  iconName,
  variant = 'primary',
  trend,
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: colors.successLight,
          iconColor: colors.success,
          accentBorder: colors.success,
        };
      case 'warning':
        return {
          iconBg: colors.warningLight,
          iconColor: colors.warning,
          accentBorder: colors.warning,
        };
      case 'info':
        return {
          iconBg: colors.infoLight,
          iconColor: colors.info,
          accentBorder: colors.info,
        };
      case 'primary':
      default:
        return {
          iconBg: colors.primaryLighter,
          iconColor: colors.primary,
          accentBorder: colors.primary,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: v.iconBg }]}>
          <Ionicons name={iconName} size={20} color={v.iconColor} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons name="trending-up" size={13} color={colors.success} />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>

      <Text style={styles.amount}>
        {typeof amount === 'number' ? `₹${amount.toLocaleString()}` : amount}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    fontSize: 10,
    marginLeft: 2,
  },
  amount: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  title: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default EarningCard;
