import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';

interface AvailabilityToggleProps {
  isOnline: boolean;
  onToggle: () => Promise<void> | void;
  isLoading?: boolean;
  style?: ViewStyle;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  isOnline,
  onToggle,
  isLoading = false,
  style,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleValueChange = async () => {
    if (isLoading || internalLoading) return;
    setInternalLoading(true);
    try {
      await onToggle();
    } finally {
      setInternalLoading(false);
    }
  };

  const busy = isLoading || internalLoading;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.leftCol}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: isOnline ? colors.success : colors.textMuted },
            ]}
          />
          <Text style={styles.statusLabel}>
            {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
          </Text>
        </View>

        <Text style={styles.subtext}>
          {isOnline
            ? 'Ready to receive instant & scheduled customer bookings'
            : 'Switch to online to start receiving nearby requests'}
        </Text>
      </View>

      <View style={styles.switchWrapper}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={isOnline}
            onValueChange={handleValueChange}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D5DB"
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  leftCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.8,
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  switchWrapper: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvailabilityToggle;
