import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'outline' | 'subtle';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
  size = 'md',
  fullWidth = false,
  variant = 'outline',
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: spacing.md, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: spacing.xl, minHeight: 48 },
    lg: { paddingVertical: 15, paddingHorizontal: spacing.xxl, minHeight: 54 },
  }[size];

  const variantStyle =
    variant === 'subtle'
      ? { backgroundColor: colors.primarySoft, borderColor: 'transparent' }
      : { backgroundColor: '#FFFFFF', borderColor: colors.border };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyle,
        sizeStyles,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.leftIcon}>{icon}</View>}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {iconRight && <View style={styles.rightIcon}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  text: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default SecondaryButton;
