/**
 * HomeEase Partner - Complete Pronto & Urban Company Theme Palette
 * Brand Guidelines:
 * Primary: #1769E0 (HomeEase Blue)
 * Background: #FFFFFF
 * Secondary Background: #F5F8FC
 * Text: Dark Navy (#0F1E36)
 * Cards: #FFFFFF with subtle borders (#E5EAF2)
 */

export const colors = {
  // Brand Blue System
  primary: '#1769E0',         // Primary Blue
  primaryDark: '#0F4BB8',     // Rich Deep Blue
  secondary: '#0E3378',       // Dark Navy Blue (Headers, contrast accents)
  primaryLight: '#3D87F5',    // Lighter Blue (Highlights, focused elements)
  primarySoft: '#EBF3FE',     // Ultra Soft Blue (Card accents, active pill backgrounds)
  primaryLighter: '#F5F8FC',  // Secondary Background tint

  // Neutral Backgrounds & Cards
  background: '#FFFFFF',      // Clean Premium App Background
  secondaryBackground: '#F5F8FC', // Secondary Background
  surface: '#FFFFFF',         // Card & Sheet Background
  card: '#FFFFFF',            // Explicit Card alias
  surfaceAlt: '#F5F8FC',      // Input & Pill secondary background
  surfaceElevated: '#FFFFFF',

  // Typography
  textPrimary: '#0F1E36',     // Primary Text (Dark Navy)
  textSecondary: '#6B7A90',   // Secondary Text (Muted subtitle / caption)
  textMuted: '#9BA8B8',       // Inactive icons & placeholders
  textInverse: '#FFFFFF',     // White text on dark/blue buttons
  textPrimaryBlue: '#1769E0', // Blue accented text

  // Borders & Dividers
  border: '#E5EAF2',          // Subtle card & item borders
  borderLight: '#EDF2F9',     // Thin divider lines
  borderDark: '#CBD5E1',      // Input focus borders

  // Status & Functional Accents
  success: '#10B981',         // Verified, Completed, Accepted
  successLight: '#ECFDF5',    // Soft green tint
  warning: '#F59E0B',         // Pending, OTP, Warning
  warningLight: '#FFFBEB',    // Soft amber tint
  danger: '#EF4444',          // Rejected, Cancelled, Errors
  dangerLight: '#FEF2F2',     // Soft red tint
  info: '#1769E0',            // Information (uses primary blue)
  infoLight: '#EBF3FE',

  // Shadows & Overlays
  shadow: '#0F1E36',
  overlay: 'rgba(15, 30, 54, 0.65)',

  // Legacy mappings for backward compatibility
  onlineGreen: '#10B981',
  offlineGray: '#6B7A90',
  starGold: '#F59E0B',
  accent: '#1769E0',
};

export const darkColors = colors; // Keep consistent blue-and-white theme
export default colors;
