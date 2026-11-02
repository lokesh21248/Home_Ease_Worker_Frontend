import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { useApp } from '../../state/AppContext';
import { resolveBookingUuid } from '../../utils/uuid';
import { PremiumCard } from '../../components/PremiumCard';
import { StatCard } from '../../components/StatCard';
import { SectionHeader } from '../../components/SectionHeader';
import { BookingCard } from '../../components/BookingCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { EmptyState } from '../../components/EmptyState';

export const HomeDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
    fetchSchedules,
    fetchJobRequests,
    locationData,
    gpsStatus,
    refreshLocation,
    dashboardMetrics,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchJobRequests().catch(() => {}),
      fetchSchedules().catch(() => {}),
      refreshLocation().catch(() => {}),
    ]);
    setRefreshing(false);
  };

  const handleRefreshLocation = async () => {
    if (isRefreshingLocation) return;
    setIsRefreshingLocation(true);
    try {
      await refreshLocation();
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  useEffect(() => {
    fetchSchedules().catch(() => {});
    fetchJobRequests().catch(() => {});
  }, []);

  // Re-fetch requests whenever screen comes into focus (e.g., navigating back from another screen)
  useFocusEffect(
    useCallback(() => {
      fetchJobRequests().catch(() => {});
    }, [])
  );

  const isOnline = worker.availability.isOnline;

  const getStatusDisplay = () => {
    if (gpsStatus === 'unavailable') {
      return {
        dotColor: '#F59E0B',
        label: 'GPS UNAVAILABLE',
        desc: 'Turn on GPS to receive nearby jobs',
      };
    }
    if (isOnline) {
      return {
        dotColor: '#10B981',
        label: 'You are ONLINE',
        desc: 'Ready & receiving customer orders in real-time',
      };
    }
    return {
      dotColor: '#718096',
      label: 'You are OFFLINE',
      desc: 'Turn switch ON to start receiving service requests',
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Top Profile & Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftCol}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Image source={{ uri: worker.photoUri }} style={styles.avatar} />
            <View
              style={[
                styles.avatarStatusBadge,
                { backgroundColor: statusDisplay.dotColor },
              ]}
            />
          </TouchableOpacity>

          <View style={styles.workerMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.workerName} numberOfLines={1}>
                {worker.name || 'Service Partner'}
              </Text>
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.subMetaRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {dashboardMetrics.averageRating || '5.0'}
                </Text>
              </View>

              <Text style={styles.dotSeparator}>•</Text>

              {/* Location Pill with 1-Tap Refresh */}
              <TouchableOpacity
                onPress={handleRefreshLocation}
                disabled={isRefreshingLocation}
                style={styles.locationPill}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={12} color={colors.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationData.locality || 'Madhapur'}
                </Text>
                {isRefreshingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 2 }} />
                ) : (
                  <Ionicons name="refresh-outline" size={11} color={colors.primary} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right Action Icons */}
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconCircle}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notifDotText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconCircle}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Global In-app Alert Banner */}
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
        {/* Availability Online / Offline Card */}
        <PremiumCard
          style={[
            styles.dutyCard,
            isOnline && styles.dutyCardOnline,
          ]}
        >
          <View style={styles.dutyContentRow}>
            <View style={styles.dutyLeft}>
              <View style={[styles.dutyStatusDot, { backgroundColor: statusDisplay.dotColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dutyStatusText}>{statusDisplay.label}</Text>
                <Text style={styles.dutySub} numberOfLines={1}>
                  {statusDisplay.desc}
                </Text>
              </View>
            </View>

            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </PremiumCard>

        {/* 4 Statistics Cards Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Today's Earnings"
            value={`₹${(dashboardMetrics.todayEarnings || 0).toLocaleString('en-IN')}`}
            icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
            badge="LIVE"
            badgePositive
          />
          <StatCard
            label="Today's Bookings"
            value={dashboardMetrics.todayJobs || 0}
            icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
          />
        </View>

        <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
          <StatCard
            label="Jobs Completed"
            value={dashboardMetrics.completedJobs || 0}
            icon={<Ionicons name="checkmark-done-circle-outline" size={18} color={colors.primary} />}
          />
          <StatCard
            label="Customer Rating"
            value={`${dashboardMetrics.averageRating || '5.0'} ★`}
            icon={<Ionicons name="star-outline" size={18} color={colors.primary} />}
            badge="TOP 5%"
            badgePositive
          />
        </View>

        {/* Active Job in Progress Banner */}
        {activeJob && (
          <PremiumCard style={styles.activeJobCard}>
            <View style={styles.activeJobHeaderRow}>
              <View style={styles.pulsingBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.activeJobBadgeText}>JOB IN PROGRESS</Text>
              </View>
              <Text style={styles.activeJobTime}>{activeJob.scheduledTime}</Text>
            </View>

            <View style={styles.activeJobBody}>
              <View style={styles.activeJobLeft}>
                <Text style={styles.activeServiceName}>{activeJob.serviceName}</Text>
                <Text style={styles.activeCustomerName}>
                  {activeJob.customer.name} • #{activeJob.jobId}
                </Text>
                <Text style={styles.activeAddress} numberOfLines={1}>
                  {activeJob.location.address}
                </Text>
              </View>
              <View style={styles.activePayoutBox}>
                <Text style={styles.activePayoutLabel}>Net Payout</Text>
                <Text style={styles.activePayoutValue}>₹{activeJob.netPayout}</Text>
              </View>
            </View>

            <PrimaryButton
              title="Open Live Execution & GPS"
              size="md"
              icon={<Ionicons name="navigate-outline" size={16} color="#FFFFFF" />}
              onPress={() => {
                const bookingId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
                navigation.navigate('ActiveJob', { job: { ...activeJob, bookingId }, bookingId });
              }}
              style={{ marginTop: spacing.md }}
            />
          </PremiumCard>
        )}

        {/* Incoming Job Requests Section */}
        <View style={styles.sectionHeaderWrap}>
          <SectionHeader
            title="Incoming Requests"
            subtitle={
              jobRequests.length > 0
                ? `${jobRequests.length} nearby requests waiting for acceptance`
                : 'Stay online to receive instant dispatches'
            }
            badge={jobRequests.length > 0 ? jobRequests.length : undefined}
            actionText={jobRequests.length > 3 ? 'View All' : undefined}
            onAction={() => navigation.navigate('JobRequests')}
          />
        </View>

        {jobRequests.length > 0 ? (
          jobRequests.slice(0, 3).map((job) => (
            <BookingCard
              key={job.bookingId || job.id}
              job={job}
              onPress={() => navigation.navigate('JobDetails', { job })}
              onAccept={() => {
                const bookingId = resolveBookingUuid(job.bookingId, job.id);
                acceptJob(bookingId);
                navigation.navigate('ActiveJob', {
                  job: { ...job, id: bookingId, bookingId, status: 'accepted' },
                  bookingId,
                });
              }}
              onReject={() => rejectJob(job.id, 'Partner unavailable')}
            />
          ))
        ) : (
          <PremiumCard style={styles.emptyRequestsWrap}>
            <EmptyState
              iconName="radio-outline"
              title="No Incoming Requests"
              description="You are connected to live dispatch. When a customer in your area requests service, it will alert here."
            />
          </PremiumCard>
        )}

        {/* Today's Schedule Preview */}
        <View style={styles.sectionHeaderWrap}>
          <SectionHeader
            title="Today's Schedule & Slots"
            subtitle="Preview of confirmed and open booking windows"
            actionText="Manage Slots"
            onAction={() => navigation.navigate('MainTabs', { screen: 'SlotsTab' })}
          />
        </View>

        {todaySchedule && todaySchedule.schedule.length > 0 ? (
          todaySchedule.schedule.slice(0, 3).map((slot, idx) => (
            <PremiumCard key={slot.bookingId || `today-slot-${idx}`} style={styles.scheduleItemCard}>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleTimeBox}>
                  <Text style={styles.scheduleTimeText}>
                    {slot.timeWindow || slot.scheduledAt || '09:00 AM'}
                  </Text>
                  <Text style={styles.scheduleTypeTag}>{slot.bookingType || 'SCHEDULED'}</Text>
                </View>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleMetaCol}>
                  <Text style={styles.scheduleServiceName} numberOfLines={1}>
                    {slot.serviceName || 'Home Service'}
                  </Text>
                  <Text style={styles.scheduleCustomerName} numberOfLines={1}>
                    {slot.customerName || 'Customer Booking'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </PremiumCard>
          ))
        ) : (
          <PremiumCard style={styles.scheduleEmptyCard}>
            <View style={styles.scheduleEmptyContent}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.scheduleEmptyTitle}>No Bookings Assigned Yet Today</Text>
                <Text style={styles.scheduleEmptySub}>
                  Slots are open. Manage your working hours in the Slots tab.
                </Text>
              </View>
              <SecondaryButton
                title="View Slots"
                size="sm"
                onPress={() => navigation.navigate('MainTabs', { screen: 'SlotsTab' })}
              />
            </View>
          </PremiumCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarStatusBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  workerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: colors.textMuted,
    fontSize: 12,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    maxWidth: 130,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 3,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.full,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notifDotText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toastBanner: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  dutyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  dutyCardOnline: {
    borderColor: '#C7D7F9',
  },
  dutyContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dutyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  dutyStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  dutyStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dutySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  activeJobCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  activeJobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  activeJobBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  activeJobTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeJobBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeJobLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  activeServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeCustomerName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  activePayoutBox: {
    alignItems: 'flex-end',
  },
  activePayoutLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  activePayoutValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionHeaderWrap: {
    marginTop: spacing.xl,
  },
  emptyRequestsWrap: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  scheduleItemCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTimeBox: {
    width: 80,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scheduleTypeTag: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  scheduleDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  scheduleMetaCol: {
    flex: 1,
  },
  scheduleServiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scheduleCustomerName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scheduleEmptyCard: {
    padding: spacing.md,
  },
  scheduleEmptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleEmptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scheduleEmptySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default HomeDashboardScreen;
