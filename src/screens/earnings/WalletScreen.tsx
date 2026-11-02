import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import { SecondaryButton } from '../../components/SecondaryButton';
import { useApp } from '../../state/AppContext';

export const WalletScreen: React.FC = () => {
  const { wallet, bankDetails, withdrawFromWallet } = useApp();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdrawSubmit = () => {
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (amountNum > wallet.availableBalance) {
      Alert.alert('Insufficient Balance', 'Withdrawal amount exceeds available wallet balance.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const res = withdrawFromWallet(amountNum);
      setIsWithdrawModalOpen(false);

      if (res.success) {
        Alert.alert(
          'Withdrawal Initiated',
          `₹${amountNum.toLocaleString()} has been sent to your verified ${bankDetails.bankName} account (••••${bankDetails.accountNumber.slice(-4)}).`
        );
      } else {
        Alert.alert('Error', res.message);
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <CustomHeader
        title="Partner Wallet"
        subtitle="Direct bank deposits & transaction history"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Hero Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceAmount}>
                ₹{wallet.availableBalance.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => setIsWithdrawModalOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={16} color={colors.primary} />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary stats row */}
          <View style={styles.walletMetaRow}>
            <View style={styles.walletMetaCol}>
              <Text style={styles.walletMetaLbl}>Total Withdrawn</Text>
              <Text style={styles.walletMetaVal}>
                ₹{wallet.withdrawnAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.walletMetaDivider} />
            <View style={styles.walletMetaCol}>
              <Text style={styles.walletMetaLbl}>Pending Clearance</Text>
              <Text style={styles.walletMetaVal}>
                ₹{wallet.pendingAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Linked Bank Account Card */}
        <PremiumCard style={styles.card}>
          <View style={styles.bankHeaderRow}>
            <View style={styles.bankIconWrap}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.bankDetailsCol}>
              <Text style={styles.bankName}>{bankDetails.bankName}</Text>
              <Text style={styles.bankAcc}>
                A/C: •••• •••• {bankDetails.accountNumber.slice(-4)}
              </Text>
            </View>
            <View style={styles.primaryBankBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
              <Text style={styles.primaryBankText}>Verified Primary</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Transaction History */}
        <PremiumCard style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <Text style={styles.sectionSub}>All job payouts, bonuses, and bank transfers</Text>

          {wallet.transactions.length > 0 ? (
            wallet.transactions.map((tx) => {
              const isCredit = tx.type === 'credit' || tx.type === 'incentive';

              return (
                <View key={tx.id} style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconWrap,
                      { backgroundColor: isCredit ? colors.primaryLight : colors.background },
                    ]}
                  >
                    <Ionicons
                      name={
                        tx.type === 'credit'
                          ? 'arrow-down-outline'
                          : tx.type === 'incentive'
                          ? 'gift-outline'
                          : 'arrow-up-outline'
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.txCenterCol}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.date}, {tx.time} • {tx.transactionId}
                    </Text>
                  </View>

                  <View style={styles.txRightCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isCredit ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      {isCredit ? `+ ₹${tx.amount}` : `- ₹${tx.amount}`}
                    </Text>
                    <View style={styles.txStatusPill}>
                      <Text style={styles.txStatusText}>{tx.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySub}>
                Completed job payouts and withdrawals will appear here.
              </Text>
            </View>
          )}
        </PremiumCard>
      </ScrollView>

      {/* Instant Withdrawal Modal */}
      <Modal visible={isWithdrawModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.withdrawSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Withdraw to Bank</Text>
                <Text style={styles.sheetSub}>Instant IMPS transfer without extra charges</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsWithdrawModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Account Confirmation Box */}
            <View style={styles.targetBankBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.targetBankText}>
                Transferring to: <Text style={{ fontWeight: '700' }}>{bankDetails.bankName}</Text> (
                ••••{bankDetails.accountNumber.slice(-4)})
              </Text>
            </View>

            {/* Input Amount */}
            <Text style={styles.inputLabel}>Enter Withdrawal Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.amountPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="number-pad"
                placeholder="5000"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <Text style={styles.helperText}>
              Available balance: ₹{wallet.availableBalance.toLocaleString()}
            </Text>

            {/* Quick Amount Chips */}
            <View style={styles.quickChipsRow}>
              {[1000, 2500, 5000, wallet.availableBalance].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.quickChip}
                  onPress={() => setWithdrawAmount(String(preset))}
                >
                  <Text style={styles.quickChipText}>
                    {preset === wallet.availableBalance
                      ? 'All'
                      : `₹${preset.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title="Confirm Instant Transfer"
              size="lg"
              fullWidth
              loading={isProcessing}
              onPress={handleWithdrawSubmit}
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
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  withdrawBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  walletMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  walletMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  walletMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  walletMetaLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  walletMetaVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDetailsCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bankAcc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryBankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  primaryBankText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txCenterCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  txMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txStatusPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
  },
  txStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyTransactions: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  withdrawSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadows.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  targetBankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: 8,
    marginBottom: spacing.md,
  },
  targetBankText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  amountPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 48,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default WalletScreen;
