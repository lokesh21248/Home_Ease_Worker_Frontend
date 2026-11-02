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
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PrimaryButtonProps {
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
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: spacing.md, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: spacing.xl, minHeight: 48 },
    lg: { paddingVertical: 15, paddingHorizontal: spacing.xxl, minHeight: 54 },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: '#C7D7F9',
    elevation: 0,
    shadowOpacity: 0,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PrimaryButton;
