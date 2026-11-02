import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { DocumentItem, VerificationStatus } from '../../types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import Input from '../../components/Input';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentUpload'>;

export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { documents, uploadDocument, worker, updateWorkerProfile } = useApp();

  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [panNumber, setPanNumber] = useState<string>(worker.panNumber || '');
  const [panError, setPanError] = useState<string>('');

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Verified', color: colors.primary, bg: colors.primaryLight };
      case 'pending':
        return { label: 'In Review', color: colors.textSecondary, bg: colors.background };
      case 'rejected':
        return { label: 'Re-upload Needed', color: colors.danger, bg: '#FEE2E2' };
      default:
        return { label: 'Pending Upload', color: colors.textSecondary, bg: colors.background };
    }
  };

  const handleSimulateUpload = async (doc: DocumentItem) => {
    setUploadingDocId(doc.id);
    setUploadProgress(20);

    const workerId = worker.id || '';
    let uploadedUrl = '';

    try {
      setUploadProgress(50);
      if (doc.type === 'pan') {
        const res = await workerApiService.uploadPanDocument(workerId, 'file://mock/pan.png');
        uploadedUrl = res.url;
        updateWorkerProfile({ panDocUrl: uploadedUrl });
      } else if (doc.type === 'aadhaar') {
        const res = await workerApiService.uploadAadhaarDocument(workerId, 'file://mock/aadhaar.png');
        uploadedUrl = res.url;
        updateWorkerProfile({ aadhaarDocUrl: uploadedUrl });
      } else {
        const res = await workerApiService.uploadWorkerProfilePhoto(workerId, 'file://mock/avatar.png');
        uploadedUrl = res.url;
      }
      setUploadProgress(90);
    } catch (err: any) {
      console.warn('[DocumentUpload] Upload notice:', err?.message);
      const shortId = workerId.slice(0, 8);
      uploadedUrl =
        doc.type === 'pan'
          ? `https://storage.homeease.in/worker-kyc/pan-docs/${shortId}_pan.png`
          : `https://storage.homeease.in/worker-kyc/aadhaar-docs/${shortId}_aadhaar.png`;
    }

    setTimeout(() => {
      uploadDocument(doc.id, `${doc.type}_scanned_document.pdf`, uploadedUrl);
      setUploadProgress(100);
      setUploadingDocId(null);
    }, 400);
  };

  const handleContinue = () => {
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || cleanPan.length !== 10) {
      setPanError('Please enter a valid 10-character PAN number (e.g. ABCDE1234F).');
      return;
    }

    updateWorkerProfile({
      panNumber: cleanPan,
    });

    if (isOnboarding) {
      navigation.navigate('ServiceSelection', { isOnboarding: true });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Document Verification"
        subtitle={isOnboarding ? 'Step 3 of 5 • KYC & Licenses' : 'Manage KYC & Credentials'}
        showBack
        onBack={() => navigation.goBack()}
      />

      {isOnboarding ? (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Header Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoBannerTitle}>Government KYC Verification</Text>
            <Text style={styles.infoBannerSub}>
              Approved documents earn you the Verified Pro badge and enable IMPS bank withdrawals.
            </Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verification Documents</Text>
          <View style={styles.counterPill}>
            <Text style={styles.counterPillText}>
              {documents.filter((d) => d.status === 'approved').length}/{documents.length} Verified
            </Text>
          </View>
        </View>

        {documents.map((doc) => {
          const badge = getStatusBadge(doc.status);
          const isCurrentUploading = uploadingDocId === doc.id;

          return (
            <PremiumCard key={doc.id} style={styles.docCard}>
              <View style={styles.docHeader}>
                <View style={styles.docTitleGroup}>
                  <Text style={styles.docTitle}>
                    {doc.title}
                    {doc.required ? <Text style={styles.requiredStar}> *</Text> : null}
                  </Text>
                  <Text style={styles.docDesc}>{doc.description}</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              {/* Uploaded file preview strip */}
              {doc.fileName ? (
                <View style={styles.filePreviewRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                  {doc.uploadedAt ? (
                    <Text style={styles.uploadedDate}>• {doc.uploadedAt}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* PAN Number Input Field */}
              {doc.type === 'pan' ? (
                <View style={styles.panInputBox}>
                  <Input
                    label="10-Digit PAN Card Number"
                    required
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChangeText={(text) => {
                      setPanNumber(text.toUpperCase());
                      if (panError) setPanError('');
                    }}
                    autoCapitalize="characters"
                    maxLength={10}
                    leftIcon={<Ionicons name="card-outline" size={18} color={colors.primary} />}
                    error={panError}
                    helperText="Permanent Account Number as per Income Tax records"
                  />
                </View>
              ) : null}

              {/* Upload progress bar */}
              {isCurrentUploading ? (
                <View style={styles.uploadProgressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.uploadingLabel}>Uploading & Encrypting...</Text>
                    <Text style={styles.uploadPercent}>{uploadProgress}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarActive, { width: `${uploadProgress}%` }]} />
                  </View>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.docActionRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isCurrentUploading}
                  onPress={() => handleSimulateUpload(doc)}
                  style={[styles.uploadButton, isCurrentUploading && { opacity: 0.5 }]}
                >
                  <Ionicons
                    name={doc.status === 'approved' ? 'refresh-outline' : 'cloud-upload-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.uploadButtonText}>
                    {doc.status === 'approved' ? 'Replace File' : 'Upload Document'}
                  </Text>
                </TouchableOpacity>

                {doc.status === 'approved' ? (
                  <View style={styles.verifiedCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.verifiedText}>Compliance Cleared</Text>
                  </View>
                ) : null}
              </View>
            </PremiumCard>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={isOnboarding ? 'Continue to Service Selection' : 'Done'}
          size="lg"
          fullWidth
          onPress={handleContinue}
          iconRight={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  infoIconWrapper: {
    marginRight: spacing.sm,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  infoBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  counterPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  counterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  docCard: {
    marginBottom: spacing.md,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docTitleGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requiredStar: {
    color: colors.danger,
  },
  docDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  filePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: 6,
  },
  fileNameText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  uploadedDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  panInputBox: {
    marginTop: spacing.sm,
  },
  uploadProgressContainer: {
    marginTop: spacing.sm,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  uploadingLabel: {
    fontSize: 11,
    color: colors.primary,
  },
  uploadPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  docActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default DocumentUploadScreen;
