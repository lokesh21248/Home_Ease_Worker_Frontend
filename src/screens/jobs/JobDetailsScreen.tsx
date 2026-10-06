import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { useApp } from '../../state/AppContext';
import { openTurnByTurnNavigation } from '../../utils/navigationHelper';
import { resolveBookingUuid } from '../../utils/uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { acceptJob, rejectJob } = useApp();

  const handleAccept = () => {
    const bookingId = resolveBookingUuid(job.bookingId, job.id);
    navigation.navigate('ActiveJob', { job: { ...job, bookingId, status: 'accepted' }, bookingId });
  };

  const handleReject = () => {
    Alert.alert(
      'Decline Booking',
      `Decline #${job.jobId} for ${job.customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            rejectJob(job.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Booking ${job.jobId}`}
        subtitle={job.category}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Badge
            label={job.status.toUpperCase()}
            variant={job.status === 'requested' ? 'warning' : 'success'}
            size="sm"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Profile Card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Image source={{ uri: job.customer.avatar }} style={styles.avatar} />
            <View style={styles.customerMeta}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.customerName}>{job.customer.name}</Text>
                <Badge label="Verified User" variant="primary" size="sm" />
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.accent} />
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
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service & Schedule Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Service Requirements</Text>
          <View style={styles.serviceItem}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="construct" size={20} color={colors.primary} />
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
        </View>

        {/* Destination Location Card */}
        <View style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.sectionHeader}>Service Location</Text>
            <Text style={styles.distanceBadge}>{job.location.distanceKm} km away</Text>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="location" size={20} color={colors.danger} style={{ marginTop: 2 }} />
            <View style={styles.addressTextCol}>
              <Text style={styles.addressLine}>{job.location.address}</Text>
              {job.location.landmark && (
                <Text style={styles.landmarkLine}>Landmark: {job.location.landmark}</Text>
              )}
              <Text style={styles.cityPincode}>
                {job.location.city} - {job.location.pincode}
              </Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <Button
              title="1-Tap GPS (Maps)"
              variant="primary"
              size="md"
              onPress={() =>
                openTurnByTurnNavigation({
                  latitude: job.location.latitude,
                  longitude: job.location.longitude,
                  label: `${job.customer.name} - ${job.serviceName}`,
                  address: job.location.address,
                })
              }
              icon={<Ionicons name="navigate" size={16} color={colors.textInverse} />}
              style={{ flex: 1.2 }}
            />
            <Button
              title="In-App View"
              variant="secondary"
              size="md"
              onPress={() => navigation.navigate('NavigationTracking', { job })}
              icon={<Ionicons name="map-outline" size={16} color={colors.textInverse} />}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Customer Instructions */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Customer Notes & Instructions</Text>
          <View style={styles.notesBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            <Text style={styles.notesText}>{job.instructions}</Text>
          </View>
        </View>

        {/* Pricing Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Fare & Payout Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Service Total (Customer Paid)</Text>
            <Text style={styles.priceItemValue}>₹{job.price}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Platform Service Commission (15%)</Text>
            <Text style={[styles.priceItemValue, { color: colors.danger }]}>
              - ₹{job.commission}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Payment Mode</Text>
            <Badge label={job.paymentMode} variant="info" size="sm" />
          </View>

          <View style={styles.payoutHighlightBox}>
            <View>
              <Text style={styles.payoutTitle}>Your Net Take-Home</Text>
              <Text style={styles.payoutSub}>Direct credit to wallet on completion</Text>
            </View>
            <Text style={styles.netPayoutValue}>₹{job.netPayout}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {job.status === 'requested' ? (
          <View style={styles.btnRow}>
            <Button
              title="Decline"
              variant="outline"
              size="lg"
              onPress={handleReject}
              style={styles.rejectBtn}
              textStyle={{ color: colors.danger }}
            />
            <Button
              title="Accept & Start"
              variant="primary"
              size="lg"
              onPress={handleAccept}
              style={styles.acceptBtn}
              icon={<Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />}
            />
          </View>
        ) : (
          <Button
            title="Proceed to Active Job Screen"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              const bookingId = resolveBookingUuid(job.bookingId, job.id);
              navigation.navigate('ActiveJob', { job: { ...job, bookingId }, bookingId });
            }}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
            iconPosition="right"
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceAlt,
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
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  callCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  serviceTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  serviceEst: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
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
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  distanceBadge: {
    ...typography.caption,
    backgroundColor: colors.primaryLighter,
    color: colors.primary,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  addressTextCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  addressLine: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  landmarkLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cityPincode: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  navigateBtn: {
    marginTop: spacing.xs,
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLighter,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  notesText: {
    ...typography.body2,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  priceItemLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  priceItemValue: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  payoutHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  payoutTitle: {
    ...typography.subtitle2,
    color: '#065F46',
    fontWeight: '800',
  },
  payoutSub: {
    ...typography.caption,
    color: '#047857',
    fontSize: 11,
    marginTop: 1,
  },
  netPayoutValue: {
    ...typography.h2,
    color: colors.success,
    fontWeight: '900',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectBtn: {
    flex: 1,
    borderColor: colors.danger,
  },
  acceptBtn: {
    flex: 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});

export default JobDetailsScreen;
