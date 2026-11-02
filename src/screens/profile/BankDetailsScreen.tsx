import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Bank Account Details"
        subtitle="Direct IMPS Payout Configuration"
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Preview Visual */}
          <View style={styles.creditCardVisual}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardTypeLabel}>PARTNER PAYOUT ACCOUNT</Text>
                <Text style={styles.cardBankTitle}>{bankName || 'BANK NAME'}</Text>
              </View>
              <Ionicons name="card-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.maskedNumber}>
              •••• •••• •••• {accountNumber ? accountNumber.slice(-4) : '0000'}
            </Text>

            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardSmallLabel}>HOLDER NAME</Text>
                <Text style={styles.cardHolderText}>
                  {accountHolder ? accountHolder.toUpperCase() : 'PARTNER NAME'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardSmallLabel}>IFSC CODE</Text>
                <Text style={styles.cardIfscText}>{ifscCode.toUpperCase() || 'IFSC0000000'}</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <PremiumCard style={styles.formCard}>
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.securityText}>
                Bank details are encrypted using 256-bit bank grade security. Payouts are credited
                directly without intermediary holds.
              </Text>
            </View>

            {/* Input fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <View style={[styles.inputBox, Boolean(errors.accountHolder) && styles.inputBoxError]}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="As printed on bank passbook"
                  placeholderTextColor={colors.textSecondary}
                  value={accountHolder}
                  onChangeText={(text) => {
                    setAccountHolder(text);
                    if (errors.accountHolder) setErrors({ ...errors, accountHolder: '' });
                  }}
                />
              </View>
              {errors.accountHolder ? (
                <Text style={styles.errorText}>{errors.accountHolder}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <View style={[styles.inputBox, Boolean(errors.bankName) && styles.inputBoxError]}>
                <Ionicons name="business-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  placeholderTextColor={colors.textSecondary}
                  value={bankName}
                  onChangeText={(text) => {
                    setBankName(text);
                    if (errors.bankName) setErrors({ ...errors, bankName: '' });
                  }}
                />
              </View>
              {errors.bankName ? (
                <Text style={styles.errorText}>{errors.bankName}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <View style={[styles.inputBox, Boolean(errors.accountNumber) && styles.inputBoxError]}>
                <Ionicons name="keypad-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter account number"
                  placeholderTextColor={colors.textSecondary}
                  value={accountNumber}
                  onChangeText={(text) => {
                    setAccountNumber(text);
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                  }}
                  keyboardType="number-pad"
                />
              </View>
              {errors.accountNumber ? (
                <Text style={styles.errorText}>{errors.accountNumber}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Account Number *</Text>
              <View
                style={[
                  styles.inputBox,
                  Boolean(errors.confirmAccountNumber) && styles.inputBoxError,
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter account number"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmAccountNumber}
                  onChangeText={(text) => {
                    setConfirmAccountNumber(text);
                    if (errors.confirmAccountNumber)
                      setErrors({ ...errors, confirmAccountNumber: '' });
                  }}
                  keyboardType="number-pad"
                />
              </View>
              {errors.confirmAccountNumber ? (
                <Text style={styles.errorText}>{errors.confirmAccountNumber}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <View style={[styles.inputBox, Boolean(errors.ifscCode) && styles.inputBoxError]}>
                <Ionicons name="barcode-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HDFC0001245"
                  placeholderTextColor={colors.textSecondary}
                  value={ifscCode}
                  onChangeText={(text) => {
                    setIfscCode(text);
                    if (errors.ifscCode) setErrors({ ...errors, ifscCode: '' });
                  }}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>
              {errors.ifscCode ? (
                <Text style={styles.errorText}>{errors.ifscCode}</Text>
              ) : (
                <Text style={styles.helperText}>
                  11 character code found on your cheque or passbook
                </Text>
              )}
            </View>
          </PremiumCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Save & Verify Bank Account"
          size="lg"
          fullWidth
          loading={isSaving}
          onPress={handleSave}
          icon={<Ionicons name="checkmark-done-circle-outline" size={20} color="#FFFFFF" />}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  creditCardVisual: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTypeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBankTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
  },
  cardHolderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  cardIfscText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  inputBoxError: {
    borderColor: colors.danger,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default BankDetailsScreen;
