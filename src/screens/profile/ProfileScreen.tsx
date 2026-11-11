import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation as useNavigation } from '../../navigation/useAppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { worker, services, documents, logout, fetchWorkerProfile } = useApp();

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  React.useEffect(() => {
    fetchWorkerProfile().catch((err: any) => {
      const status: number | undefined = err?.status ?? err?.response?.status;
      console.warn('[ProfileScreen] fetchWorkerProfile failed:', status, err?.message);
    });
  }, []);

  const activeServiceNames = services
    .filter((s) => worker.selectedServices.includes(s.id))
    .map((s) => s.name);

  const approvedDocsCount = documents.filter((d) => d.status === 'approved').length;

  const handleLogoutConfirm = () => {
    setIsLogoutModalVisible(false);
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const menuItems = [
    {
      id: 'bank',
      title: 'Bank Details & Payouts',
      subtitle: 'Manage linked accounts for instant withdrawals',
      icon: 'business-outline' as const,
      onPress: () => navigation.navigate('BankDetails'),
    },
    {
      id: 'docs',
      title: 'Documents & KYC Verification',
      subtitle: `${approvedDocsCount}/${documents.length} verified • Aadhaar, PAN`,
      icon: 'shield-checkmark-outline' as const,
      onPress: () => navigation.navigate('DocumentUpload', { isOnboarding: false }),
    },
    {
      id: 'services',
      title: 'Service Categories & Skills',
      subtitle: `${worker.selectedServices.length} active service trades`,
      icon: 'construct-outline' as const,
      onPress: () => navigation.navigate('ServiceSelection', { isOnboarding: false }),
    },
    {
      id: 'pincodes',
      title: 'Service Areas & Pincodes',
      subtitle: worker.workingPincodes && worker.workingPincodes.length > 0
        ? `${worker.workingPincodes.length} pincodes active (${worker.workingPincodes.slice(0, 3).join(', ')}${worker.workingPincodes.length > 3 ? '...' : ''})`
        : 'Active service areas configured',
      icon: 'location-outline' as const,
      onPress: () => navigation.navigate('AvailabilitySetup', { isOnboarding: false }),
    },
    {
      id: 'availability',
      title: 'Schedule & Availability',
      subtitle: `${worker.availability.days.length} working days • ${worker.availability.startHour} - ${worker.availability.endHour}`,
      icon: 'calendar-outline' as const,
      onPress: () => navigation.navigate('AvailabilitySetup', { isOnboarding: false }),
    },
    {
      id: 'reviews',
      title: 'Customer Reviews & Ratings',
      subtitle: `${worker.rating} ★ (${worker.totalReviews} verified reviews)`,
      icon: 'star-outline' as const,
      onPress: () => navigation.navigate('ReviewsRatings'),
    },
    {
      id: 'support',
      title: 'Help & Partner Support',
      subtitle: 'FAQs, live chat, partner safety & call center',
      icon: 'headset-outline' as const,
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: 'settings',
      title: 'App Settings & Notifications',
      subtitle: 'Push alerts, language & terms',
      icon: 'settings-outline' as const,
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Partner Profile"
        subtitle="Account & Trade Management"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Worker Profile Card */}
        <PremiumCard style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    worker.photoUri ||
                    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400',
                }}
                style={styles.avatar}
              />
              <View style={styles.verifiedCheckBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name || 'Service Partner'}</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
                  <Text style={styles.verifiedTagText}>VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.workerPhone}>
                {worker.countryCode} {worker.phone}
              </Text>
              <Text style={styles.workerExp}>
                {worker.experienceYears} Years Experience • {worker.gender}
              </Text>
            </View>
          </View>

          {/* Bio Box */}
          {worker.bio ? (
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{worker.bio}</Text>
            </View>
          ) : null}

          {/* Quick Metrics Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{worker.completedJobsCount}</Text>
              <Text style={styles.statLbl}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValRating}>
                {worker.rating} ★
              </Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{worker.languages.length}</Text>
              <Text style={styles.statLbl}>Languages</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Selected Services Tags */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Active Service Trades</Text>
          <View style={styles.serviceChipsRow}>
            {activeServiceNames.map((s, idx) => (
              <View key={idx} style={styles.serviceChip}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                <Text style={styles.serviceChipText}>{s}</Text>
              </View>
            ))}
          </View>
        </PremiumCard>

        {/* Menu Navigation List */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Account Menu</Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>

              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </PremiumCard>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setIsLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out from Partner Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>HomeEase Partner v2.4.0 (Build 540)</Text>
      </ScrollView>

      {/* Logout Confirmation Dialog Modal */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.logoutDialogCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={30} color={colors.danger} />
            </View>

            <Text style={styles.dialogTitle}>Log Out Confirmation</Text>
            <Text style={styles.dialogBody}>
              Are you sure you want to log out? You will stop receiving job alerts while signed out.
            </Text>

            <View style={styles.dialogButtonsRow}>
              <SecondaryButton
                title="Cancel"
                size="md"
                onPress={() => setIsLogoutModalVisible(false)}
                style={styles.dialogBtn}
              />
              <PrimaryButton
                title="Yes, Log Out"
                size="md"
                onPress={handleLogoutConfirm}
                style={[styles.dialogBtn, { backgroundColor: colors.danger }]}
              />
            </View>
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
  card: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  workerName: {
    fontSize: 17,
    fontWeight: '800',
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
  verifiedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  workerPhone: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  workerExp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bioBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statValRating: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  statLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  serviceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  logoutText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoutDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.md,
  },
  logoutIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  dialogBtn: {
    flex: 1,
  },
});

export default ProfileScreen;
