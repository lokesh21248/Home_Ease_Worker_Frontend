import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
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
          'Withdrawal Initiated 🎉',
          `₹${amountNum.toLocaleString()} has been sent to your verified ${bankDetails.bankName} account (****${bankDetails.accountNumber.slice(-4)}).`
        );
      } else {
        Alert.alert('Error', res.message);
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Partner Wallet" subtitle="Direct bank deposits & transaction history" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Hero Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{wallet.availableBalance.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.withdrawBtnCircle}
              onPress={() => setIsWithdrawModalOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
              <Text style={styles.withdrawBtnCircleText}>Withdraw</Text>
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
              <Text style={[styles.walletMetaVal, { color: colors.warning }]}>
                ₹{wallet.pendingAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Linked Bank Account Card */}
        <View style={styles.card}>
          <View style={styles.bankHeaderRow}>
            <View style={styles.bankIconWrap}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <View style={styles.bankDetailsCol}>
              <Text style={styles.bankName}>{bankDetails.bankName}</Text>
              <Text style={styles.bankAcc}>
                A/C: •••• •••• {bankDetails.accountNumber.slice(-4)}
              </Text>
            </View>
            <Badge label="Primary Bank" variant="success" size="sm" />
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <Text style={styles.sectionSub}>All job payouts, bonuses, and bank transfers</Text>

          {wallet.transactions.map((tx) => {
            const isCredit = tx.type === 'credit' || tx.type === 'incentive';

            return (
              <View key={tx.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIconWrap,
                    { backgroundColor: isCredit ? colors.successLight : colors.primaryLighter },
                  ]}
                >
                  <Ionicons
                    name={
                      tx.type === 'credit'
                        ? 'arrow-down'
                        : tx.type === 'incentive'
                        ? 'gift'
                        : 'arrow-up'
                    }
                    size={18}
                    color={isCredit ? colors.success : colors.primary}
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
                      { color: isCredit ? colors.success : colors.textPrimary },
                    ]}
                  >
                    {isCredit ? `+ ₹${tx.amount}` : `- ₹${tx.amount}`}
                  </Text>
                  <Badge
                    label={tx.status}
                    variant={tx.status === 'success' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </View>
            );
          })}
        </View>
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
              <TouchableOpacity onPress={() => setIsWithdrawModalOpen(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Account Confirmation Box */}
            <View style={styles.targetBankBox}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <Text style={styles.targetBankText}>
                Transferring to: <Text style={{ fontWeight: '700' }}>{bankDetails.bankName}</Text> (
                ••••{bankDetails.accountNumber.slice(-4)})
              </Text>
            </View>

            {/* Input Amount */}
            <Input
              label="Enter Withdrawal Amount"
              prefix="₹"
              placeholder="e.g. 5000"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="number-pad"
              helperText={`Available: ₹${wallet.availableBalance.toLocaleString()}`}
            />

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
                      ? 'Withdraw All'
                      : `₹${preset.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Confirm Instant Transfer"
              variant="primary"
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  balanceCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  withdrawBtnCircle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  withdrawBtnCircleText: {
    ...typography.subtitle2,
    color: colors.textInverse,
    fontWeight: '800',
  },
  walletMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  walletMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  walletMetaLbl: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 10,
  },
  walletMetaVal: {
    ...typography.subtitle2,
    color: '#F8FAFC',
    fontWeight: '800',
    marginTop: 2,
  },
  walletMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
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
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDetailsCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bankName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  bankAcc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  txTitle: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  txMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...typography.subtitle2,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  withdrawSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  sheetSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  targetBankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.xs + 2,
  },
  targetBankText: {
    ...typography.caption,
    color: '#065F46',
    flex: 1,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
});

export default WalletScreen;
