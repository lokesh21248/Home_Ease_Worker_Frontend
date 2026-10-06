# HomeEase Worker Mobile App 🛠️⚡

> **Tagline:** *"Manage services. Grow your earnings."*

**HomeEase Worker** is a premium, frontend-only mobile application built with React Native and TypeScript, designed specifically for skilled home service professionals:

- 🧹 **Cleaners** (Deep Cleaning, Kitchen, Bathroom sanitization)
- 🔧 **Plumbers** (Pipes, Taps, Leakages)
- ⚡ **Electricians** (Wiring, Switchboards, Breakers)
- 🪚 **Carpenters** (Furniture, Doors, Woodwork)
- 🎨 **Painters** (Interior, Exterior, Waterproofing)
- ❄️ **AC Technicians** (Deep Power Jet, Gas Charging)
- 🔨 **Appliance Repair Workers** (Refrigerators, Washing Machines, Microwaves)
- 🛡️ **Pest Control Workers** (Termite, Cockroach extermination)

Modeled in visual quality and user experience after top partner apps: **Urban Company Partner**, **Uber Driver**, and **Swiggy Delivery Partner**.

---

## 📱 Tech Stack

- **Framework:** React Native (Expo SDK 57)
- **Language:** TypeScript
- **Navigation:** `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- **Networking:** Axios (`src/api/client.ts`) with request/response interceptors & token injection
- **Icons:** `@expo/vector-icons` (Ionicons)
- **Safe Area:** `react-native-safe-area-context` & `react-native-screens`
- **Firebase Phone OTP Structure:** `src/services/firebaseAuthService.ts`
- **FCM Push Notification Structure:** `src/services/fcmService.ts`
- **State Management:** React Context API (`src/state/AppContext.tsx`)

---

## 🎨 Design System

- **Background:** White / Slate-50 (`#F8FAFC` & `#FFFFFF`)
- **Primary Color:** Royal Navy Blue (`#1E40AF` & `#2563EB`)
- **Accents:** Emerald Green (`#10B981`), Amber Gold (`#F59E0B`), Crimson (`#EF4444`)
- **Cards & Surfaces:** Rounded corners (`16-20px`), soft drop shadows, crisp border strokes (`#E2E8F0`).

---

## 🗺️ Complete 23 Screen Flow

