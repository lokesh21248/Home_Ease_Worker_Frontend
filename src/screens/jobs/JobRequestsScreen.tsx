import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Job } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { CustomHeader } from '../../components/CustomHeader';
import { BookingCard } from '../../components/BookingCard';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';
import { alertFeedbackService } from '../../services/alertFeedbackService';
import { resolveBookingUuid } from '../../utils/uuid';

export const JobRequestsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { jobRequests, acceptJob, rejectJob, fetchJobRequests } = useApp();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Nearby' | 'High Pay'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (jobRequests.length > 0) {
      alertFeedbackService.playJobAlertFeedback();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchJobRequests();
    } catch {
      // Ignore network errors in pull to refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredJobs = jobRequests.filter((job) => {
    if (activeFilter === 'Nearby') return job.location.distanceKm <= 2.5;
    if (activeFilter === 'High Pay') return job.price >= 1000;
    return true;
  });

  const handleAccept = (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    acceptJob(bookingId);
    navigation.navigate('ActiveJob', {
      job: { ...job, id: bookingId, bookingId, status: 'accepted' },
      bookingId,
    });
  };

  const handleReject = (job: Job) => {
    Alert.alert(
      'Decline Booking Request',
      `Are you sure you want to pass #${job.jobId} (${job.serviceName}) to the next partner?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => rejectJob(job.id, 'Partner unavailable'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Job Requests"
        subtitle={`${jobRequests.length} active leads nearby`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="reload-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Nearby', 'High Pay'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                alertFeedbackService.playTouchFeedback('light');
                setActiveFilter(filter);
              }}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredJobs}
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
            onPress={() => navigation.navigate('JobDetails', { job: item })}
            onAccept={() => handleAccept(item)}
            onReject={() => handleReject(item)}
            onNavigate={() => navigation.navigate('NavigationTracking', { job: item })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="All Caught Up!"
            description="There are no pending requests right now. Keep your app online to receive automatic dispatches."
            actionLabel="Check for New Leads"
            onAction={handleRefresh}
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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

export default JobRequestsScreen;
