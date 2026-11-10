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

interface LocationCardProps {
  address: string;
  pincode?: string;
  distanceKm?: number;
  etaMinutes?: number;
  onNavigate?: () => void;
  onCall?: () => void;
  customerPhone?: string;
  style?: ViewStyle;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  address,
  pincode,
  distanceKm,
  etaMinutes,
  onNavigate,
  onCall,
  customerPhone,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header with Distance / ETA pill */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Customer Destination</Text>
        </View>

        {(distanceKm !== undefined || etaMinutes !== undefined) && (
          <View style={styles.etaPill}>
            <Ionicons name="navigate" size={11} color={colors.primary} />
            <Text style={styles.etaText}>
              {distanceKm !== undefined ? `${distanceKm.toFixed(1)} km` : ''}
              {distanceKm !== undefined && etaMinutes !== undefined ? ' • ' : ''}
              {etaMinutes !== undefined ? `~${etaMinutes} mins` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Address */}
      <Text style={styles.addressText}>{address || 'Customer location details'}</Text>
      {pincode && <Text style={styles.pincodeText}>PIN Code: {pincode}</Text>}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {onNavigate && (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={onNavigate}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={16} color={colors.textInverse} />
            <Text style={styles.navBtnText}>Google Maps</Text>
          </TouchableOpacity>
        )}

        {onCall && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={onCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={styles.callBtnText}>Call Customer</Text>
          </TouchableOpacity>
        )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  etaText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  pincodeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  navBtn: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.textInverse,
  },
  callBtn: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBtnText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});

export default LocationCard;
