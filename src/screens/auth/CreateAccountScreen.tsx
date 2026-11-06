import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import Input from '../../components/Input';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';
import { safeGoBack } from '../../utils/navigationHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export const CreateAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const { worker, updateWorkerProfile } = useApp();

  const [fullName, setFullName] = useState(worker.name || '');
  const [phoneNumber, setPhoneNumber] = useState(
    route.params?.phoneNumber || worker.phone || ''
  );
  const [email, setEmail] = useState(worker.email || '');
  const [address, setAddress] = useState(worker.address || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(worker.gender || 'Male');
  const [dob, setDob] = useState(worker.dob || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required.';
    if (!address.trim()) newErrors.address = 'Address is required for KYC verification.';
    if (!dob.trim()) newErrors.dob = 'Date of birth is required (YYYY-MM-DD).';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    const payload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      role: 'WORKER' as const,
    };

    updateWorkerProfile({
      name: payload.fullName,
      phone: payload.phoneNumber,
      email: payload.email,
      address: address.trim(),
      role: 'WORKER',
      gender,
      dob,
    });

    try {
      await workerApiService.registerWorker(payload);
    } catch (err: any) {
      console.warn('[CreateAccount] Register API sync notice:', err?.message);
    }

    navigation.navigate('ProfileSetup');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Create Partner Profile"
        subtitle="Step 1 of 5 • Basic Details"
        showBack
        onBack={() => safeGoBack(navigation, 'Login')}
      />

      {/* Progress Indicator */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PremiumCard style={styles.card}>
            <Text style={styles.cardHeading}>Personal Information</Text>
            <Text style={styles.cardSub}>
              Ensure your name matches your government Aadhaar / PAN card.
            </Text>

            {/* Full Name */}
            <Input
              label="Full Legal Name"
              required
              placeholder="Enter your full legal name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
              error={errors.fullName}
            />

            {/* Mobile Phone Number */}
            <Input
              label="Mobile Phone Number"
              required
              placeholder="+91 91234 56780"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
              error={errors.phoneNumber}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              required
              placeholder="worker@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
              error={errors.email}
            />

            {/* Operating Address */}
            <Input
              label="Operating / Residential Address"
              required
              placeholder="Flat 204, Sai Residency, Hitec City, Hyderabad"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              leftIcon={<Ionicons name="home-outline" size={18} color={colors.primary} />}
              error={errors.address}
              helperText="Required for partner dispatch radius"
            />

            {/* Gender Selector */}
            <View style={styles.genderSection}>
              <Text style={styles.fieldLabel}>Gender *</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderOptionSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        g === 'Male'
                          ? 'male-outline'
                          : g === 'Female'
                          ? 'female-outline'
                          : 'person-outline'
                      }
                      size={18}
                      color={gender === g ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              required
              placeholder="YYYY-MM-DD (e.g. 1992-08-15)"
              value={dob}
              onChangeText={(text) => {
                setDob(text);
                if (errors.dob) setErrors({ ...errors, dob: '' });
              }}
              leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
              error={errors.dob}
              helperText="Must be 18+ years old to register"
            />
          </PremiumCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Save & Continue"
          size="lg"
          fullWidth
          onPress={handleContinue}
          iconRight={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  genderSection: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default CreateAccountScreen;
