import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { BookingCard } from '../../components/BookingCard';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';
import { resolveBookingUuid } from '../../utils/uuid';
import { Job } from '../../types';

type TabType = 'All' | 'Requests' | 'Active' | 'Scheduled' | 'Completed';

export const JobsTabScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    jobRequests,
    activeJob,
    completedJobs,
    acceptJob,
    rejectJob,
    fetchJobRequests,
    fetchSchedules,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchJobRequests().catch(() => {}),
        fetchSchedules().catch(() => {}),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const scheduledJobs = [...(activeJob ? [activeJob] : []), ...jobRequests].filter(
    (j) => j.bookingType === 'SCHEDULED' || (j.scheduledDate && j.scheduledDate !== 'Today')
  );

  const getDedupedAllJobs = (): Job[] => {
    const seen = new Set<string>();
    const deduped: Job[] = [];
    for (const job of [
      ...(activeJob ? [activeJob] : []),
      ...jobRequests,
      ...completedJobs,
    ]) {
      const key = job.bookingId || job.id;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(job);
      }
    }
    return deduped;
  };

  const getJobsList = (): Job[] => {
    switch (activeTab) {
      case 'Requests':
        return jobRequests;
      case 'Active':
        return activeJob ? [activeJob] : [];
      case 'Scheduled':
        return scheduledJobs;
      case 'Completed':
        return completedJobs;
      case 'All':
      default:
        return getDedupedAllJobs();
    }
  };

  const jobsToDisplay = getJobsList();

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'All', label: 'All', count: getDedupedAllJobs().length },
    { key: 'Requests', label: 'Requests', count: jobRequests.length },
    { key: 'Active', label: 'Active', count: activeJob ? 1 : 0 },
    { key: 'Scheduled', label: 'Scheduled', count: scheduledJobs.length },
    { key: 'Completed', label: 'Completed', count: completedJobs.length },
  ];

  const handleJobPress = (item: Job) => {
    const isOngoing =
      item.status === 'started' ||
      item.status === 'accepted' ||
      item.status === 'travelling' ||
      item.status === 'arrived';

    if (isOngoing) {
      const bookingId = resolveBookingUuid(item.bookingId, item.id);
      navigation.navigate('ActiveJob', { job: { ...item, bookingId }, bookingId });
    } else {
      navigation.navigate('JobDetails', { job: item });
    }
  };

  const handleAccept = (item: Job) => {
    const bookingId = resolveBookingUuid(item.bookingId, item.id);
    acceptJob(bookingId);
    navigation.navigate('ActiveJob', {
      job: { ...item, id: bookingId, bookingId, status: 'accepted' },
      bookingId,
    });
  };

  const handleReject = (item: Job) => {
    rejectJob(item.id);
  };

  const handleNavigate = (item: Job) => {
    navigation.navigate('NavigationTracking', { job: item });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Jobs & Bookings"
        subtitle={`${jobRequests.length} pending • ${activeJob ? '1 active job' : 'Available for orders'}`}
        rightAction={
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="reload-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs Bar */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Jobs List */}
      <FlatList
        data={jobsToDisplay}
        keyExtractor={(item) => item.bookingId || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BookingCard
            job={item}
            onPress={() => handleJobPress(item)}
            onAccept={() => handleAccept(item)}
            onReject={() => handleReject(item)}
            onNavigate={() => handleNavigate(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={`No ${activeTab} Jobs`}
            description={
              activeTab === 'Requests'
                ? 'No pending service requests right now. Stay online to receive instant bookings nearby.'
                : activeTab === 'Active'
                ? 'No service job currently in progress. Accept an incoming request to start.'
                : `You currently do not have any bookings under "${activeTab}".`
            }
            actionLabel={activeTab === 'Requests' ? 'Refresh Requests' : undefined}
            onAction={activeTab === 'Requests' ? handleRefresh : undefined}
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
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 6,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: colors.primaryLight,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeTextInactive: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});

export default JobsTabScreen;
