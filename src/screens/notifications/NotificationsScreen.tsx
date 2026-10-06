import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NotificationItem } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import NotificationCard from '../../components/NotificationCard';
import EmptyState from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'All' | 'job' | 'payment' | 'offer'>('All');

  const filtered = notifications.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.type === activeFilter;
  });

  const handleNotificationPress = (item: NotificationItem) => {
    markNotificationAsRead(item.id);

    if (item.actionRoute === 'JobRequests') {
      navigation.navigate('JobRequests');
    } else if (item.actionRoute === 'Wallet') {
      navigation.navigate('Wallet');
    } else if (item.actionRoute === 'DocumentUpload') {
      navigation.navigate('DocumentUpload', { isOnboarding: false });
    } else if (item.actionRoute === 'Earnings') {
      navigation.navigate('Earnings');
    } else if (item.actionRoute === 'Support') {
      navigation.navigate('Support');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notifications"
        subtitle={
          unreadNotificationsCount > 0
            ? `${unreadNotificationsCount} unread alerts`
            : 'All caught up'
        }
        showBack
        rightAction={
          unreadNotificationsCount > 0 ? (
            <TouchableOpacity onPress={markAllNotificationsAsRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'All', label: 'All' },
          { key: 'job', label: 'Jobs ⚡' },
          { key: 'payment', label: 'Payments 💰' },
          { key: 'offer', label: 'Offers 🎁' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveFilter(tab.key as any)}
            style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === tab.key && styles.filterTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="notifications-off-outline"
            title="No Notifications"
            description="You don't have any notifications in this category yet."
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

export default NotificationsScreen;
