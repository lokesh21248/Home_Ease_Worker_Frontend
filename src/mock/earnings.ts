export interface EarningPeriodData {
  totalGross: number;
  totalEarnings?: number; // Backend field: totalEarnings
  commission: number;
  totalCommissionPaid?: number; // Backend field: totalCommissionPaid
  netPayout: number; // Backend field: netPayout
  incentives: number;
  completedJobs: number;
  completedBookingsCount?: number; // Backend field: completedBookingsCount
  onlineHours: number;
  chartBars: {
    label: string;
    amount: number;
    subLabel?: string;
  }[];
  breakdown: {
    serviceCategory: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  recentOrders: {
    id: string;
    jobId: string;
    serviceName: string;
    customerName: string;
    date: string;
    amount: number;
    status: 'Settled' | 'Processing';
  }[];
}

export const mockEarningsData: {
  daily: EarningPeriodData;
  weekly: EarningPeriodData;
  monthly: EarningPeriodData;
} = {
  daily: {
    totalGross: 0,
    totalEarnings: 0,
    commission: 0,
    totalCommissionPaid: 0,
    netPayout: 0,
    incentives: 0,
    completedJobs: 0,
    completedBookingsCount: 0,
    onlineHours: 0,
    chartBars: [
      { label: '8 AM', amount: 0 },
      { label: '10 AM', amount: 0 },
      { label: '12 PM', amount: 0 },
      { label: '2 PM', amount: 0 },
      { label: '4 PM', amount: 0 },
      { label: '6 PM', amount: 0 },
      { label: '8 PM', amount: 0 },
    ],
    breakdown: [],
    recentOrders: [],
  },
  weekly: {
    totalGross: 0,
    totalEarnings: 0,
    commission: 0,
    totalCommissionPaid: 0,
    netPayout: 0,
    incentives: 0,
    completedJobs: 0,
    completedBookingsCount: 0,
    onlineHours: 0,
    chartBars: [
      { label: 'Mon', amount: 0 },
      { label: 'Tue', amount: 0 },
      { label: 'Wed', amount: 0 },
      { label: 'Thu', amount: 0 },
      { label: 'Fri', amount: 0 },
      { label: 'Sat', amount: 0 },
      { label: 'Sun', amount: 0 },
    ],
    breakdown: [],
    recentOrders: [],
  },
  monthly: {
    totalGross: 0,
    totalEarnings: 0,
    commission: 0,
    totalCommissionPaid: 0,
    netPayout: 0,
    incentives: 0,
    completedJobs: 0,
    completedBookingsCount: 0,
    onlineHours: 0,
    chartBars: [
      { label: 'W1', amount: 0 },
      { label: 'W2', amount: 0 },
      { label: 'W3', amount: 0 },
      { label: 'W4', amount: 0 },
    ],
    breakdown: [],
    recentOrders: [],
  },
};
