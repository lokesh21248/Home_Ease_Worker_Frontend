import { WalletTransaction } from '../types';

export interface WalletState {
  availableBalance: number;
  withdrawnAmount: number;
  pendingAmount: number;
  currency: string;
  transactions: WalletTransaction[];
}

export const mockWalletData: WalletState = {
  availableBalance: 14850,
  withdrawnAmount: 32000,
  pendingAmount: 1500,
  currency: '₹',
  transactions: [
    {
      id: 'tx-001',
      transactionId: 'TXN-9021849',
      title: 'Job Payout: Full Deep Cleaning (#HE-8492)',
      type: 'credit',
      amount: 849,
      date: 'Today',
      time: '12:45 PM',
      status: 'success',
      paymentMethod: 'Direct Wallet Credit',
    },
    {
      id: 'tx-002',
      transactionId: 'TXN-9021812',
      title: 'Job Payout: Kitchen Sanitization (#HE-8479)',
      type: 'credit',
      amount: 1020,
      date: 'Today',
      time: '03:10 PM',
      status: 'success',
      paymentMethod: 'Direct Wallet Credit',
    },
    {
      id: 'tx-003',
      transactionId: 'TXN-9019941',
      title: 'Weekly Payout to HDFC Bank (****1729)',
      type: 'payout',
      amount: 7500,
      date: '25 Sep 2026',
      time: '09:30 AM',
      status: 'success',
      paymentMethod: 'IMPS Bank Transfer',
    },
    {
      id: 'tx-004',
      transactionId: 'TXN-9018402',
      title: 'Weekend High Rating Incentive Bonus',
      type: 'incentive',
      amount: 500,
      date: '23 Sep 2026',
      time: '08:00 PM',
      status: 'success',
      paymentMethod: 'Platform Reward',
    },
    {
      id: 'tx-005',
      transactionId: 'TXN-9017619',
      title: 'Job Payout: AC Power Jet (#HE-8440)',
      type: 'credit',
      amount: 1279,
      date: '22 Sep 2026',
      time: '04:15 PM',
      status: 'pending',
      paymentMethod: 'Customer Online UPI',
    },
    {
      id: 'tx-006',
      transactionId: 'TXN-9015822',
      title: 'Bank Transfer Withdrawal to HDFC',
      type: 'payout',
      amount: 12000,
      date: '18 Sep 2026',
      time: '11:15 AM',
      status: 'success',
      paymentMethod: 'NEFT Transfer',
    },
  ],
};
