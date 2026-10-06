import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Button from '../../components/Button';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';
import { apiClient } from '../../api/client';
import { storageService } from '../../services/storageService';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, countryCode } = route.params;
  const { setIsAuthenticated, updateWorkerProfile, fetchWorkerProfile } = useApp();

  const [otp, setOtp] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [timer, setTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    setErrorMessage('');
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto advance to next box
    if (text.length > 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      const fullPhone = `${countryCode || '+91'}${phoneNumber}`;

      // End-to-end Backend Verify OTP: POST /auth/otp/verify
      let verifyResult: any = null;
      let liveProfile: any = null;
      try {
        verifyResult = await workerApiService.verifyOtp(fullPhone, fullOtp);
        if (verifyResult) {
          const token = verifyResult.token || 'worker_verified_token';
          const userId = verifyResult.userId || '1270d52d-9f4e-4399-9a80-15cab07f1763';
          apiClient.setAuthToken(token);
          apiClient.setUserId(userId);
          const profileUpdate = {
            id: userId,
            name: verifyResult.fullName || 'Ramesh Kumar',
            email: verifyResult.email || 'ramesh@partner.homeease.com',
            phone: verifyResult.phoneNumber || fullPhone,
          };
          updateWorkerProfile(profileUpdate);
          await storageService.saveAuthSession(token, userId);

          // Fetch live profile from GET /workers/profile (Endpoint 2)
          liveProfile = await fetchWorkerProfile();
        }
      } catch (backendErr: any) {
        console.warn('[OtpVerification] Live backend notice:', backendErr?.message);
        // Fallback local verification for demo / offline
        const localAuth = await firebaseAuthService.confirmVerificationCode(fullOtp);
        const token = localAuth.idToken;
        const userId = localAuth.user.uid;
        apiClient.setAuthToken(token);
        apiClient.setUserId(userId);
        await storageService.saveAuthSession(token, userId);
      }

      setIsVerifying(false);
      setIsAuthenticated(true);

      // Navigate to MainTabs if worker already has a verified account/profile, else onboarding
      if (liveProfile && (liveProfile.isVerified || liveProfile.fullName)) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        navigation.navigate('CreateAccount', { phoneNumber });
      }
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMessage(err?.message || 'Invalid OTP code. Please try 123456');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const fullPhone = `${countryCode || '+91'}${phoneNumber}`;
      try {
        await workerApiService.sendOtp(fullPhone);
      } catch {
        await firebaseAuthService.resendCode();
      }
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setErrorMessage('Failed to resend OTP.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back button & header */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              We have sent a 6-digit code to{' '}
              <Text style={styles.phoneHighlight}>
                {countryCode} {phoneNumber}
              </Text>
            </Text>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.changeNumberRow}
              activeOpacity={0.7}
            >
              <Text style={styles.changeNumberText}>Edit Phone Number</Text>
              <Ionicons name="pencil" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* 6 OTP Boxes */}
          <View style={styles.otpCard}>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpBox,
                    Boolean(digit) && styles.otpBoxFilled,
                    Boolean(errorMessage) && styles.otpBoxError,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <View style={styles.demoHint}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.demoHintText}>
                  Mock OTP auto-filled (123456). Tap Verify to continue.
                </Text>
              </View>
            )}

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              variant="primary"
              size="lg"
              fullWidth
              loading={isVerifying}
              style={styles.verifyBtn}
            />

            {/* Resend Timer */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn&apos;t receive the SMS?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={timer > 0}
                activeOpacity={0.7}
              >
                <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  changeNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
  },
  changeNumberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  otpCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  otpBoxError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginVertical: spacing.sm,
  },
  demoHintText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 4,
  },
  verifyBtn: {
    marginTop: spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  resendLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  resendLink: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: '700',
  },
  resendDisabled: {
    color: colors.textMuted,
  },
});

export default OtpVerificationScreen;
