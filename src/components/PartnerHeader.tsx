import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, spacing, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PartnerHeaderProps {
  partnerName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  locality?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
  style?: ViewStyle;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  partnerName,
  avatarUrl,
  isVerified = true,
  locality = 'Hyderabad',
  isOnline = false,
  unreadCount = 0,
  onPressNotifications,
  onPressProfile,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Left: Avatar & Greeting */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={onPressProfile}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {partnerName ? partnerName.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.onlineStatusIndicator,
              { backgroundColor: isOnline ? colors.success : colors.textMuted },
            ]}
          />
        </View>

        <View style={styles.nameBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partnerName || 'Partner'}
            </Text>
            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
            <Text style={styles.localityText} numberOfLines={1}>
              {locality}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right: Notification Bell */}
      <TouchableOpacity
        style={styles.notificationBtn}
        onPress={onPressNotifications}
        activeOpacity={0.8}
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarInitial: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  onlineStatusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  nameBlock: {
    marginLeft: spacing.md,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  partnerName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    maxWidth: 160,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  localityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
  },
});

export default PartnerHeader;
