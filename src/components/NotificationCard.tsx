import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (notification.type) {
      case 'job':
        return 'briefcase-outline';
      case 'payment':
        return 'wallet-outline';
      case 'document':
        return 'shield-checkmark-outline';
      case 'offer':
        return 'gift-outline';
      case 'system':
      default:
        return 'notifications-outline';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, !notification.isRead && styles.unreadCard]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getIconName()} size={20} color={colors.primary} />
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, !notification.isRead && styles.unreadTitle]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.timestamp}>{notification.timestamp}</Text>
        </View>

        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>

      {!notification.isRead ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
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
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.xs,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
});

export default NotificationCard;
