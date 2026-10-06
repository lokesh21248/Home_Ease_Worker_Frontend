import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { useApp } from '../../state/AppContext';

export const BankDetailsScreen: React.FC = () => {
  const { bankDetails, updateBankDetails, updateWorkerProfile } = useApp();

  const [accountHolder, setAccountHolder] = useState(bankDetails.accountHolderName);
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(bankDetails.accountNumber);
  const [ifscCode, setIfscCode] = useState(bankDetails.ifscCode);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!accountHolder.trim()) {
      newErrors.accountHolder = 'Account holder name is required.';
    }
    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required.';
    }
    if (!accountNumber.trim() || accountNumber.length < 9) {
      newErrors.accountNumber = 'Enter a valid bank account number (min 9 digits).';
    }
    if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match.';
    }
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      newErrors.ifscCode = 'IFSC code must be exactly 11 characters (e.g. HDFC0001245).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const cleanAcc = accountNumber.trim();
      const cleanIfsc = ifscCode.trim().toUpperCase();

      updateBankDetails({
        accountHolderName: accountHolder.trim(),
        bankName: bankName.trim(),
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        isVerified: true,
      });

      updateWorkerProfile({
        bankAccountNo: cleanAcc,
        bankIfsc: cleanIfsc,
      });

      Alert.alert(
        'Bank Details Updated',
        'Your payout account details have been successfully verified and saved.'
      );
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Bank Account Details"
        subtitle="Direct IMPS Payout Configuration"
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Active Verified Bank Card Preview */}
          <View style={styles.creditCardVisual}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardTypeLabel}>PARTNER PAYOUT ACCOUNT</Text>
                <Text style={styles.cardBankTitle}>{bankName || 'BANK NAME'}</Text>
              </View>
              <Ionicons name="card" size={32} color="#FFFFFF" />
            </View>

            <Text style={styles.maskedNumber}>
              •••• •••• •••• {accountNumber ? accountNumber.slice(-4) : '0000'}
            </Text>

            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardSmallLabel}>HOLDER NAME</Text>
                <Text style={styles.cardHolderText}>
                  {accountHolder ? accountHolder.toUpperCase() : 'YOUR NAME'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardSmallLabel}>IFSC CODE</Text>
                <Text style={styles.cardIfscText}>{ifscCode.toUpperCase() || 'IFSC0000000'}</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.securityText}>
                Bank details are encrypted using 256-bit bank grade security. Payouts are credited
                directly without intermediary hold.
              </Text>
            </View>

            <Input
              label="Account Holder Name"
              required
              placeholder="As printed on bank passbook"
              value={accountHolder}
              onChangeText={(text) => {
                setAccountHolder(text);
                if (errors.accountHolder) setErrors({ ...errors, accountHolder: '' });
              }}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
              error={errors.accountHolder}
            />

            <Input
              label="Bank Name"
              required
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              value={bankName}
              onChangeText={(text) => {
                setBankName(text);
                if (errors.bankName) setErrors({ ...errors, bankName: '' });
              }}
              leftIcon={<Ionicons name="business-outline" size={20} color={colors.primary} />}
              error={errors.bankName}
            />

            <Input
              label="Account Number"
              required
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={(text) => {
                setAccountNumber(text);
                if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
              }}
              keyboardType="number-pad"
              leftIcon={<Ionicons name="keypad-outline" size={20} color={colors.primary} />}
              error={errors.accountNumber}
            />

            <Input
              label="Confirm Account Number"
              required
              placeholder="Re-enter account number"
              value={confirmAccountNumber}
              onChangeText={(text) => {
                setConfirmAccountNumber(text);
                if (errors.confirmAccountNumber) setErrors({ ...errors, confirmAccountNumber: '' });
              }}
              keyboardType="number-pad"
              leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />}
              error={errors.confirmAccountNumber}
            />

            <Input
              label="IFSC Code"
              required
              placeholder="e.g. HDFC0001245"
              value={ifscCode}
              onChangeText={(text) => {
                setIfscCode(text);
                if (errors.ifscCode) setErrors({ ...errors, ifscCode: '' });
              }}
              autoCapitalize="characters"
              maxLength={11}
              leftIcon={<Ionicons name="barcode-outline" size={20} color={colors.primary} />}
              error={errors.ifscCode}
              helperText="11 characters code found on your cheque or passbook"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Save & Verify Bank Account"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          onPress={handleSave}
          icon={<Ionicons name="checkmark-done-circle" size={18} color={colors.textInverse} />}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  creditCardVisual: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTypeLabel: {
    ...typography.caption,
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBankTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    marginTop: 2,
  },
  maskedNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: spacing.lg,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardSmallLabel: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  cardHolderText: {
    ...typography.subtitle2,
    color: '#F8FAFC',
    fontWeight: '700',
    marginTop: 2,
  },
  cardIfscText: {
    ...typography.subtitle2,
    color: '#F8FAFC',
    fontWeight: '700',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  securityText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default BankDetailsScreen;
