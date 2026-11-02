import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [countryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
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

      try {
        await workerApiService.sendOtp(fullNumber);
      } catch (backendErr: any) {
        console.warn('[LoginScreen] Live backend notice:', backendErr?.message);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="construct-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>HomeEase Partner</Text>
            <Text style={styles.subtitle}>
              Sign in with your verified mobile number to receive instant bookings
            </Text>
          </View>

          {/* Form Card */}
          <PremiumCard style={styles.card}>
            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <View style={[styles.phoneInputRow, Boolean(error) && styles.inputRowError]}>
              {/* Country Code Pill */}
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>

              {/* Mobile Number Input */}
              <TextInput
                placeholder="98765 43210"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (error) setError('');
                }}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.textInput}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              title="Send Verification Code"
              onPress={handleContinue}
              size="lg"
              fullWidth
              loading={isLoading}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />}
              style={styles.continueBtn}
            />

            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                By signing in, you agree to our{' '}
                <Text style={styles.linkText}>Partner Agreement</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </View>
          </PremiumCard>

          {/* New Worker Onboarding Callout */}
          <View style={styles.registerFooter}>
            <Text style={styles.registerText}>Want to register a new trade account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateAccount', { phoneNumber })}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Register as New Partner</Text>
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
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 290,
    lineHeight: 18,
  },
  card: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  countryCodeBox: {
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: spacing.sm,
  },
  countryCodeText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 6,
  },
  continueBtn: {
    marginTop: spacing.lg,
  },
  termsBox: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  registerFooter: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default LoginScreen;
