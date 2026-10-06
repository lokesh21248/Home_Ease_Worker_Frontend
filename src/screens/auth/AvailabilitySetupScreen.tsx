import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { useApp } from '../../state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AvailabilitySetup'>;

const ALL_DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

const TIME_SLOTS = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
];

export const AvailabilitySetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { worker, updateAvailability, submitKycRegistration, bankDetails } = useApp();

  const [selectedDays, setSelectedDays] = useState<string[]>(
    worker.availability.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [startHour, setStartHour] = useState<string>(
    worker.availability.startHour || '08:00 AM'
  );
  const [endHour, setEndHour] = useState<string>(
    worker.availability.endHour || '08:00 PM'
  );
  const [isOnline, setIsOnline] = useState<boolean>(worker.availability.isOnline);

  const toggleDay = (dayShort: string) => {
    if (selectedDays.includes(dayShort)) {
      if (selectedDays.length === 1) {
        alert('Please keep at least 1 working day active.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayShort));
    } else {
      setSelectedDays([...selectedDays, dayShort]);
    }
  };

  const handleFinish = async () => {
    updateAvailability({
      days: selectedDays,
      startHour,
      endHour,
      isOnline,
    });

    if (isOnboarding) {
      // End-to-end Backend Register KYC & Skills: POST /workers/register-kyc
      try {
        const kycPayload = {
          address: worker.address || 'Flat 204, Sai Residency, Hitec City, Hyderabad',
          panNumber: worker.panNumber || 'ABCDE1234F',
          panDocUrl:
            worker.panDocUrl ||
            'https://gheiuyygjssqatziviix.supabase.co/storage/v1/object/public/homeease-worker-kyc/pan-docs/6f2e1a3b_pan.png',
          aadhaarDocUrl:
            worker.aadhaarDocUrl ||
            'https://gheiuyygjssqatziviix.supabase.co/storage/v1/object/public/homeease-worker-kyc/aadhaar-docs/6f2e1a3b_aadhaar.png',
          bankAccountNo: bankDetails?.accountNumber || '50100234567891',
          bankIfsc: bankDetails?.ifscCode || 'HDFC0001234',
          subServiceIds:
            worker.subServiceIds && worker.subServiceIds.length > 0
              ? worker.subServiceIds
              : [
                  'c34b4032-95ed-4ed5-b5e9-a7f5ab8cd4f7',
                  '63fa806f-d1f3-4f92-aa7f-527c86c899ce',
                ],
        };
        await submitKycRegistration(kycPayload);
      } catch (err: any) {
        console.warn('[AvailabilitySetup] submitKyc notice:', err?.message);
      }

      // Completed full onboarding sequence -> navigate into MainTabs!
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Schedule & Availability"
        subtitle={isOnboarding ? 'Step 5 of 5 • Final Setup' : 'Configure work hours'}
        showBack
        onBack={() => navigation.goBack()}
      />

      {isOnboarding && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Online / Offline Status Toggle Banner */}
        <View style={[styles.statusCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.pulseIndicator,
                { backgroundColor: isOnline ? colors.onlineGreen : colors.offlineGray },
              ]}
            />
            <View>
              <Text style={styles.statusTitle}>
                {isOnline ? "You are ONLINE" : "You are OFFLINE"}
              </Text>
              <Text style={styles.statusDesc}>
                {isOnline
                  ? "Ready to receive instant nearby booking requests."
                  : "Go online to start receiving customer jobs."}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: colors.borderDark, true: colors.onlineGreen }}
            thumbColor={colors.surface}
          />
        </View>

        {/* Working Days */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Working Days</Text>
          </View>
          <Text style={styles.cardSub}>
            Select the days of the week you are willing to accept jobs:
          </Text>

          <View style={styles.daysRow}>
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.short);
              return (
                <TouchableOpacity
                  key={day.short}
                  onPress={() => toggleDay(day.short)}
                  style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.daysSelectedSummary}>
            {selectedDays.length} days active per week ({selectedDays.join(', ')})
          </Text>
        </View>

        {/* Working Hours */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Working Hours (8 AM – 8 PM)</Text>
          </View>
          <Text style={styles.cardSub}>
            Set your preferred shift window for dispatching leads:
          </Text>

          <View style={styles.timeRangeBox}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Start Time</Text>
              <View style={styles.timeSelectPill}>
                <Ionicons name="sunny-outline" size={16} color={colors.warning} />
                <Text style={styles.timeSelectText}>{startHour}</Text>
              </View>
            </View>

            <View style={styles.timeArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>End Time</Text>
              <View style={styles.timeSelectPill}>
                <Ionicons name="moon-outline" size={16} color={colors.primary} />
                <Text style={styles.timeSelectText}>{endHour}</Text>
              </View>
            </View>
          </View>

          {/* Quick Slot Buttons */}
          <Text style={styles.quickSlotLabel}>Quick Shift Presets:</Text>
          <View style={styles.presetRow}>
            {[
              { label: 'Standard (8 AM - 8 PM)', start: '08:00 AM', end: '08:00 PM' },
              { label: 'Morning Shift (7 AM - 3 PM)', start: '07:00 AM', end: '03:00 PM' },
              { label: 'Full Day (9 AM - 9 PM)', start: '09:00 AM', end: '09:00 PM' },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.label}
                onPress={() => {
                  setStartHour(preset.start);
                  setEndHour(preset.end);
                }}
                style={[
                  styles.presetChip,
                  startHour === preset.start && endHour === preset.end && styles.presetChipActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    startHour === preset.start && endHour === preset.end && styles.presetTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isOnboarding ? 'Complete Setup & Go to Dashboard 🚀' : 'Save Availability'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleFinish}
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
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
  },
  onlineCard: {
    backgroundColor: colors.successLight,
    borderColor: colors.onlineGreen,
  },
  offlineCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderDark,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  pulseIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.md,
  },
  statusTitle: {
    ...typography.subtitle1,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginLeft: spacing.xs + 2,
  },
  cardSub: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTextSelected: {
    color: colors.textInverse,
  },
  daysSelectedSummary: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  timePickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  timeSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSelectText: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '800',
    marginLeft: spacing.xs,
  },
  timeArrow: {
    paddingHorizontal: spacing.sm,
  },
  quickSlotLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  presetRow: {
    gap: spacing.xs + 2,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.primaryLighter,
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default AvailabilitySetupScreen;
