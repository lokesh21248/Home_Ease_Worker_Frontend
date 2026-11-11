import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAppNavigation as useNavigation } from '../../navigation/useAppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useApp } from '../../state/AppContext';
import { resolveBookingUuid } from '../../utils/uuid';
import { openTurnByTurnNavigation } from '../../utils/navigationHelper';
import { Job } from '../../types';

// Design System Components
import { PartnerHeader } from '../../components/PartnerHeader';
import { AvailabilityToggle } from '../../components/AvailabilityToggle';
import { EarningsSummaryCard } from '../../components/EarningsSummaryCard';
import { ActiveJobCard } from '../../components/ActiveJobCard';
import { BookingRequestCard } from '../../components/BookingRequestCard';
import { ScheduledBookingCard } from '../../components/ScheduledBookingCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { IncomingJobRequestModal } from '../../components/IncomingJobRequestModal';

export const HomeDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    worker,
    toggleOnlineStatus,
    jobRequests,
    activeJob,
    unreadNotificationsCount,
    acceptJob,
    rejectJob,
    activeBannerAlert,
    dismissBannerAlert,
    todaySchedule,
    allScheduleSlots = [],
    fetchSchedules,
    fetchAllScheduleSlots,
    fetchJobRequests,
    locationData,
    refreshLocation,
    dashboardMetrics,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [incomingModalJob, setIncomingModalJob] = useState<Job | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  const isOnline = worker.availability.isOnline;

  // Pronto-Style: Auto-trigger incoming urgent modal when an eligible job is dispatched
  useEffect(() => {
    if (jobRequests.length > 0 && isOnline && !activeJob) {
      setIncomingModalJob(jobRequests[0]);
    } else {
      setIncomingModalJob(null);
    }
  }, [jobRequests, isOnline, activeJob]);

  // Re-fetch requests whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchJobRequests().catch(() => {});
      if (typeof fetchAllScheduleSlots === 'function') {
        fetchAllScheduleSlots().catch(() => {});
      }
    }, [])
  );

  const handleModalAccept = async (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    setIncomingModalJob(null);
    try {
      await acceptJob(bookingId);
      navigation.navigate('ActiveJob', {
        job: { ...job, id: bookingId, bookingId, status: 'accepted' },
        bookingId,
      });
    } catch (err: any) {
      if (err?.status === 409 || err?.isConflict) {
        Alert.alert(
          '⚠️ Job Already Accepted',
          'Another nearby partner accepted this request faster. Stay online — new jobs are coming in!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Notice', err?.message || 'Failed to accept booking.');
      }
    }
  };

  const handleModalReject = (job: Job) => {
    setIncomingModalJob(null);
    rejectJob(job.id, 'Partner declined');
  };

  const handleCardAccept = async (job: Job) => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    setAcceptingJobId(bookingId);
    try {
      await acceptJob(bookingId);
      navigation.navigate('ActiveJob', {
        job: { ...job, id: bookingId, bookingId, status: 'accepted' },
        bookingId,
      });
    } catch (err: any) {
      if (err?.status === 409 || err?.isConflict) {
        Alert.alert(
          '⚠️ Job Already Accepted',
          'Another nearby partner accepted this request faster. Stay online — new jobs are coming in!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Notice', err?.message || 'Failed to accept booking.');
      }
    } finally {
      setAcceptingJobId(null);
    }
  };

  const handleCardReject = (job: Job) => {
    rejectJob(job.id, 'Partner declined');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchJobRequests().catch(() => {}),
      fetchSchedules().catch(() => {}),
      typeof fetchAllScheduleSlots === 'function' ? fetchAllScheduleSlots().catch(() => {}) : Promise.resolve(),
      refreshLocation().catch(() => {}),
    ]);
    setRefreshing(false);
  };

  // Scheduled bookings preview (from today's schedule or all schedule slots)
  const upcomingScheduledList = (allScheduleSlots.length > 0 ? allScheduleSlots : (todaySchedule?.schedule || []))
    .filter((s: any) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* 1. Header with Partner Name, Avatar, Verification & Notifications */}
      <PartnerHeader
        partnerName={worker.name || 'Service Partner'}
        avatarUrl={worker.photoUri}
        isVerified={worker.isVerified !== false}
        locality={locationData.locality || 'Hyderabad'}
        isOnline={isOnline}
        unreadCount={unreadNotificationsCount}
        onPressNotifications={() => navigation.navigate('Notifications')}
        onPressProfile={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
      />

      {/* Active Toast / Banner Alert */}
      {activeBannerAlert && (
        <View style={styles.toastBanner}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={styles.toastText} numberOfLines={2}>
            {activeBannerAlert}
          </Text>
          <TouchableOpacity
            onPress={dismissBannerAlert}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 2. Availability Switch (Online / Offline) */}
        <AvailabilityToggle
          isOnline={isOnline}
          onToggle={toggleOnlineStatus}
          style={styles.sectionSpacing}
        />

        {/* 3. Active Job in Flight (if any) */}
        {activeJob && (
          <View style={styles.sectionSpacing}>
            <ActiveJobCard
              job={activeJob}
              onPress={() => {
                const bookingId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
                navigation.navigate('ActiveJob', {
                  job: { ...activeJob, bookingId },
                  bookingId,
                });
              }}
              onPressNavigate={() => {
                if (activeJob.location?.latitude && activeJob.location?.longitude) {
                  openTurnByTurnNavigation({
                    latitude: activeJob.location.latitude,
                    longitude: activeJob.location.longitude,
                    label: activeJob.customer?.name || 'Customer Location',
                    address: activeJob.location.address,
                  });
                } else {
                  const bookingId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
                  navigation.navigate('ActiveJob', {
                    job: { ...activeJob, bookingId },
                    bookingId,
                  });
                }
              }}
            />
          </View>
        )}

        {/* 4. Today's Earnings Card */}
        <EarningsSummaryCard
          todayEarnings={dashboardMetrics.todayEarnings || 0}
          completedJobsCount={dashboardMetrics.completedJobs || 0}
          activeJobsCount={activeJob ? 1 : 0}
          pendingRequestsCount={jobRequests.length}
          onPressViewDetails={() => navigation.navigate('MainTabs', { screen: 'EarningsTab' })}
          style={styles.sectionSpacing}
        />

        {/* 5. Incoming Booking Requests */}
        <View style={styles.sectionHeaderRow}>
          <SectionHeader
            title="Incoming Requests"
            subtitle={
              jobRequests.length > 0
                ? `${jobRequests.length} request${jobRequests.length > 1 ? 's' : ''} awaiting response`
                : 'Stay online to receive instant dispatches'
            }
            badge={jobRequests.length > 0 ? jobRequests.length : undefined}
            actionText={jobRequests.length > 3 ? 'View All' : undefined}
            onAction={() => navigation.navigate('JobRequests')}
          />
        </View>

        {jobRequests.length > 0 ? (
          jobRequests.slice(0, 3).map((job) => (
            <BookingRequestCard
              key={job.bookingId || job.id}
              job={job}
              isAccepting={acceptingJobId === (job.bookingId || job.id)}
              onAccept={handleCardAccept}
              onReject={handleCardReject}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="radio-outline"
              title="No Incoming Requests"
              description="Connected to live dispatch. When a customer in your area books a service, it will alert here."
            />
          </View>
        )}

        {/* 6. Upcoming Scheduled Bookings */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.md }]}>
          <SectionHeader
            title="Scheduled Slots"
            subtitle="Upcoming confirmed appointments"
            actionText="View Slots"
            onAction={() => navigation.navigate('MainTabs', { screen: 'SlotsTab' })}
          />
        </View>

        {upcomingScheduledList.length > 0 ? (
          upcomingScheduledList.map((slot: any, idx: number) => {
            const timeSlot = slot.timeSlot || slot.timeWindow || slot.scheduledAt || '09:00 AM';
            const dateStr = slot.scheduledDate || (slot.scheduledAt ? slot.scheduledAt.split('T')[0] : 'Today');
            return (
              <ScheduledBookingCard
                key={slot.bookingId || `sched-${idx}`}
                bookingId={slot.bookingId || `slot-${idx}`}
                serviceName={slot.serviceName || slot.service?.name || 'Scheduled Service'}
                customerName={slot.customerName || slot.user?.fullName}
                scheduledTime={timeSlot}
                scheduledDate={dateStr}
                locality={slot.locality || slot.customerAddress || 'Hyderabad'}
                durationMins={slot.durationMins || 60}
                status={slot.status || 'CONFIRMED'}
                payoutAmount={slot.payoutAmount || slot.totalAmount || slot.price}
                onPress={() => navigation.navigate('MainTabs', { screen: 'SlotsTab' })}
              />
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="calendar-outline"
              title="No Scheduled Jobs"
              description="Manage your availability and accept upcoming appointment slots in the Slots tab."
              actionLabel="Manage Availability"
              onAction={() => navigation.navigate('MainTabs', { screen: 'SlotsTab' })}
            />
          </View>
        )}

        {/* 7. Performance & Quality Summary */}
        <View style={styles.performanceCard}>
          <Text style={styles.perfTitle}>Partner Performance</Text>
          <View style={styles.perfGrid}>
            <View style={styles.perfItem}>
              <View style={styles.perfIconBox}>
                <Ionicons name="star" size={16} color={colors.warning} />
              </View>
              <Text style={styles.perfValue}>
                {dashboardMetrics.averageRating || worker.rating || '5.0'}
              </Text>
              <Text style={styles.perfLabel}>Rating ({worker.totalReviews || 0})</Text>
            </View>

            <View style={styles.perfDivider} />

            <View style={styles.perfItem}>
              <View style={styles.perfIconBox}>
                <Ionicons name="checkmark-done-circle" size={16} color={colors.success} />
              </View>
              <Text style={styles.perfValue}>
                {dashboardMetrics.completedJobs || worker.completedJobsCount || 0}
              </Text>
              <Text style={styles.perfLabel}>Jobs Done</Text>
            </View>

            <View style={styles.perfDivider} />

            <View style={styles.perfItem}>
              <View style={styles.perfIconBox}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              </View>
              <Text style={styles.perfValue}>98%</Text>
              <Text style={styles.perfLabel}>Acceptance</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 8. Pronto-Style Real-time Incoming Dispatch Modal */}
      <IncomingJobRequestModal
        visible={!!incomingModalJob}
        job={incomingModalJob}
        onAccept={handleModalAccept}
        onReject={handleModalReject}
        countdownSeconds={30}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl + 30,
  },
  sectionSpacing: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toastText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginHorizontal: spacing.sm,
  },
  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  perfTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  perfGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perfItem: {
    flex: 1,
    alignItems: 'center',
  },
  perfIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  perfValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  perfLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  perfDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
});

export default HomeDashboardScreen;
