import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
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
    <SafeAreaView style={styles.container}>
      <Header title="Settings & Preferences" subtitle="Customise application behavior" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notification Alerts</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Job Dispatches & Requests</Text>
              <Text style={styles.settingSub}>Instant pop-up alert for nearby customer leads</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(val) => updateSettings({ pushNotifications: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Loud Siren Ring for New Jobs</Text>
              <Text style={styles.settingSub}>Plays high volume sound even in pocket</Text>
            </View>
            <Switch
              value={settings.soundAlerts}
              onValueChange={(val) => updateSettings({ soundAlerts: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>SMS Payout Confirmations</Text>
              <Text style={styles.settingSub}>Receive text message when wallet funds are transferred</Text>
            </View>
            <Switch
              value={settings.smsUpdates}
              onValueChange={(val) => updateSettings({ smsUpdates: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Display & Appearance */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance & Theme</Text>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Dark Mode (OLED Saver)</Text>
              <Text style={styles.settingSub}>Reduces battery drain during long shifts</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSettings({ darkMode: val })}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App Language</Text>
          <Text style={styles.cardSub}>Choose your preferred language for prompts and labels:</Text>

          {LANGUAGES.map((lang) => {
            const isSelected = settings.language === lang.name || settings.language.startsWith(lang.name.split(' ')[0]);

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
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legal & Policy Links */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Legal & Compliance</Text>

          <TouchableOpacity
            style={styles.legalItem}
            activeOpacity={0.7}
            onPress={() => setIsPrivacyModalOpen(true)}
          >
            <View style={styles.legalLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              <Text style={styles.legalLabel}>Privacy Policy & Data Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => setIsTermsModalOpen(true)}
          >
            <View style={styles.legalLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.legalLabel}>Partner Terms of Agreement</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={isPrivacyModalOpen} animationType="slide">
        <SafeAreaView style={styles.modalView}>
          <Header
            title="Privacy Policy"
            showBack
            onBack={() => setIsPrivacyModalOpen(false)}
          />
          <ScrollView style={styles.modalBody}>
            <Text style={styles.legalDocTitle}>HomeEase Worker Data & Privacy Protection</Text>
            <Text style={styles.legalParagraph}>
              Last updated: September 2026. HomeEase operates with highest industry security
              standards for partner KYC and banking data.
            </Text>
            <Text style={styles.legalSubhead}>1. GPS & Location Services</Text>
            <Text style={styles.legalParagraph}>
              Location data is gathered only while your duty toggle is set to ONLINE. It is used
              strictly for matching customers within your operational radius and calculating accurate
              travel ETA.
            </Text>
            <Text style={styles.legalSubhead}>2. Payment & KYC Data</Text>
            <Text style={styles.legalParagraph}>
              Bank account numbers and Aadhaar documents are stored under encrypted tokens and used
              only for statutory compliance and direct IMPS transfers.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={isTermsModalOpen} animationType="slide">
        <SafeAreaView style={styles.modalView}>
          <Header
            title="Partner Terms of Service"
            showBack
            onBack={() => setIsTermsModalOpen(false)}
          />
          <ScrollView style={styles.modalBody}>
            <Text style={styles.legalDocTitle}>HomeEase Partner Code of Conduct</Text>
            <Text style={styles.legalParagraph}>
              By registering as a service pro on HomeEase Worker, you agree to uphold our professional
              service standards, punctuality, and verified hygiene protocols.
            </Text>
            <Text style={styles.legalSubhead}>1. Service Integrity</Text>
            <Text style={styles.legalParagraph}>
              Partners must not solicit direct off-platform payments from customers acquired via the
              platform.
            </Text>
            <Text style={styles.legalSubhead}>2. Safety & Identity Verification</Text>
            <Text style={styles.legalParagraph}>
              Only verified registered professionals are permitted on customer premises during
              service fulfillment.
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
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  settingSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  langName: {
    ...typography.body1,
    color: colors.textPrimary,
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
    borderColor: colors.borderDark,
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  legalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLabel: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalBody: {
    padding: spacing.xl,
  },
  legalDocTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  legalSubhead: {
    ...typography.subtitle1,
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  legalParagraph: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default SettingsScreen;
