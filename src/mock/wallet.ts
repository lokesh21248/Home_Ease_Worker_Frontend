import { WalletTransaction } from '../types';

export interface WalletState {
  availableBalance: number;
  withdrawnAmount: number;
  pendingAmount: number;
  currency: string;
  transactions: WalletTransaction[];
}

export const mockWalletData: WalletState = {
  availableBalance: 0,
  withdrawnAmount: 0,
  pendingAmount: 0,
  currency: '₹',
  transactions: [],
};
