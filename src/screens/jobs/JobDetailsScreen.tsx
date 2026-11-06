import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation, safeGoBack } from '../../utils/navigationHelper';
import { resolveBookingUuid } from '../../utils/uuid';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { acceptJob, rejectJob } = useApp();
  const [liveBooking, setLiveBooking] = useState<any>(null);

  useEffect(() => {
    const bookingUuid = resolveBookingUuid(job.bookingId, job.id);
    workerApiService
      .getBookingDetails(bookingUuid)
      .then((res: any) => {
        if (res) {
          setLiveBooking(res);
        }
      })
      .catch(() => {});
  }, [job]);

  const handleAccept = () => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    acceptJob(bookingId);
    navigation.navigate('ActiveJob', {
      job: { ...job, bookingId, status: 'accepted' },
      bookingId,
    });
  };

  const handleReject = () => {
    Alert.alert(
      'Decline Booking',
      `Are you sure you want to decline job #${job.jobId} for ${job.customer.name}?`,
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            rejectJob(job.id);
            safeGoBack(navigation, 'MainTabs', { screen: 'JobsTab' });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'started':
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title={`Booking #${job.jobId}`}
        subtitle={job.category || 'Home Service'}
        showBack
        onBack={() => safeGoBack(navigation, 'MainTabs', { screen: 'JobsTab' })}
        rightAction={
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(job.status) + '15' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(job.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(job.status) },
              ]}
            >
              {job.status.toUpperCase()}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Profile Card */}
        <PremiumCard style={styles.card}>
          <View style={styles.customerRow}>
            <Image
              source={{
                uri:
                  job.customer.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.customerMeta}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.customerName}>{job.customer.name}</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {job.customer.rating} ({job.customer.totalBookings} past bookings)
                </Text>
              </View>
            </View>

            {/* Quick Call Button */}
            <TouchableOpacity
              style={styles.callCircle}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Dialing Customer', `Calling ${job.customer.phone}...`)}
            >
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </PremiumCard>

        {/* Service Requirements Card */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionHeader}>Service Requirements</Text>
          <View style={styles.serviceItem}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="construct-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.serviceTextCol}>
              <Text style={styles.serviceTitle}>{job.serviceName}</Text>
              <Text style={styles.serviceEst}>
                Estimated Duration: {job.estimatedDuration}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Schedule Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Scheduled Date</Text>
              <View style={styles.infoValueRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.infoValue}>{job.scheduledDate}</Text>
              </View>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Time Slot</Text>
              <View style={styles.infoValueRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.infoValue}>{job.scheduledTime}</Text>
              </View>
            </View>
          </View>
        </PremiumCard>

        {/* Destination Location Card */}
        <PremiumCard style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.sectionHeader}>Service Location</Text>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-outline" size={12} color={colors.primary} />
              <Text style={styles.distanceText}>{job.location.distanceKm} km away</Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={styles.addressTextCol}>
              <Text style={styles.addressLine}>{job.location.address}</Text>
              {job.location.landmark ? (
                <Text style={styles.landmarkLine}>Landmark: {job.location.landmark}</Text>
              ) : null}
              <Text style={styles.cityPincode}>
                {job.location.city} - {job.location.pincode}
              </Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <PrimaryButton
              title="1-Tap GPS (Maps)"
              size="md"
              onPress={() =>
                openTurnByTurnNavigation({
                  latitude: job.location.latitude,
                  longitude: job.location.longitude,
                  label: `${job.customer.name} - ${job.serviceName}`,
                  address: job.location.address,
                })
              }
              icon={<Ionicons name="navigate-circle-outline" size={18} color="#FFFFFF" />}
              style={{ flex: 1.2 }}
            />
            <SecondaryButton
              title="In-App View"
              size="md"
              onPress={() => navigation.navigate('NavigationTracking', { job })}
              icon={<Ionicons name="map-outline" size={18} color={colors.primary} />}
              style={{ flex: 1 }}
            />
          </View>
        </PremiumCard>

        {/* Customer Instructions */}
        {job.instructions ? (
          <PremiumCard style={styles.card}>
            <Text style={styles.sectionHeader}>Customer Notes & Instructions</Text>
            <View style={styles.notesBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.notesText}>{job.instructions}</Text>
            </View>
          </PremiumCard>
        ) : null}

        {/* Pricing Breakdown Card */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionHeader}>Fare & Payout Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Service Total (Customer Paid)</Text>
            <Text style={styles.priceItemValue}>₹{job.price}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Platform Fee / Commission (15%)</Text>
            <Text style={[styles.priceItemValue, { color: colors.danger }]}>
              - ₹{job.commission}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Payment Mode</Text>
            <View style={styles.payModePill}>
              <Ionicons name="card-outline" size={12} color={colors.primary} />
              <Text style={styles.payModeText}>{job.paymentMode}</Text>
            </View>
          </View>

          <View style={styles.payoutHighlightBox}>
            <View>
              <Text style={styles.payoutTitle}>Your Net Take-Home</Text>
              <Text style={styles.payoutSub}>Direct credit to wallet on completion</Text>
            </View>
            <Text style={styles.netPayoutValue}>₹{job.netPayout}</Text>
          </View>
        </PremiumCard>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {job.status === 'requested' ? (
          <View style={styles.btnRow}>
            <SecondaryButton
              title="Decline"
              size="lg"
              onPress={handleReject}
              style={styles.rejectBtn}
              textStyle={{ color: colors.danger }}
            />
            <PrimaryButton
              title="Accept & Start"
              size="lg"
              onPress={handleAccept}
              style={styles.acceptBtn}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
            />
          </View>
        ) : (
          <PrimaryButton
            title="Proceed to Active Job Screen"
            size="lg"
            fullWidth
            onPress={() => {
              const bookingId = resolveBookingUuid(job.bookingId, job.id);
              navigation.navigate('ActiveJob', { job: { ...job, bookingId }, bookingId });
            }}
            iconRight={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
  },
  customerMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  callCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceEst: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  addressTextCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  landmarkLine: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cityPincode: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  priceItemLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  payModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  payModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  payoutHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  payoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payoutSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  netPayoutValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    borderColor: colors.danger,
  },
  acceptBtn: {
    flex: 2,
  },
});

export default JobDetailsScreen;
