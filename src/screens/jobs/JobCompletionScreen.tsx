import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'JobCompletion'>;

export const JobCompletionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { job } = route.params;
  const { completeActiveJob } = useApp();

  const [beforeImage, setBeforeImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'
  );
  const [afterImage, setAfterImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&q=80'
  );
  const [hasSignature, setHasSignature] = useState<boolean>(true);
  const [workNotes, setWorkNotes] = useState<string>(
    'Service completed thoroughly. Fixed loose pipe joint and wiped down kitchen tiles.'
  );
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!beforeImage || !afterImage) {
      Alert.alert('Photos Required', 'Please provide both Before & After proof photos.');
      return;
    }

    // Complete active job in state (calls backend POST /workers/bookings/{bookingId}/complete and credits wallet)
    await completeActiveJob({
      beforeImageUri: beforeImage,
      afterImageUri: afterImage,
      customerSignatureUri: hasSignature ? 'signed_valid_token' : undefined,
      notes: workNotes,
    });

    setShowSuccessModal(true);
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
    <SafeAreaView style={styles.container}>
      <Header
        title="Job Completion"
        subtitle={`Order #${job.jobId} Proof & Verification`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Payout Summary Ribbon */}
        <View style={styles.payoutRibbon}>
          <View>
            <Text style={styles.ribbonLabel}>Ready to Credit Your Wallet</Text>
            <Text style={styles.ribbonService}>{job.serviceName}</Text>
          </View>
          <Text style={styles.ribbonAmount}>₹{job.netPayout}</Text>
        </View>

        {/* Before and After Proofs Upload UI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Proof Photos *</Text>
          <Text style={styles.cardSub}>
            Take clear photos before starting and after finishing the work.
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
                      : 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'
                  )
                }
              >
                {beforeImage ? (
                  <>
                    <Image source={{ uri: beforeImage }} style={styles.previewImage} />
                    <View style={styles.photoStatusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
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
                      : 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&q=80'
                  )
                }
              >
                {afterImage ? (
                  <>
                    <Image source={{ uri: afterImage }} style={styles.previewImage} />
                    <View style={styles.photoStatusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
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
        </View>

        {/* Customer Signature Pad Simulation */}
        <View style={styles.card}>
          <View style={styles.sigHeaderRow}>
            <Text style={styles.cardTitle}>Customer Digital Signature</Text>
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
                {/* Simulated signature cursive lines */}
                <Text style={styles.signatureSampleText}>{job.customer.name}</Text>
                <Text style={styles.signedPill}>
                  ✓ Digitally Verified Signature • {new Date().toLocaleTimeString()}
                </Text>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Ionicons name="pencil" size={24} color={colors.textMuted} />
                <Text style={styles.sigPlaceholderText}>
                  Tap here to capture customer finger signature
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Worker Completion Notes */}
        <View style={styles.card}>
          <Input
            label="Service Summary Notes"
            placeholder="Add any extra parts used or details for customer..."
            value={workNotes}
            onChangeText={setWorkNotes}
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 70, textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title="Submit & Settle Payout ₹"
          variant="success"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          icon={<Ionicons name="shield-checkmark" size={18} color={colors.textInverse} />}
        />
      </View>

      {/* Celebration Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationCard}>
            <View style={styles.confettiCircle}>
              <Ionicons name="trophy" size={44} color={colors.accent} />
            </View>

            <Text style={styles.modalTitle}>Job Completed Successfully!</Text>
            <Text style={styles.modalSub}>
              Great work! Payout of <Text style={styles.highlightPay}>₹{job.netPayout}</Text> has
              been credited to your HomeEase wallet instantly.
            </Text>

            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryItem}>
                <Text style={styles.sumLbl}>Service Fee</Text>
                <Text style={styles.sumVal}>₹{job.price}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.sumLbl}>Commission (15%)</Text>
                <Text style={[styles.sumVal, { color: colors.danger }]}>- ₹{job.commission}</Text>
              </View>
              <View style={[styles.summaryItem, styles.sumTotalItem]}>
                <Text style={styles.sumTotalLbl}>Credited to Wallet</Text>
                <Text style={styles.sumTotalVal}>₹{job.netPayout}</Text>
              </View>
            </View>

            <Button
              title="Go to Earnings & Wallet"
              variant="primary"
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  payoutRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  ribbonLabel: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
  },
  ribbonService: {
    ...typography.subtitle1,
    color: colors.textInverse,
    fontWeight: '700',
    marginTop: 2,
  },
  ribbonAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4ADE80',
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
  cardTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  photoBox: {
    height: 130,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  sigHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionalTag: {
    ...typography.caption,
    color: colors.textMuted,
  },
  signatureBox: {
    height: 110,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureBoxSigned: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  signatureContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureSampleText: {
    fontSize: 26,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.primaryDark,
    letterSpacing: 2,
  },
  signedPill: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 6,
    fontSize: 10,
  },
  signaturePlaceholder: {
    alignItems: 'center',
  },
  sigPlaceholderText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  celebrationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.lg,
  },
  confettiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSub: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  highlightPay: {
    color: colors.success,
    fontWeight: '800',
  },
  summaryBreakdown: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  sumLbl: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sumVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sumTotalItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  sumTotalLbl: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  sumTotalVal: {
    ...typography.subtitle1,
    color: colors.success,
    fontWeight: '900',
  },
});

export default JobCompletionScreen;
