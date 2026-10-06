import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { useApp } from '../../state/AppContext';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { worker, services, documents, logout, fetchWorkerProfile } = useApp();

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Fetch live worker profile from backend GET /workers/profile
  React.useEffect(() => {
    fetchWorkerProfile().catch(() => {});
  }, []);

  // Match worker's selected services
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
      subtitle: 'Manage linked bank accounts for direct withdrawals',
      icon: 'business-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('BankDetails'),
    },
    {
      id: 'docs',
      title: 'Documents & Verification',
      subtitle: `${approvedDocsCount}/${documents.length} verified • Aadhaar, PAN, Licenses`,
      icon: 'shield-checkmark-outline',
      color: colors.success,
      onPress: () => navigation.navigate('DocumentUpload', { isOnboarding: false }),
    },
    {
      id: 'services',
      title: 'Service Categories & Skills',
      subtitle: `${worker.selectedServices.length} active service trades`,
      icon: 'construct-outline',
      color: colors.info,
      onPress: () => navigation.navigate('ServiceSelection', { isOnboarding: false }),
    },
    {
      id: 'availability',
      title: 'Schedule & Availability',
      subtitle: `${worker.availability.days.length} working days • ${worker.availability.startHour} - ${worker.availability.endHour}`,
      icon: 'calendar-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('AvailabilitySetup', { isOnboarding: false }),
    },
    {
      id: 'reviews',
      title: 'Customer Reviews & Ratings',
      subtitle: `${worker.rating} ★ (${worker.totalReviews} verified reviews)`,
      icon: 'star-outline',
      color: colors.accent,
      onPress: () => navigation.navigate('ReviewsRatings'),
    },
    {
      id: 'support',
      title: 'Help & Partner Support',
      subtitle: 'FAQs, live chat, partner safety & call center',
      icon: 'headset-outline',
      color: colors.secondary,
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: 'settings',
      title: 'App Settings & Language',
      subtitle: 'Dark mode, push alerts, app language & terms',
      icon: 'settings-outline',
      color: colors.textSecondary,
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Partner Profile" subtitle="Account & Trade Management" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: worker.photoUri }} style={styles.avatar} />
              <View style={styles.verifiedCheckBadge}>
                <Ionicons name="checkmark" size={14} color={colors.textInverse} />
              </View>
            </View>

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Badge label="Verified Pro" variant="success" size="sm" />
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
          <View style={styles.bioBox}>
            <Text style={styles.bioText}>{worker.bio}</Text>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{worker.completedJobsCount}</Text>
              <Text style={styles.statLbl}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.accent }]}>
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
        </View>

        {/* Selected Services Tags */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Active Service Trades</Text>
          <View style={styles.serviceChipsRow}>
            {activeServiceNames.map((s, idx) => (
              <View key={idx} style={styles.serviceChip}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.serviceChipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Navigation List */}
        <View style={styles.card}>
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
              <View style={[styles.menuIconCircle, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>

              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setIsLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out from Partner Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>HomeEase Worker v1.0.0 (Build 540)</Text>
      </ScrollView>

      {/* Logout Confirmation Dialog Modal (Screen 23) */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.logoutDialogCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out" size={32} color={colors.danger} />
            </View>

            <Text style={styles.dialogTitle}>Log Out Confirmation</Text>
            <Text style={styles.dialogBody}>
              Are you sure you want to log out of HomeEase Worker? You will stop receiving job alerts
              while signed out.
            </Text>

            <View style={styles.dialogButtonsRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIsLogoutModalVisible(false)}
                style={styles.dialogCancelBtn}
              />
              <Button
                title="Yes, Log Out"
                variant="danger"
                size="md"
                onPress={handleLogoutConfirm}
                style={styles.dialogConfirmBtn}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    borderColor: colors.surface,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  workerPhone: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  workerExp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bioBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  bioText: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLighter,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  statLbl: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.primarySoft,
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
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
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
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  menuTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  logoutText: {
    ...typography.subtitle2,
    color: colors.danger,
    fontWeight: '700',
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoutDialogCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.lg,
  },
  logoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dialogBody: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
  },
  dialogConfirmBtn: {
    flex: 1,
  },
});

export default ProfileScreen;
