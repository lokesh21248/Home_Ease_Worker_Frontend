import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';
import { resolveBookingUuid } from '../../utils/uuid';

export const JobsTabScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { jobRequests, activeJob, completedJobs, acceptJob, rejectJob, fetchJobRequests } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Requests' | 'Active' | 'Completed'>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobRequests();
    setIsRefreshing(false);
  };

  const getJobsList = () => {
    switch (activeTab) {
      case 'Requests':
        return jobRequests;
      case 'Active':
        return activeJob ? [activeJob] : [];
      case 'Completed':
        return completedJobs;
      case 'All':
      default:
        return [
          ...(activeJob ? [activeJob] : []),
          ...jobRequests,
          ...completedJobs,
        ];
    }
  };

  const jobsToDisplay = getJobsList();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Jobs & Bookings"
        subtitle={`${jobRequests.length} pending • ${activeJob ? '1 in progress' : '0 in progress'}`}
      />

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(['All', 'Requests', 'Active', 'Completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={jobsToDisplay}
        keyExtractor={(item) => item.id}
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
          <JobCard
            job={item}
            onPress={() => {
              if (item.status === 'started' || item.status === 'accepted' || item.status === 'travelling' || item.status === 'arrived') {
                const bookingId = resolveBookingUuid(item.bookingId, item.id);
                navigation.navigate('ActiveJob', { job: { ...item, bookingId }, bookingId });
              } else {
                navigation.navigate('JobDetails', { job: item });
              }
            }}
            onAccept={() => {
              const bookingId = resolveBookingUuid(item.bookingId, item.id);
              acceptJob(bookingId);
              navigation.navigate('ActiveJob', { job: { ...item, id: bookingId, bookingId, status: 'accepted' }, bookingId });
            }}
            onReject={() => rejectJob(item.id)}
            onNavigate={() => navigation.navigate('NavigationTracking', { job: item })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="briefcase-outline"
            title="No Jobs Found"
            description={`You do not have any bookings under the "${activeTab}" tab.`}
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

export default JobsTabScreen;
