import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
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
import Input from '../../components/Input';
import Header from '../../components/Header';
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
    String(worker.experienceYears || 5)
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    worker.languages || ['English', 'Hindi', 'Telugu']
  );
  const [bio, setBio] = useState(
    worker.bio ||
      'Expert Home Cleaning & Maintenance Professional with 5+ years of verified on-site experience.'
  );

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleContinue = async () => {
    const workerId = worker.id || '6f2e1a3b-4c5d-6e7f-6a9b-1c2d3e4f5a6b';

    // End-to-end Backend Upload Profile Photo: POST /upload/worker-profile/{workerId}
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
    <SafeAreaView style={styles.container}>
      <Header
        title="Professional Profile"
        subtitle="Step 2 of 5 • Experience & Bio"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>

          {/* Avatar Selector Card */}
          <View style={styles.card}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: photoUri }} style={styles.avatar} />
                <TouchableOpacity
                  style={styles.cameraIconBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Toggle alternative clean avatar for demo
                    setPhotoUri(
                      photoUri.includes('1540569014015')
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
                        : 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80'
                    );
                  }}
                >
                  <Ionicons name="camera" size={16} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarLabel}>Tap camera to switch photo</Text>
              <Text style={styles.avatarSub}>
                Upload a clear portrait facing forward with good lighting.
              </Text>
            </View>

            {/* Experience in Years */}
            <Input
              label="Work Experience (in Years)"
              required
              placeholder="e.g. 5"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              maxLength={2}
              leftIcon={<Ionicons name="ribbon-outline" size={20} color={colors.primary} />}
              helperText="Years of hands-on professional service"
            />

            {/* Languages Known */}
            <View style={styles.langSection}>
              <Text style={styles.fieldLabel}>Languages You Speak *</Text>
              <View style={styles.chipsRow}>
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => toggleLanguage(lang)}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Professional Bio */}
            <Input
              label="Professional Bio / Introduction"
              required
              placeholder="e.g. Expert Home Cleaning Professional with specialized skills..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              inputStyle={styles.bioInput}
              helperText="This is shown to customers when you accept their job"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Save & Proceed to Documents"
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  avatarLabel: {
    ...typography.subtitle2,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '700',
  },
  avatarSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 240,
  },
  fieldLabel: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  langSection: {
    marginBottom: spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  chipText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  bioInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default ProfileSetupScreen;
