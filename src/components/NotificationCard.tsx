import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getIconConfig = () => {
    switch (notification.type) {
      case 'job':
        return { name: 'flash-outline' as const, bg: colors.primaryLighter, color: colors.primary };
      case 'payment':
        return { name: 'wallet-outline' as const, bg: colors.successLight, color: colors.success };
      case 'document':
        return { name: 'shield-checkmark-outline' as const, bg: colors.infoLight, color: colors.info };
      case 'offer':
        return { name: 'gift-outline' as const, bg: colors.warningLight, color: colors.warning };
      case 'system':
      default:
        return { name: 'notifications-outline' as const, bg: colors.surfaceAlt, color: colors.textSecondary };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, !notification.isRead && styles.unreadCard]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.topRow}>
          <Text style={[styles.title, !notification.isRead && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.timestamp}>{notification.timestamp}</Text>
        </View>

        <Text style={styles.body}>{notification.body}</Text>
      </View>

      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  unreadCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primarySoft,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contentColumn: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.xs,
  },
  unreadTitle: {
    fontWeight: '800',
    color: colors.primary,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  body: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});

export default NotificationCard;
