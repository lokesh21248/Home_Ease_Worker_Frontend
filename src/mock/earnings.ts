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
    totalGross: 2950,
    commission: 450,
    netPayout: 2500,
    incentives: 300,
    completedJobs: 5,
    onlineHours: 7.5,
    chartBars: [
      { label: '8 AM', amount: 0 },
      { label: '10 AM', amount: 999, subLabel: 'Cleaning' },
      { label: '12 PM', amount: 650, subLabel: 'Electrical' },
      { label: '2 PM', amount: 0 },
      { label: '4 PM', amount: 850, subLabel: 'Plumbing' },
      { label: '6 PM', amount: 450, subLabel: 'Fitting' },
      { label: '8 PM', amount: 0 },
    ],
    breakdown: [
      { serviceCategory: 'Home Cleaning', amount: 1400, percentage: 56, color: '#2563EB' },
      { serviceCategory: 'Plumbing', amount: 850, percentage: 34, color: '#0D9488' },
      { serviceCategory: 'Electrical', amount: 250, percentage: 10, color: '#F59E0B' },
    ],
    recentOrders: [
      {
        id: 'ord-01',
        jobId: '#HE-8492',
        serviceName: 'Full Home Deep Cleaning',
        customerName: 'Lokesh Reddy',
        date: 'Today, 11:30 AM',
        amount: 849,
        status: 'Settled',
      },
      {
        id: 'ord-02',
        jobId: '#HE-8479',
        serviceName: 'Kitchen Deep Sanitization',
        customerName: 'Ananya Deshmukh',
        date: 'Today, 02:45 PM',
        amount: 1020,
        status: 'Settled',
      },
      {
        id: 'ord-03',
        jobId: '#HE-8472',
        serviceName: 'Bathroom Tap Fitting',
        customerName: 'Suresh Menon',
        date: 'Today, 05:10 PM',
        amount: 631,
        status: 'Settled',
      },
    ],
  },
  weekly: {
    totalGross: 18200,
    commission: 2700,
    netPayout: 15500,
    incentives: 1800,
    completedJobs: 24,
    onlineHours: 44,
    chartBars: [
      { label: 'Mon', amount: 2100 },
      { label: 'Tue', amount: 2600 },
      { label: 'Wed', amount: 1800 },
      { label: 'Thu', amount: 2900 },
      { label: 'Fri', amount: 3200 },
      { label: 'Sat', amount: 3800 },
      { label: 'Sun', amount: 1800 },
    ],
    breakdown: [
      { serviceCategory: 'Home Cleaning', amount: 8200, percentage: 53, color: '#2563EB' },
      { serviceCategory: 'Plumbing', amount: 4100, percentage: 26, color: '#0D9488' },
      { serviceCategory: 'AC Servicing', amount: 2300, percentage: 15, color: '#6366F1' },
      { serviceCategory: 'Electrical', amount: 900, percentage: 6, color: '#F59E0B' },
    ],
    recentOrders: [
      {
        id: 'ord-w1',
        jobId: '#HE-8430',
        serviceName: 'Sofa Shampoo & Sanitization',
        customerName: 'Vikram Malhotra',
        date: '26 Sep, 04:00 PM',
        amount: 1250,
        status: 'Settled',
      },
      {
        id: 'ord-w2',
        jobId: '#HE-8422',
        serviceName: 'AC Filter Power Clean',
        customerName: 'Kavita Roy',
        date: '25 Sep, 11:00 AM',
        amount: 890,
        status: 'Settled',
      },
      {
        id: 'ord-w3',
        jobId: '#HE-8418',
        serviceName: 'Main Board MCB Rewiring',
        customerName: 'Naveen Rao',
        date: '24 Sep, 06:15 PM',
        amount: 680,
        status: 'Settled',
      },
    ],
  },
  monthly: {
    totalGross: 52900,
    commission: 7900,
    netPayout: 45000,
    incentives: 5500,
    completedJobs: 98,
    onlineHours: 186,
    chartBars: [
      { label: 'Week 1', amount: 10400 },
      { label: 'Week 2', amount: 11800 },
      { label: 'Week 3', amount: 13200 },
      { label: 'Week 4', amount: 9600 },
    ],
    breakdown: [
      { serviceCategory: 'Home Cleaning', amount: 24500, percentage: 54, color: '#2563EB' },
      { serviceCategory: 'Plumbing', amount: 10800, percentage: 24, color: '#0D9488' },
      { serviceCategory: 'AC Servicing', amount: 6200, percentage: 14, color: '#6366F1' },
      { serviceCategory: 'Other Trades', amount: 3500, percentage: 8, color: '#F59E0B' },
    ],
    recentOrders: [
      {
        id: 'ord-m1',
        jobId: '#HE-8350',
        serviceName: 'Complete Villa Sanitization',
        customerName: 'Rajesh Goud',
        date: '22 Sep, 10:00 AM',
        amount: 3200,
        status: 'Settled',
      },
      {
        id: 'ord-m2',
        jobId: '#HE-8312',
        serviceName: 'Drain Pipe Jet Cleaning',
        customerName: 'Deepa Jain',
        date: '18 Sep, 02:30 PM',
        amount: 1450,
        status: 'Settled',
      },
      {
        id: 'ord-m3',
        jobId: '#HE-8290',
        serviceName: 'Water Heater & Thermostat Replace',
        customerName: 'Venkat Ram',
        date: '15 Sep, 04:45 PM',
        amount: 980,
        status: 'Settled',
      },
    ],
  },
};
