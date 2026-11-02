import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';
import { apiClient } from '../../api/client';
import { storageService } from '../../services/storageService';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, countryCode } = route.params;
  const { setIsAuthenticated, updateWorkerProfile, fetchWorkerProfile } = useApp();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inputRefs = useRef<any[]>([]);

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
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      const fullPhone = `${countryCode || '+91'}${phoneNumber}`;

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
            name: verifyResult.fullName || '',
            email: verifyResult.email || '',
            phone: verifyResult.phoneNumber || fullPhone,
          };
          updateWorkerProfile(profileUpdate);
          await storageService.saveAuthSession(token, userId);

          liveProfile = await fetchWorkerProfile();
        }
      } catch (backendErr: any) {
        console.warn('[OtpVerification] Live backend notice:', backendErr?.message);
        const localAuth = await firebaseAuthService.confirmVerificationCode(fullOtp);
        const token = localAuth.idToken;
        const userId = localAuth.user.uid;
        apiClient.setAuthToken(token);
        apiClient.setUserId(userId);
        await storageService.saveAuthSession(token, userId);
      }

      setIsVerifying(false);
      setIsAuthenticated(true);

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
      setErrorMessage(err?.message || 'Invalid verification code. Please re-enter.');
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
      setErrorMessage('Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Verification"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="keypad-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Enter 6-Digit Code</Text>
            <Text style={styles.subtitle}>
              Sent to{' '}
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
              <Ionicons name="pencil-outline" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 6 OTP Boxes */}
          <PremiumCard style={styles.otpCard}>
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
            ) : null}

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleVerify}
              size="lg"
              fullWidth
              loading={isVerifying}
              style={styles.verifyBtn}
            />

            {/* Resend Timer */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn’t receive the SMS?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={timer > 0}
                activeOpacity={0.7}
              >
                <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </PremiumCard>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  changeNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  changeNumberText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  otpCard: {
    padding: spacing.xl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  verifyBtn: {
    marginTop: spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  resendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.textSecondary,
  },
});

export default OtpVerificationScreen;
