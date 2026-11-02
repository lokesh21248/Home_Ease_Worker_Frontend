import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
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
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import Input from '../../components/Input';
import { useApp } from '../../state/AppContext';
import { workerApiService } from '../../api/workerApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const AVAILABLE_LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Bengali', 'Marathi'];

export const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { worker, updateWorkerProfile } = useApp();

  const [photoUri, setPhotoUri] = useState(
    worker.photoUri || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80'
  );
  const [experienceYears, setExperienceYears] = useState(
    worker.experienceYears ? String(worker.experienceYears) : ''
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    worker.languages || ['English', 'Hindi']
  );
  const [bio, setBio] = useState(worker.bio || '');

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleContinue = async () => {
    const workerId = worker.id || '';

    try {
      const uploadRes = await workerApiService.uploadWorkerProfilePhoto(workerId, photoUri);
      if (uploadRes?.url) {
        updateWorkerProfile({ photoUri: uploadRes.url });
      }
    } catch (err: any) {
      console.warn('[ProfileSetup] Avatar upload notice:', err?.message);
    }

    updateWorkerProfile({
      photoUri,
      experienceYears: parseInt(experienceYears, 10) || 1,
      languages: selectedLanguages,
      bio,
    });

    navigation.navigate('DocumentUpload', { isOnboarding: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Professional Profile"
        subtitle="Step 2 of 5 • Photo & Bio"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressFill, { width: '40%' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Upload Box */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              <TouchableOpacity
                style={styles.cameraCircle}
                activeOpacity={0.8}
                onPress={() => {
                  setPhotoUri(
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
                  );
                }}
              >
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Professional Profile Photo</Text>
            <Text style={styles.avatarSubHint}>
              Customers recognize and verify you via this photo.
            </Text>
          </View>

          <PremiumCard style={styles.card}>
            {/* Experience */}
            <Input
              label="Years of Work Experience"
              placeholder="e.g. 5"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              leftIcon={<Ionicons name="ribbon-outline" size={18} color={colors.primary} />}
              helperText="Experience boosts your ranking for high-value dispatches"
            />

            {/* Language Chips */}
            <View style={styles.langSection}>
              <Text style={styles.fieldLabel}>Spoken Languages</Text>
              <Text style={styles.fieldSub}>
                Select all languages you can comfortably speak with customers:
              </Text>
              <View style={styles.langChipsRow}>
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => toggleLanguage(lang)}
                      style={[
                        styles.langChip,
                        isSelected && styles.langChipSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                      ) : null}
                      <Text
                        style={[
                          styles.langChipText,
                          isSelected && styles.langChipTextSelected,
                        ]}
                      >
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bio / Description */}
            <Input
              label="Short Bio / Introduction"
              placeholder="Certified technician with 5+ years of experience in prompt home service..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              inputStyle={{ minHeight: 70, textAlignVertical: 'top' }}
              helperText="Visible on your public partner card"
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cameraCircle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avatarSubHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  langSection: {
    marginVertical: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  fieldSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  langChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langChipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  langChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ProfileSetupScreen;
