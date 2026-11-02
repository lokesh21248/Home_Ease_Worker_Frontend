export type JobStatus = 
  | 'requested'
  | 'accepted'
  | 'travelling'
  | 'arrived'
  | 'started'
  | 'completed'
  | 'cancelled';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'not_uploaded';

export interface DocumentItem {
  id: string;
  type: 'aadhaar' | 'pan' | 'driving_license' | 'profile_photo' | 'certificate';
  title: string;
  description: string;
  required: boolean;
  status: VerificationStatus;
  fileUri?: string;
  fileName?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  url?: string; // Remote Supabase storage public URL from backend upload
  bucket?: string; // Backend bucket name (e.g. homeease-worker-kyc)
}

export interface SubService {
  id: string; // UUID from backend (e.g. c34b4032-95ed-4ed5-b5e9-a7f5ab8cd4f7)
  serviceCategoryId: string;
  name: string;
  description?: string;
  price: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  basePrice: number;
  selected?: boolean;
  subServices?: SubService[];
}

export interface WorkerAvailability {
  days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  startHour: string; // e.g. "08:00 AM"
  endHour: string; // e.g. "08:00 PM"
  isOnline: boolean;
}

export interface WorkerProfile {
  id: string; // UUID (matches backend userId / workerId)
  userId?: string; // Backend User UUID
  name: string; // maps to fullName
  phone: string; // maps to phoneNumber (+91...)
  countryCode: string;
  email: string;
  role: 'WORKER'; // Backend role
  address: string; // Worker address for KYC registration
  panNumber: string; // 10-char PAN number (e.g. ABCDE1234F)
  panDocUrl?: string; // Uploaded PAN document URL
  aadhaarDocUrl?: string; // Uploaded Aadhaar document URL
  bankAccountNo?: string; // Payout bank account number
  bankIfsc?: string; // Payout IFSC code
  subServiceIds: string[]; // List of registered sub-service UUIDs
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  photoUri: string;
  experienceYears: number;
  languages: string[];
  bio: string;
  rating: number;
  totalReviews: number;
  completedJobsCount: number;
  isKycVerified: boolean;
  isVerified?: boolean; // alias for backend isVerified
  selectedServices: string[]; // service category IDs
  availability: WorkerAvailability;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalBookings: number;
}

export interface JobLocation {
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface Job {
  id: string;
  bookingId?: string; // Backend UUID e.g. c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a
  jobId: string; // Display code e.g. #HE-8492
  customer: Customer;
  serviceId: string;
  serviceName: string;
  category: string;
  location: JobLocation;
  scheduledDate: string;
  scheduledTime: string;
  scheduledEndAt?: string;
  bookingType?: 'INSTANT' | 'SCHEDULED';
  estimatedArrivalMinutes?: number;
  price: number;
  totalAmount?: number; // Backend booking totalAmount
  commission: number;
  netPayout: number;
  status: JobStatus;
  pinCode?: string; // 4-digit PIN for verification on doorstep
  subServices?: {
    subServiceId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  instructions: string;
  paymentMode: 'Online Pre-paid' | 'Cash on Delivery' | 'UPI at Destination';
  paymentStatus?: 'PENDING' | 'COMPLETED';
  estimatedDuration: string;
  startedAt?: string;
  completedAt?: string;
  timeline: {
    acceptedAt?: string;
    travellingAt?: string;
    arrivedAt?: string;
    startedAt?: string;
    completedAt?: string;
  };
  completionData?: {
    beforeImageUri?: string;
    afterImageUri?: string;
    customerSignatureUri?: string;
    notes?: string;
    completedAt?: string;
  };
}

export interface EarningSummary {
  daily: number;
  weekly: number;
  monthly: number;
  grossEarnings: number;
  commissionDeducted: number;
  netEarnings: number;
  tipsAndBonuses: number;
  breakdown: {
    label: string;
    amount: number;
    date: string;
  }[];
  chartData: {
    label: string;
    earnings: number;
    jobs: number;
  }[];
}

export interface WalletTransaction {
  id: string;
  transactionId: string;
  title: string;
  type: 'credit' | 'payout' | 'incentive' | 'commission';
  amount: number;
  date: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
  paymentMethod?: string;
}

export interface ReviewItem {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  serviceName: string;
  date: string;
  comment: string;
  workerReply?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'job' | 'payment' | 'document' | 'offer' | 'system';
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  jobId?: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  isVerified: boolean;
}

export interface AppSettings {
  pushNotifications: boolean;
  soundAlerts: boolean;
  smsUpdates: boolean;
  language: string;
  darkMode: boolean;
}

// Backend Integration Types & Contracts
export interface KycRegistrationPayload {
  address: string;
  panNumber: string;
  panDocUrl: string;
  aadhaarDocUrl: string;
  bankAccountNo: string;
  bankIfsc: string;
  subServiceIds: string[];
}

export interface AddSubServicePayload {
  subServiceId: string;
  quantity: number;
}

export interface WorkerLocationPayload {
  lat: number;
  lng: number;
}

export interface VerifyPinPayload {
  pinCode: string;
}

export interface BackendEarningsResponse {
  totalEarnings: number;
  totalCommissionPaid: number;
  netPayout: number;
  completedBookingsCount: number;
}

// Dual Booking & Worker Availability Types
// Dual Booking & Worker Availability Types
export interface DaySchedule {
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  dayName: string;   // "Monday", "Tuesday", etc.
  isAvailable: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
  breakStartTime?: string; // "13:00"
  breakEndTime?: string;   // "14:00"
  slotDurationMins: number; // 60
}

export interface TimeOffItem {
  timeOffId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  createdAt?: string;
}

export interface WorkerScheduleSlot {
  bookingId: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  timeWindow: string;
  status: string;
  scheduledAt: string;
  scheduledEndAt: string;
  bookingType: 'INSTANT' | 'SCHEDULED' | string;
  isAvailable: boolean;
  slotDurationMins?: number;
  bookingUuid?: string;
}

export interface WorkerTodaySchedule {
  date: string;
  totalJobsToday: number;
  completedCount: number;
  schedule: WorkerScheduleSlot[];
}

export interface WorkerAllSchedule {
  today: WorkerTodaySchedule;
  upcoming: WorkerScheduleSlot[];
}

