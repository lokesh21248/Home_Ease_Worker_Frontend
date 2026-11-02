import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { useApp } from '../../state/AppContext';

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'हिन्दी (Hindi)' },
  { id: 'te', name: 'తెలుగు (Telugu)' },
  { id: 'ta', name: 'தமிழ் (Tamil)' },
  { id: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
];

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Settings & Preferences"
        subtitle="Customise partner application behavior"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Notification Alerts</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Job Dispatches & Requests</Text>
              <Text style={styles.settingSub}>Instant pop-up alert for nearby customer bookings</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(val) => updateSettings({ pushNotifications: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Loud Alert for New Jobs</Text>
              <Text style={styles.settingSub}>Plays notification ring even when phone is locked</Text>
            </View>
            <Switch
              value={settings.soundAlerts}
              onValueChange={(val) => updateSettings({ soundAlerts: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>SMS Payout Confirmations</Text>
              <Text style={styles.settingSub}>Receive SMS when wallet funds are transferred</Text>
            </View>
            <Switch
              value={settings.smsUpdates}
              onValueChange={(val) => updateSettings({ smsUpdates: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </PremiumCard>

        {/* Display & Appearance */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance & Theme</Text>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Dark Theme</Text>
              <Text style={styles.settingSub}>Reduces screen brightness during evening shifts</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSettings({ darkMode: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </PremiumCard>

        {/* Language Selection */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>App Language</Text>
          <Text style={styles.cardSub}>Choose your preferred language for prompts and labels:</Text>

          {LANGUAGES.map((lang) => {
            const isSelected =
              settings.language === lang.name ||
              settings.language.startsWith(lang.name.split(' ')[0]);

            return (
              <TouchableOpacity
                key={lang.id}
                style={styles.langRow}
                activeOpacity={0.7}
                onPress={() => updateSettings({ language: lang.name })}
              >
                <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                  {lang.name}
                </Text>
                <View
                  style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}
                >
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </PremiumCard>

        {/* Legal & Policy Links */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Legal & Compliance</Text>

          <TouchableOpacity
            style={styles.legalItem}
            activeOpacity={0.7}
            onPress={() => setIsPrivacyModalOpen(true)}
          >
            <View style={styles.legalLeft}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              <Text style={styles.legalLabel}>Privacy Policy & Data Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => setIsTermsModalOpen(true)}
          >
            <View style={styles.legalLeft}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={styles.legalLabel}>Partner Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </PremiumCard>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={isPrivacyModalOpen} animationType="slide">
        <SafeAreaView style={styles.modalView} edges={['top']}>
          <CustomHeader
            title="Privacy Policy"
            showBack
            onBack={() => setIsPrivacyModalOpen(false)}
          />
          <ScrollView style={styles.modalBody}>
            <Text style={styles.legalDocTitle}>HomeEase Partner Data Protection</Text>
            <Text style={styles.legalParagraph}>
              HomeEase operates with strict bank-grade standards for partner KYC and payout
              information.
            </Text>
            <Text style={styles.legalSubhead}>1. GPS & Location Services</Text>
            <Text style={styles.legalParagraph}>
              Location data is gathered only while your duty switch is set to ONLINE. It is used
              strictly for matching customer bookings within your operational radius and providing
              turn-by-turn routing.
            </Text>
            <Text style={styles.legalSubhead}>2. Payment & KYC Data</Text>
            <Text style={styles.legalParagraph}>
              Bank account numbers and Aadhaar documents are stored under encrypted tokens and used
              only for statutory partner verification and IMPS payouts.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={isTermsModalOpen} animationType="slide">
        <SafeAreaView style={styles.modalView} edges={['top']}>
          <CustomHeader
            title="Terms of Service"
            showBack
            onBack={() => setIsTermsModalOpen(false)}
          />
          <ScrollView style={styles.modalBody}>
            <Text style={styles.legalDocTitle}>HomeEase Partner Code of Conduct</Text>
            <Text style={styles.legalParagraph}>
              By registering as a service partner on HomeEase Worker, you agree to uphold our
              professional service standards, punctuality, and verified hygiene protocols.
            </Text>
            <Text style={styles.legalSubhead}>1. Service Excellence</Text>
            <Text style={styles.legalParagraph}>
              All booked jobs must be fulfilled with certified tooling and genuine replacement
              parts. Doorstep security PINs must be validated before starting any service.
            </Text>
          </ScrollView>
        </SafeAreaView>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  langNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  modalView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalBody: {
    padding: spacing.lg,
  },
  legalDocTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  legalSubhead: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  legalParagraph: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});

export default SettingsScreen;
