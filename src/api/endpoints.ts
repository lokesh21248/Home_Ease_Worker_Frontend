export const BASE_API_URL = 'http://3.107.161.126:8080/api/v1';

export const API_ENDPOINTS = {
  // 1. Worker Auth & Registration
  AUTH: {
    SEND_OTP: '/auth/otp/send',
    VERIFY_OTP: '/auth/otp/verify',
    REGISTER: '/users/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // 2. Worker Document Upload & KYC Registration
  UPLOAD: {
    WORKER_AVATAR: (workerId: string) => `/upload/worker-profile/${workerId}`,
    PAN_DOC: (workerId: string) => `/upload/worker-kyc/pan/${workerId}`,
    AADHAAR_DOC: (workerId: string) => `/upload/worker-kyc/aadhaar/${workerId}`,
  },

  // 3. Worker KYC, Availability & Location
  WORKER: {
    REGISTER_KYC: '/workers/register-kyc',
    STATUS: '/workers/status', // Online / Offline toggle
    LOCATION: '/workers/location', // GPS location heartbeat ping
    EARNINGS: '/workers/earnings', // Earnings & Settlement summary
    PROFILE: '/workers/profile',
    UPDATE_PROFILE: '/workers/profile/update',
    SERVICES: '/workers/services',
    BANK_DETAILS: '/workers/bank-details',
  },

  // 4. Job Dispatch, PIN Verification & Execution
  BOOKINGS: {
    ACCEPT: (bookingId: string) => `/workers/bookings/${bookingId}/accept`,
    REJECT: (bookingId: string) => `/workers/bookings/${bookingId}/reject`,
    VERIFY_PIN: (bookingId: string) => `/workers/bookings/${bookingId}/verify-pin`,
    ADD_SUB_SERVICE: (bookingId: string) => `/workers/bookings/${bookingId}/add-sub-service`,
    COMPLETE: (bookingId: string) => `/workers/bookings/${bookingId}/complete`,
    REQUESTS: '/workers/bookings/requests',
    DETAILS: (bookingId: string) => `/workers/bookings/${bookingId}`,
  },

  // Legacy & supplementary endpoints
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    REQUEST_PAYOUT: '/wallet/payout',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    UPDATE_FCM_TOKEN: '/notifications/fcm-token',
  },
  REVIEWS: {
    LIST: '/reviews',
    REPLY: (id: string) => `/reviews/${id}/reply`,
  },
  SUPPORT: {
    TICKETS: '/support/tickets',
    FAQ: '/support/faqs',
  },
};
