/**
 * HomeEase Partner Design System Theme Palette
 * Specification:
 * Primary: #0052FF (HomeEase Blue)
 * Secondary: #EAF1FF (Soft Blue Surface)
 * Background: #F4F7FC (Premium App Canvas)
 * Cards: #FFFFFF (White Surfaces)
 * Text: #101B35 (Deep Navy Text)
 * Secondary Text: #718096 (Muted Slate)
 * Borders: #E6EBF3 (Subtle Borders)
 * Success: #10B981, SuccessLight: #E6F9F0
 * Error: #EF4444, ErrorLight: #FEE2E2
 * Warning: #F59E0B, WarningLight: #FEF3C7
 */

export const colors = {
  // Brand Blue System
  primary: '#0052FF',         // Primary Action Blue
  primaryDark: '#003ECC',     // Rich Deep Blue
  primaryLight: '#3374FF',    // Lighter Accent Blue
  primarySoft: '#EAF1FF',     // Soft Blue Container / Pill background
  primaryLighter: '#F4F7FC',  // Canvas Background
  secondary: '#EAF1FF',       // Secondary Surface / Accents

  // Neutral Backgrounds & Cards
  background: '#F4F7FC',      // Premium Minimal Background Canvas
  secondaryBackground: '#EAEFF8', // Secondary Background tint
  surface: '#FFFFFF',         // Card & Sheet Background
  card: '#FFFFFF',            // Explicit Card Surface
  surfaceAlt: '#F4F7FC',      // Input & Pill secondary background
  surfaceElevated: '#FFFFFF',

  // Typography
  textPrimary: '#101B35',     // Primary Text (Deep Navy)
  textSecondary: '#718096',   // Secondary Text (Slate / Muted caption)
  textMuted: '#A0AEC0',       // Inactive icons & placeholders
  textInverse: '#FFFFFF',     // White text on dark/blue buttons
  textPrimaryBlue: '#0052FF', // Blue accented text

  // Borders & Dividers
  border: '#E6EBF3',          // Subtle card & item borders
  borderLight: '#F0F4FA',     // Thin divider lines
  borderDark: '#CBD5E1',      // Input focus borders

  // Status & Functional Accents
  success: '#10B981',         // Verified, Completed, Accepted, Online
  successLight: '#E6F9F0',    // Soft green tint
  warning: '#F59E0B',         // Pending, OTP, Warning
  warningLight: '#FEF3C7',    // Soft amber tint
  danger: '#EF4444',          // Rejected, Cancelled, Errors
  dangerLight: '#FEE2E2',     // Soft red tint
  info: '#0052FF',            // Information (uses primary blue)
  infoLight: '#EAF1FF',

  // Shadows & Overlays
  shadow: '#101B35',
  overlay: 'rgba(16, 27, 53, 0.60)',

  // Legacy mappings for backward compatibility
  onlineGreen: '#10B981',
  offlineGray: '#718096',
  starGold: '#F59E0B',
  accent: '#0052FF',
};

export const darkColors = colors;
export default colors;
