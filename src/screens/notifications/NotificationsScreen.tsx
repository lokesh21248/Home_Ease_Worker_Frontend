import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation as useNavigation } from '../../navigation/useAppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NotificationItem } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { CustomHeader } from '../../components/CustomHeader';
import { NotificationCard } from '../../components/NotificationCard';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Notifications"
        subtitle={
          unreadNotificationsCount > 0
            ? `${unreadNotificationsCount} unread alerts`
            : 'All alerts caught up'
        }
        showBack
        rightAction={
          unreadNotificationsCount > 0 ? (
            <TouchableOpacity
              onPress={markAllNotificationsAsRead}
              activeOpacity={0.7}
              style={styles.markAllBtn}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'All', label: 'All' },
          { key: 'job', label: 'Jobs' },
          { key: 'payment', label: 'Payouts' },
          { key: 'offer', label: 'Incentives' },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key as any)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
            icon="notifications-off-outline"
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
  markAllBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});

export default NotificationsScreen;
