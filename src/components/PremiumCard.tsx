import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = spacing.lg,
}) => {
  const cardStyle = [
    styles.card,
    { padding },
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...shadows.sm,
  },
  outlined: {
    borderColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  flat: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default PremiumCard;