| # | Screen | Description | File Path |
|---|---|---|---|
| **1** | **Splash Screen** | App emblem, tagline, brand trust badges, partner onboarding entry | [`SplashScreen.tsx`](file:///src/screens/auth/SplashScreen.tsx) |
| **2** | **Login** | Country code (`+91`), 10-digit mobile number validation, mock auth dispatch | [`LoginScreen.tsx`](file:///src/screens/auth/LoginScreen.tsx) |
| **3** | **OTP Verification** | 6 individual boxes, auto-focus, backspace, 30s resend timer, change number | [`OtpVerificationScreen.tsx`](file:///src/screens/auth/OtpVerificationScreen.tsx) |
| **4** | **Create Account** | Full legal name, email, gender selection, birth date with validation | [`CreateAccountScreen.tsx`](file:///src/screens/auth/CreateAccountScreen.tsx) |
| **5** | **Profile Setup** | Portrait photo switcher, years of experience, languages chips, professional bio | [`ProfileSetupScreen.tsx`](file:///src/screens/auth/ProfileSetupScreen.tsx) |
| **6** | **Document Upload** | Aadhaar, PAN, DL, certificates upload with live progress & approval badges | [`DocumentUploadScreen.tsx`](file:///src/screens/auth/DocumentUploadScreen.tsx) |
| **7** | **Service Selection** | Multi-select trade cards (Cleaning, AC, Plumbing, etc.) with base pricing | [`ServiceSelectionScreen.tsx`](file:///src/screens/auth/ServiceSelectionScreen.tsx) |
| **8** | **Availability Setup** | Working days (Mon-Sun), shift hours (8 AM - 8 PM), Online/Offline toggle | [`AvailabilitySetupScreen.tsx`](file:///src/screens/auth/AvailabilitySetupScreen.tsx) |
| **9** | **Home Dashboard** | Today's jobs (5), earnings (₹2,500), completed (120), rating (4.9 ★), active job | [`HomeDashboardScreen.tsx`](file:///src/screens/dashboard/HomeDashboardScreen.tsx) |
| **10** | **Job Requests** | Distance, price, service details, Accept / Decline with real-time state | [`JobRequestsScreen.tsx`](file:///src/screens/jobs/JobRequestsScreen.tsx) |
| **11** | **Job Details** | Customer rating, address, landmark, special notes, itemized fare breakdown | [`JobDetailsScreen.tsx`](file:///src/screens/jobs/JobDetailsScreen.tsx) |
| **12** | **Navigation / Tracking** | Turn-by-turn instruction banner, vector map simulation, ETA, Call & Chat modal | [`NavigationTrackingScreen.tsx`](file:///src/screens/jobs/NavigationTrackingScreen.tsx) |
| **13** | **Active Job** | Flow: Accepted → Travelling → Arrived → Started → Completed with live stopwatch | [`ActiveJobScreen.tsx`](file:///src/screens/jobs/ActiveJobScreen.tsx) |
| **14** | **Job Completion** | Before & After photo proofs, digital customer signature box, celebration payout | [`JobCompletionScreen.tsx`](file:///src/screens/jobs/JobCompletionScreen.tsx) |
| **15** | **Earnings** | Daily, Weekly, Monthly tabs, visual bar charts, trade revenue breakdown | [`EarningsScreen.tsx`](file:///src/screens/earnings/EarningsScreen.tsx) |
| **16** | **Wallet** | Available balance, withdrawn & pending amounts, instant IMPS bank withdrawal | [`WalletScreen.tsx`](file:///src/screens/earnings/WalletScreen.tsx) |
| **17** | **Reviews & Ratings** | 4.9 ★ score overview, star breakdown bars, partner badges, customer reviews | [`ReviewsRatingsScreen.tsx`](file:///src/screens/profile/ReviewsRatingsScreen.tsx) |
| **18** | **Notifications** | Job alerts, payment receipts, document approvals, category filters | [`NotificationsScreen.tsx`](file:///src/screens/notifications/NotificationsScreen.tsx) |
| **19** | **Profile** | Partner info card, active services tags, KYC status, account menu | [`ProfileScreen.tsx`](file:///src/screens/profile/ProfileScreen.tsx) |
| **20** | **Bank Details** | Visual bank card preview, IFSC validation, secure payout account setup | [`BankDetailsScreen.tsx`](file:///src/screens/profile/BankDetailsScreen.tsx) |
| **21** | **Support** | Interactive FAQ accordion, 24/7 toll-free call, emergency SOS, live chat agent | [`SupportScreen.tsx`](file:///src/screens/support/SupportScreen.tsx) |
| **22** | **Settings** | Push notifications, siren alert, language selector, dark mode, terms viewer | [`SettingsScreen.tsx`](file:///src/screens/profile/SettingsScreen.tsx) |
| **23** | **Logout** | Modal confirmation dialog with session reset & return to Login | [`ProfileScreen.tsx`](file:///src/screens/profile/ProfileScreen.tsx) |

---

## 🗂️ Project Directory Structure

```text
src/
├── api/
│   ├── client.ts             # Axios client with interceptors & JWT injection
│   └── endpoints.ts          # Complete REST API URL constants for Spring Boot
├── components/
│   ├── Badge.tsx             # Status pills (Approved, Pending, Online, etc.)
│   ├── Button.tsx            # Primary, secondary, outline, danger buttons
│   ├── EarningCard.tsx       # Metric cards with trends and icons
│   ├── EmptyState.tsx        # Zero data illustrations and descriptions
│   ├── Header.tsx            # Navigation header with back button and actions
│   ├── Input.tsx             # Form text inputs with prefixes, icons, errors
│   ├── JobCard.tsx           # Multi-state job card with customer details & buttons
│   ├── LoadingState.tsx      # Pulse spinner and loading state
│   ├── NotificationCard.tsx  # Interactive notification cards with unread dots
│   ├── ReviewCard.tsx        # Star ratings, comments, and worker replies
│   └── index.ts              # Components barrel export
├── mock/
│   ├── earnings.ts           # Daily, weekly, monthly earnings data & bar heights
│   ├── jobs.ts               # Requests, in-progress, and historical completed jobs
│   ├── notifications.ts      # Push notifications with categorized types
│   ├── reviews.ts            # 4.9 score breakdown, badges, and customer feedback
│   ├── wallet.ts             # Balances, withdrawal history, and payout logs
│   └── workers.ts            # Default worker profile, KYC docs, bank details, services
├── navigation/
│   ├── BottomTabs.tsx        # 4 bottom tabs: Home, Jobs, Earnings, Profile
│   ├── RootNavigator.tsx     # Full stack router connecting all 23 screens
│   └── types.ts              # Type-safe parameter lists for React Navigation
├── screens/
│   ├── auth/                 # Splash, Login, OTP, CreateAccount, ProfileSetup,
│   │                         # DocumentUpload, ServiceSelection, AvailabilitySetup
│   ├── dashboard/            # HomeDashboardScreen
│   ├── earnings/             # EarningsScreen, WalletScreen
│   ├── jobs/                 # JobsTabScreen, JobRequestsScreen, JobDetailsScreen,
│   │                         # NavigationTrackingScreen, ActiveJobScreen, JobCompletionScreen
│   ├── notifications/        # NotificationsScreen
│   ├── profile/              # ProfileScreen, BankDetailsScreen, ReviewsRatingsScreen, SettingsScreen
│   └── support/              # SupportScreen (with live chat and FAQs)
├── services/
│   ├── fcmService.ts         # FCM push notification structure
│   └── firebaseAuthService.ts# Firebase Phone OTP verification structure
├── state/
│   └── AppContext.tsx        # Centralized state for Worker, Jobs, Wallet, Alerts
├── theme/
│   ├── colors.ts             # Royal blue, status colors, and dark mode palette
│   ├── spacing.ts            # Spacing, border radius, and shadow tokens
│   ├── typography.ts         # Standard mobile typography scale
│   └── index.ts
└── types/
    └── index.ts              # Comprehensive TypeScript interfaces
```

---

## 🚀 Running the Application

### 1. Dev Server (Mobile via Expo Go or Simulator)
```bash
npm start
# or
npx expo start
```
Scan the QR code with the **Expo Go** app on iOS or Android.

### 2. Web Browser Preview
```bash
npm run web
# or
npx expo start --web
```

### 3. Type Checking
```bash
npx tsc --noEmit
```

### 4. Expo Health Check
```bash
npx expo-doctor
```
