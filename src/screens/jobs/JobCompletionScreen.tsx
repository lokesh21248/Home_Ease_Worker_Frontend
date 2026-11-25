import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
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
import { safeGoBack } from '../../utils/navigationHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'JobCompletion'>;

export const JobCompletionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { completeActiveJob } = useApp();

  const basePrice = job.price || 0;
  const extraAddOnsTotal = (job.subServices || []).reduce(
    (acc, sub) => acc + sub.quantity * sub.price,
    0
  );
  const totalBillAmount =
    job.totalAmount && job.totalAmount > basePrice
      ? job.totalAmount
      : basePrice + extraAddOnsTotal;
  const isOnlinePrepaid =
    job.paymentMode === 'Online Pre-paid' && extraAddOnsTotal === 0;
  const remainingDue = isOnlinePrepaid
    ? 0
    : job.paymentMode === 'Online Pre-paid'
    ? extraAddOnsTotal
    : totalBillAmount;

  const [paymentMethodCollected, setPaymentMethodCollected] = useState<'Cash' | 'UPI'>(
    job.paymentMode === 'UPI at Destination' ? 'UPI' : 'Cash'
  );
  const [hasConfirmedCollection, setHasConfirmedCollection] = useState<boolean>(
    remainingDue === 0
  );

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [workNotes, setWorkNotes] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (remainingDue > 0 && !hasConfirmedCollection) {
      Alert.alert(
        'Payment Collection Required',
        `Please collect ₹${remainingDue} from the customer before submitting completion.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Confirm ₹${remainingDue} Collected`,
            onPress: () => {
              setHasConfirmedCollection(true);
            },
          },
        ]
      );
      return;
    }

    const finalBefore = beforeImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400';
    const finalAfter = afterImage || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400';

    setIsSubmitting(true);
    try {
      await completeActiveJob({
        beforeImageUri: finalBefore,
        afterImageUri: finalAfter,
        customerSignatureUri: hasSignature ? 'signed_valid_token' : undefined,
        notes: workNotes || 'Service completed successfully to customer satisfaction.',
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to complete job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndExit = () => {
    setShowSuccessModal(false);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'EarningsTab' },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Job Completion"
        subtitle={`Order #${job.jobId} Proof & Verification`}
        showBack
        onBack={() => safeGoBack(navigation, 'MainTabs', { screen: 'JobsTab' })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payout Summary Ribbon */}
        <View style={styles.payoutRibbon}>
          <View>
            <Text style={styles.ribbonLabel}>Ready to Credit Your Wallet</Text>
            <Text style={styles.ribbonService}>{job.serviceName}</Text>
          </View>
          <Text style={styles.ribbonAmount}>₹{job.netPayout}</Text>
        </View>

        {/* Payment Collection & Verification Card (Pronto Style) */}
        <PremiumCard style={styles.paymentCard}>
          <View style={styles.paymentHeaderRow}>
            <View>
              <Text style={styles.paymentCardTitle}>Customer Payment Settlement</Text>
              <Text style={styles.paymentModeLabel}>
                Billing Mode: <Text style={{ fontWeight: '700' }}>{job.paymentMode || 'Cash on Delivery'}</Text>
              </Text>
            </View>
            <View
              style={[
                styles.paymentStatusBadge,
                remainingDue === 0 || hasConfirmedCollection
                  ? styles.badgePaid
                  : styles.badgePending,
              ]}
            >
              <Ionicons
                name={
                  remainingDue === 0 || hasConfirmedCollection
                    ? 'checkmark-circle'
                    : 'alert-circle'
                }
                size={14}
                color={
                  remainingDue === 0 || hasConfirmedCollection
                    ? '#16A34A'
                    : '#D97706'
                }
              />
              <Text
                style={[
                  styles.paymentBadgeText,
                  remainingDue === 0 || hasConfirmedCollection
                    ? styles.textPaid
                    : styles.textPending,
                ]}
              >
                {remainingDue === 0
                  ? 'PRE-PAID ONLINE'
                  : hasConfirmedCollection
                  ? 'COLLECTED'
                  : 'PENDING COLLECTION'}
              </Text>
            </View>
          </View>

          <View style={styles.amountCollectBox}>
            <Text style={styles.amountCollectLabel}>
              {remainingDue === 0 ? 'Total Order Amount' : 'Amount to Collect from Customer'}
            </Text>
            <Text style={styles.amountCollectValue}>₹{remainingDue === 0 ? totalBillAmount : remainingDue}</Text>
          </View>

          {remainingDue > 0 && (
            <View style={styles.collectionActionSection}>
              <Text style={styles.methodSelectLabel}>Payment Received Via:</Text>
              <View style={styles.paymentMethodPills}>
                <TouchableOpacity
                  style={[
                    styles.methodPill,
                    paymentMethodCollected === 'Cash' && styles.methodPillActive,
                  ]}
                  onPress={() => setPaymentMethodCollected('Cash')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={paymentMethodCollected === 'Cash' ? '#FFFFFF' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.methodPillText,
                      paymentMethodCollected === 'Cash' && styles.methodPillTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodPill,
                    paymentMethodCollected === 'UPI' && styles.methodPillActive,
                  ]}
                  onPress={() => setPaymentMethodCollected('UPI')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={16}
                    color={paymentMethodCollected === 'UPI' ? '#FFFFFF' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.methodPillText,
                      paymentMethodCollected === 'UPI' && styles.methodPillTextActive,
                    ]}
                  >
                    UPI / QR
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmCollectionToggle,
                  hasConfirmedCollection && styles.confirmCollectionToggleActive,
                ]}
                onPress={() => setHasConfirmedCollection(!hasConfirmedCollection)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={hasConfirmedCollection ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={hasConfirmedCollection ? '#16A34A' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.confirmCollectionText,
                    hasConfirmedCollection && styles.confirmCollectionTextActive,
                  ]}
                >
                  {hasConfirmedCollection
                    ? `✓ Confirmed: ₹${remainingDue} received in ${paymentMethodCollected}`
                    : `I have collected ₹${remainingDue} in ${paymentMethodCollected}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </PremiumCard>

        {/* Before and After Proofs Upload UI */}
        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Service Proof Photos *</Text>
          <Text style={styles.cardSub}>
            Take clear photos before starting and after completing the work.
          </Text>

          <View style={styles.photoGrid}>
            {/* Before Photo */}
            <View style={styles.photoCol}>
              <Text style={styles.photoLabel}>1. Before Work</Text>
              <TouchableOpacity
                style={styles.photoBox}
                activeOpacity={0.8}
                onPress={() =>
                  setBeforeImage(
                    beforeImage
                      ? null
                      : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'
                  )
                }
              >
                {beforeImage ? (
                  <>
                    <Image source={{ uri: beforeImage }} style={styles.previewImage} />
                    <View style={styles.photoStatusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    <Text style={styles.placeholderText}>Tap to Add</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* After Photo */}
            <View style={styles.photoCol}>
              <Text style={styles.photoLabel}>2. After Work</Text>
              <TouchableOpacity
                style={styles.photoBox}
                activeOpacity={0.8}
                onPress={() =>
                  setAfterImage(
                    afterImage
                      ? null
                      : 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'
                  )
                }
              >
                {afterImage ? (
                  <>
                    <Image source={{ uri: afterImage }} style={styles.previewImage} />
                    <View style={styles.photoStatusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    <Text style={styles.placeholderText}>Tap to Add</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </PremiumCard>

        {/* Customer Signature Pad */}
        <PremiumCard style={styles.card}>
          <View style={styles.sigHeaderRow}>
            <Text style={styles.cardTitle}>Customer Digital Sign-Off</Text>
            <Text style={styles.optionalTag}>(Optional)</Text>
          </View>
          <Text style={styles.cardSub}>
            Have customer sign on screen to confirm satisfactory completion:
          </Text>

          <TouchableOpacity
            style={[styles.signatureBox, hasSignature && styles.signatureBoxSigned]}
            activeOpacity={0.8}
            onPress={() => setHasSignature(!hasSignature)}
          >
            {hasSignature ? (
              <View style={styles.signatureContent}>
                <Text style={styles.signatureSampleText}>{job.customer.name}</Text>
                <View style={styles.signedPill}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.signedPillText}>
                    Digitally Verified • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Ionicons name="pencil-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.sigPlaceholderText}>
                  Tap here to capture customer sign-off
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </PremiumCard>

        {/* Worker Completion Notes */}
        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Service Summary Notes</Text>
          <TextInput
            placeholder="Add any extra parts used or details for customer..."
            placeholderTextColor={colors.textSecondary}
            value={workNotes}
            onChangeText={setWorkNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </PremiumCard>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Submit & Settle Payout"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit}
          icon={<Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />}
        />
      </View>

      {/* Celebration Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationCard}>
            <View style={styles.confettiCircle}>
              <Ionicons name="trophy-outline" size={40} color={colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Job Completed!</Text>
            <Text style={styles.modalSub}>
              Great work! Net payout of <Text style={styles.highlightPay}>₹{job.netPayout}</Text> has
              been credited to your partner wallet.
            </Text>

            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryItem}>
                <Text style={styles.sumLbl}>Service Fee</Text>
                <Text style={styles.sumVal}>₹{job.price}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.sumLbl}>Platform Fee (15%)</Text>
                <Text style={[styles.sumVal, { color: colors.danger }]}>- ₹{job.commission}</Text>
              </View>
              <View style={[styles.summaryItem, styles.sumTotalItem]}>
                <Text style={styles.sumTotalLbl}>Credited to Wallet</Text>
                <Text style={styles.sumTotalVal}>₹{job.netPayout}</Text>
              </View>
            </View>

            <PrimaryButton
              title="Go to Earnings & Wallet"
              size="lg"
              fullWidth
              onPress={handleFinishAndExit}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>
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
  payoutRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ribbonLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  ribbonService: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  ribbonAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    marginBottom: spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  photoBox: {
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  sigHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionalTag: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  signatureBox: {
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  signatureBoxSigned: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  signatureContent: {
    alignItems: 'center',
  },
  signatureSampleText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  signedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  signedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  signaturePlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  sigPlaceholderText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  celebrationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  confettiCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  highlightPay: {
    color: colors.primary,
    fontWeight: '800',
  },
  summaryBreakdown: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sumLbl: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sumTotalItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  sumTotalLbl: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sumTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentCard: {
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  paymentCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentModeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePaid: {
    backgroundColor: '#DCFCE7',
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textPending: {
    color: '#D97706',
  },
  textPaid: {
    color: '#16A34A',
  },
  amountCollectBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  amountCollectLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amountCollectValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  collectionActionSection: {
    marginTop: spacing.xs,
  },
  methodSelectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  paymentMethodPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  methodPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  methodPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  methodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmCollectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm + 2,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCollectionToggleActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  confirmCollectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  confirmCollectionTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});

export default JobCompletionScreen;
