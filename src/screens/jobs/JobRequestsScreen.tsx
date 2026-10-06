import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Job } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';
import { useApp } from '../../state/AppContext';
import { alertFeedbackService } from '../../services/alertFeedbackService';
import { resolveBookingUuid } from '../../utils/uuid';

export const JobRequestsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { jobRequests, acceptJob, rejectJob } = useApp();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Nearby' | 'High Pay'>('All');

  // Trigger attention-grabbing vibration & haptics when leads are active
  React.useEffect(() => {
    if (jobRequests.length > 0) {
      alertFeedbackService.playJobAlertFeedback();
    }
  }, []);

  const filteredJobs = jobRequests.filter((job) => {
    if (activeFilter === 'Nearby') return job.location.distanceKm <= 2.5;
    if (activeFilter === 'High Pay') return job.price >= 1000;
    return true;
  });

  const handleAccept = (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    acceptJob(bookingId);
    navigation.navigate('ActiveJob', { job: { ...job, id: bookingId, bookingId, status: 'accepted' }, bookingId });
  };

  const handleReject = (job: Job) => {
    Alert.alert(
      'Decline Booking Request',
      `Are you sure you want to pass #${job.jobId} (${job.serviceName}) to the next partner?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => rejectJob(job.id, 'Partner unavailable'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Job Requests"
        subtitle={`${jobRequests.length} active leads nearby`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Nearby', 'High Pay'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => {
              alertFeedbackService.playTouchFeedback('light');
              setActiveFilter(filter);
            }}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => navigation.navigate('JobDetails', { job: item })}
            onAccept={() => handleAccept(item)}
            onReject={() => handleReject(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="checkmark-circle-outline"
            title="All Caught Up!"
            description="There are no pending requests right now. Keep your app online to receive automatic dispatches."
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
    paddingHorizontal: spacing.lg,
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

export default JobRequestsScreen;
