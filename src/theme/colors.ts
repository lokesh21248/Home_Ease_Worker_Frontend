/**
 * HomeEase Worker - Blue & White Theme Palette
 * Inspired by Urban Company, premium fintech apps & clean Apple-style UI.
 * Strictly adheres to the #2454D6 primary blue & white color system.
 */

export const colors = {
  // Brand Blue System
  primary: '#2454D6',         // Primary Blue
  primaryDark: '#173B8F',
  secondary: '#173B8F',     // Dark Blue (Headers, active states, deep contrast)
  primaryLight: '#4475F2',    // Lighter Blue (Highlights, focused elements)
  primarySoft: '#EFF4FE',     // Ultra Soft Blue (Card accents, active pill backgrounds)
  primaryLighter: '#F0F5FE',  // Light Blue tint

  // Neutral Backgrounds & Cards
  background: '#F5F8FE',      // Clean Premium App Background
  surface: '#FFFFFF',         // Card & Sheet Background
  card: '#FFFFFF',            // Explicit Card alias
  surfaceAlt: '#F0F4FC',      // Input & Pill secondary background
  surfaceElevated: '#FFFFFF',

  // Typography
  textPrimary: '#17243A',     // Primary Text (High contrast dark navy/slate)
  textSecondary: '#718096',   // Secondary Text (Muted subtitle / caption)
  textMuted: '#A0AEC0',       // Inactive icons & placeholders
  textInverse: '#FFFFFF',     // White text on dark/blue buttons
  textPrimaryBlue: '#2454D6', // Blue accented text

  // Borders & Dividers
  border: '#E5EAF2',          // Subtle card & item borders
  borderLight: '#EDF2F9',     // Thin divider lines
  borderDark: '#CBD5E1',      // Input focus borders

  // Status & Functional Accents (Subtle and harmonious with blue palette)
  success: '#10B981',         // Verified, Completed, Accepted
  successLight: '#ECFDF5',    // Soft green tint
  warning: '#F59E0B',         // Pending, OTP, Warning
  warningLight: '#FFFBEB',    // Soft amber tint
  danger: '#EF4444',          // Rejected, Cancelled, Errors
  dangerLight: '#FEF2F2',     // Soft red tint
  info: '#2454D6',            // Information (uses primary blue)
  infoLight: '#EFF4FE',

  // Shadows & Overlays
  shadow: '#17243A',
  overlay: 'rgba(23, 36, 58, 0.60)',

  // Legacy mappings for backward compatibility
  onlineGreen: '#10B981',
  offlineGray: '#718096',
  starGold: '#F59E0B',
  accent: '#2454D6',
};

export const darkColors = colors; // Keep consistent blue-and-white theme
export default colors;
