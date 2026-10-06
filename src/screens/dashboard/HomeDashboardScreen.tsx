import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import JobCard from '../../components/JobCard';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { useApp } from '../../state/AppContext';
import { resolveBookingUuid } from '../../utils/uuid';

export const HomeDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    worker,
    toggleOnlineStatus,
    jobRequests,
    activeJob,
    earnings,
    unreadNotificationsCount,
    acceptJob,
    rejectJob,
    activeBannerAlert,
    dismissBannerAlert,
  } = useApp();

  const isOnline = worker.availability.isOnline;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Professional Header */}
      <View style={styles.topHeader}>
        <View style={styles.workerProfileRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Image source={{ uri: worker.photoUri }} style={styles.avatar} />
            <View
              style={[
                styles.avatarStatusBadge,
                { backgroundColor: isOnline ? colors.onlineGreen : colors.offlineGray },
              ]}
            />
          </TouchableOpacity>

          <View style={styles.workerMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.starGold} />
              <Text style={styles.ratingText}>{worker.rating} • Top Rated</Text>
            </View>
          </View>
        </View>

        {/* Notifications & SOS */}
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconCircle}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notifDotText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Global In-app Toast Banner if triggered */}
      {activeBannerAlert && (
        <View style={styles.toastBanner}>
          <Ionicons name="notifications" size={18} color={colors.primary} />
          <Text style={styles.toastText} numberOfLines={2}>
            {activeBannerAlert}
          </Text>
          <TouchableOpacity onPress={dismissBannerAlert} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Online / Offline Floating Card */}
        <View style={[styles.dutyStatusCard, isOnline ? styles.dutyOnline : styles.dutyOffline]}>
          <View style={styles.dutyLeft}>
            <View
              style={[
                styles.dutyIndicator,
                { backgroundColor: isOnline ? colors.onlineGreen : colors.offlineGray },
              ]}
            />
            <View>
              <Text style={styles.dutyStatusText}>
                {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
              </Text>
              <Text style={styles.dutySub}>
                {isOnline
                  ? 'Accepting incoming service calls'
                  : 'Turn on to start receiving jobs'}
              </Text>
            </View>
          </View>

          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: colors.borderDark, true: colors.onlineGreen }}
            thumbColor={colors.surface}
          />
        </View>

        {/* 4 Dashboard Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Today's Jobs */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.primaryLighter }]}>
              <Ionicons name="briefcase" size={20} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{earnings.daily.completedJobs || 5}</Text>
            <Text style={styles.metricLabel}>Today&apos;s Jobs</Text>
          </View>

          {/* Card 2: Today's Earnings */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MainTabs', { screen: 'EarningsTab' })}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: colors.successLight }]}>
              <Ionicons name="wallet" size={20} color={colors.success} />
            </View>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              ₹{earnings.daily.netPayout.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Today&apos;s Earnings</Text>
          </TouchableOpacity>

          {/* Card 3: Completed Jobs */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="checkmark-done-circle" size={20} color={colors.info} />
            </View>
            <Text style={styles.metricValue}>{worker.completedJobsCount}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          {/* Card 4: Rating */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ReviewsRatings')}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="star" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {worker.rating} ★
            </Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE JOB BANNER (If worker has ongoing order) */}
        {activeJob && (
          <View style={styles.activeJobBanner}>
            <View style={styles.activeJobHeader}>
              <View style={styles.pulsingBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.activeJobBadgeText}>JOB IN PROGRESS</Text>
              </View>
              <Text style={styles.activeJobTime}>{activeJob.scheduledTime}</Text>
            </View>

            <View style={styles.activeJobDetailsRow}>
              <Image source={{ uri: activeJob.customer.avatar }} style={styles.customerThumb} />
              <View style={styles.activeJobCol}>
                <Text style={styles.activeCustomerName}>{activeJob.customer.name}</Text>
                <Text style={styles.activeServiceName}>{activeJob.serviceName}</Text>
                <Text style={styles.activeLocationText} numberOfLines={1}>
                  {activeJob.location.address}
                </Text>
              </View>
              <View style={styles.activePayoutWrap}>
                <Text style={styles.activePayoutVal}>₹{activeJob.netPayout}</Text>
                <Text style={styles.activePayoutTag}>{activeJob.status}</Text>
              </View>
            </View>

            <View style={styles.activeJobActions}>
              <Button
                title="Open Live Tracking & Status"
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => {
                  const bookingId = resolveBookingUuid(activeJob.bookingId, activeJob.id);
                  navigation.navigate('ActiveJob', { job: { ...activeJob, bookingId }, bookingId });
                }}
                icon={<Ionicons name="navigate" size={18} color={colors.textInverse} />}
              />
            </View>
          </View>
        )}

        {/* New Job Requests Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>New Job Requests</Text>
            <Text style={styles.sectionSubtitle}>
              {jobRequests.length > 0
                ? `${jobRequests.length} nearby requests waiting for your acceptance`
                : 'No pending requests at the moment'}
            </Text>
          </View>

          {jobRequests.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('JobRequests')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All ({jobRequests.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {jobRequests.length > 0 ? (
          jobRequests.slice(0, 2).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => navigation.navigate('JobDetails', { job })}
              onAccept={() => {
                const bookingId = resolveBookingUuid(job.bookingId, job.id);
                acceptJob(bookingId);
                navigation.navigate('ActiveJob', { job: { ...job, id: bookingId, bookingId, status: 'accepted' }, bookingId });
              }}
              onReject={() => rejectJob(job.id)}
            />
          ))
        ) : (
          <View style={styles.emptyRequestsBox}>
            <Ionicons name="radio-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyRequestsTitle}>Looking for nearby bookings...</Text>
            <Text style={styles.emptyRequestsSub}>
              Stay online and within your coverage zone to receive priority requests.
            </Text>
          </View>
        )}

        {/* Quick Action Shortcuts */}
        <View style={styles.quickShortcuts}>
          <Text style={styles.quickShortcutsTitle}>Quick Actions</Text>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity
              style={styles.shortcutItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('JobRequests')}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.primaryLighter }]}>
                <Ionicons name="flash" size={20} color={colors.primary} />
              </View>
              <Text style={styles.shortcutText}>Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="card" size={20} color={colors.success} />
              </View>
              <Text style={styles.shortcutText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('BankDetails')}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="business" size={20} color={colors.info} />
              </View>
              <Text style={styles.shortcutText}>Bank Acc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Support')}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="headset" size={20} color={colors.accent} />
              </View>
              <Text style={styles.shortcutText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  workerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  workerMeta: {
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginLeft: 3,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.primarySoft,
  },
  toastText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dutyStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  dutyOnline: {
    backgroundColor: colors.surface,
    borderColor: colors.onlineGreen,
  },
  dutyOffline: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderDark,
  },
  dutyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dutyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  dutyStatusText: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  dutySub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  activeJobBanner: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onlineGreen,
    marginRight: 6,
  },
  activeJobBadgeText: {
    ...typography.caption,
    color: colors.onlineGreen,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  activeJobTime: {
    ...typography.caption,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeJobDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  activeJobCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activeCustomerName: {
    ...typography.subtitle1,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  activeServiceName: {
    ...typography.caption,
    color: '#38BDF8',
    fontWeight: '600',
  },
  activeLocationText: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  activePayoutWrap: {
    alignItems: 'flex-end',
  },
  activePayoutVal: {
    ...typography.h3,
    color: '#4ADE80',
    fontWeight: '800',
  },
  activePayoutTag: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  activeJobActions: {
    marginTop: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewAllText: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyRequestsBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  emptyRequestsTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyRequestsSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  quickShortcuts: {
    marginTop: spacing.sm,
  },
  quickShortcutsTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutItem: {
    alignItems: 'center',
    width: '23%',
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  shortcutText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeDashboardScreen;
