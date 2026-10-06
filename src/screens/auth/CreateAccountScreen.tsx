import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import Header from '../../components/Header';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export const CreateAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const { worker, updateWorkerProfile } = useApp();

  const [fullName, setFullName] = useState(worker.name || 'Ramesh Kumar');
  const [phoneNumber, setPhoneNumber] = useState(
    route.params?.phoneNumber || worker.phone || '+919123456780'
  );
  const [email, setEmail] = useState(worker.email || 'ramesh@partner.homeease.com');
  const [address, setAddress] = useState(
    worker.address || 'Flat 204, Sai Residency, Hitec City, Hyderabad'
  );
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(worker.gender || 'Male');
  const [dob, setDob] = useState(worker.dob || '1992-08-15');

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

    // End-to-end Backend Register Worker: POST /users/register
    try {
      await workerApiService.registerWorker(payload);
    } catch (err: any) {
      console.warn('[CreateAccount] Register API sync notice:', err?.message);
    }

    navigation.navigate('ProfileSetup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Worker Profile"
        subtitle="Step 1 of 5 • Basic Details"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: '20%' }]} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeading}>Personal Information</Text>
            <Text style={styles.cardSub}>
              Ensure your name matches your government Aadhaar / PAN card.
            </Text>

            {/* Full Name */}
            <Input
              label="Full Legal Name"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
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
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.primary} />}
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
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
              error={errors.email}
            />

            {/* Residential / Work Base Address */}
            <Input
              label="Operating / Residential Address"
              required
              placeholder="Flat 204, Sai Residency, Hitec City, Hyderabad"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              leftIcon={<Ionicons name="home-outline" size={20} color={colors.primary} />}
              error={errors.address}
              helperText="Required for backend KYC & partner dispatch verification"
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
              leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.primary} />}
              error={errors.dob}
              helperText="Must be 18+ years old to register as partner"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Save & Continue"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
          iconPosition="right"
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
    height: 4,
    backgroundColor: colors.border,
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeading: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSub: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  genderSection: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
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
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    gap: spacing.xs,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  genderText: {
    ...typography.subtitle2,
    color: colors.textSecondary,
  },
  genderTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default CreateAccountScreen;
