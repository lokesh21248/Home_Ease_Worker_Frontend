import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setError('');
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (!cleanNumber) {
      setError('Please enter your mobile phone number.');
      return;
    }

    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsLoading(true);
      const fullNumber = `${countryCode}${cleanNumber}`;

      // End-to-end Backend Send OTP: POST /auth/otp/send
      try {
        await workerApiService.sendOtp(fullNumber);
      } catch (backendErr: any) {
        console.warn('[LoginScreen] Live backend notice:', backendErr?.message);
        // Fallback local auth simulation if remote backend is unreachable
        await firebaseAuthService.signInWithPhoneNumber(cleanNumber, countryCode);
      }

      setIsLoading(false);

      navigation.navigate('OtpVerification', {
        phoneNumber: cleanNumber,
        countryCode,
      });
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Partner Login</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to sign in or register as a HomeEase professional.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.phoneInputRow}>
              {/* Country Code Pill */}
              <View style={styles.countryCodeBox}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>

              {/* Mobile Number Input */}
              <View style={styles.numberInputContainer}>
                <Input
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (error) setError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={error}
                  containerStyle={styles.inputWrapper}
                />
              </View>
            </View>

            {/* Test Helper Pill */}
            <View style={styles.helperTip}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.helperTipText}>
                Demo Mode: Default mock number loaded. Any 10-digit number is accepted.
              </Text>
            </View>

            <Button
              title="Send OTP"
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              icon={<Ionicons name="lock-closed" size={18} color={colors.textInverse} />}
              style={styles.continueBtn}
            />

            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                By tapping Continue, you agree to our{' '}
                <Text style={styles.linkText}>Partner Terms</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>
          </View>

          {/* New Worker Onboarding Callout */}
          <View style={styles.registerFooter}>
            <Text style={styles.registerText}>Want to register a new service business?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateAccount', { phoneNumber })}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Register as New Worker</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 290,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCodeText: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  numberInputContainer: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  helperTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  helperTipText: {
    ...typography.caption,
    color: colors.info,
    marginLeft: spacing.xs + 2,
    flex: 1,
    lineHeight: 16,
  },
  continueBtn: {
    marginTop: spacing.sm,
  },
  termsBox: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  registerFooter: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  registerText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default LoginScreen;
