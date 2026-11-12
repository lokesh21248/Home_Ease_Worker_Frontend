import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
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
import { SecondaryButton } from '../../components/SecondaryButton';
import { useApp } from '../../state/AppContext';
import { DaySchedule } from '../../types';
import { safeGoBack } from '../../utils/navigationHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'AvailabilitySetup'>;

const ALL_DAYS = [
  { short: 'Mon', full: 'Monday', dayOfWeek: 1 },
  { short: 'Tue', full: 'Tuesday', dayOfWeek: 2 },
  { short: 'Wed', full: 'Wednesday', dayOfWeek: 3 },
  { short: 'Thu', full: 'Thursday', dayOfWeek: 4 },
  { short: 'Fri', full: 'Friday', dayOfWeek: 5 },
  { short: 'Sat', full: 'Saturday', dayOfWeek: 6 },
  { short: 'Sun', full: 'Sunday', dayOfWeek: 7 },
];

function to24Hour(timeStr: string): string {
  if (!timeStr) return '08:00';
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  const parts = timeStr.trim().split(' ');
  const [hh, mm] = parts[0].split(':');
  let h = parseInt(hh, 10);
  const modifier = parts[1]?.toUpperCase();
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${mm || '00'}`;
}

export const AvailabilitySetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route.params?.isOnboarding ?? false;
  const {
    worker,
    updateAvailability,
    submitKycRegistration,
    bankDetails,
    weeklySchedule,
    timeOffList,
    saveWeeklySchedule,
    addWorkerTimeOff,
    deleteWorkerTimeOff,
    fetchAvailabilityData,
    toggleOnlineStatus,
    updateWorkingPincodes,
  } = useApp();

  const [selectedDays, setSelectedDays] = useState<string[]>(
    worker.availability.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [startHour, setStartHour] = useState<string>(
    worker.availability.startHour || '08:00 AM'
  );
  const [endHour, setEndHour] = useState<string>(
    worker.availability.endHour || '08:00 PM'
  );
  const [breakStartHour, setBreakStartHour] = useState<string>('01:00 PM');
  const [breakEndHour, setBreakEndHour] = useState<string>('02:00 PM');
  const [hasBreak, setHasBreak] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(worker.availability.isOnline);

  // Operating Pincodes & Service Areas state
  const [pincodesList, setPincodesList] = useState<string[]>(
    worker.workingPincodes && worker.workingPincodes.length > 0
      ? worker.workingPincodes
      : ['500081', '500072', '500032', '500033', '500034', '500104']
  );
  const [newPincode, setNewPincode] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  // Time off modal state
  const [isTimeOffModalVisible, setIsTimeOffModalVisible] = useState(false);
  const [timeOffStartDate, setTimeOffStartDate] = useState('');
  const [timeOffEndDate, setTimeOffEndDate] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('Personal Leave');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAvailabilityData();
  }, []);

  useEffect(() => {
    if (weeklySchedule && weeklySchedule.length > 0) {
      const activeDays = weeklySchedule
        .filter((d) => d.isAvailable)
        .map((d) => d.dayName.substring(0, 3));
      if (activeDays.length > 0) setSelectedDays(activeDays);
      const first = weeklySchedule[0];
      if (first.startTime) setStartHour(formatTo12H(first.startTime));
      if (first.endTime) setEndHour(formatTo12H(first.endTime));
      if (first.breakStartTime && first.breakEndTime) {
        setHasBreak(true);
        setBreakStartHour(formatTo12H(first.breakStartTime));
        setBreakEndHour(formatTo12H(first.breakEndTime));
      }
    }
  }, [weeklySchedule]);

  function formatTo12H(time24: string): string {
    if (!time24) return '08:00 AM';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const [hh, mm] = time24.split(':');
    let h = parseInt(hh, 10);
    const mod = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h.toString().padStart(2, '0')}:${mm || '00'} ${mod}`;
  }

  const toggleDay = (dayShort: string) => {
    if (selectedDays.includes(dayShort)) {
      if (selectedDays.length === 1) {
        Alert.alert('Working Schedule', 'Please keep at least 1 working day active.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayShort));
    } else {
      setSelectedDays([...selectedDays, dayShort]);
    }
  };

  const handleAddTimeOff = async () => {
    if (!timeOffStartDate || !timeOffEndDate) {
      Alert.alert('Required Fields', 'Please enter both start and end date (YYYY-MM-DD).');
      return;
    }
    const success = await addWorkerTimeOff(
      timeOffStartDate.trim(),
      timeOffEndDate.trim(),
      timeOffReason.trim()
    );
    if (success) {
      setIsTimeOffModalVisible(false);
      setTimeOffStartDate('');
      setTimeOffEndDate('');
      setTimeOffReason('Personal Leave');
    }
  };

  const handleDeleteTimeOff = (id: string, dateRange: string) => {
    Alert.alert(
      'Unblock Dates',
      `Are you sure you want to remove time off for ${dateRange}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: () => deleteWorkerTimeOff(id),
        },
      ]
    );
  };

  const setQuickTimeOff = (daysAhead: number, durationDays: number) => {
    const start = new Date();
    start.setDate(start.getDate() + daysAhead);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays - 1);
    setTimeOffStartDate(start.toISOString().split('T')[0]);
    setTimeOffEndDate(end.toISOString().split('T')[0]);
  };

  const handleAddPincode = (codeToAdd?: string) => {
    const code = (codeToAdd || newPincode).trim();
    if (!/^\d{6}$/.test(code)) {
      setPincodeError('Pincode must be exactly 6 digits (e.g. 500032)');
      return;
    }
    if (pincodesList.includes(code)) {
      setPincodeError(`Pincode ${code} is already added`);
      return;
    }
    setPincodesList((prev) => [...prev, code]);
    setNewPincode('');
    setPincodeError('');
  };

  const handleRemovePincode = (codeToRemove: string) => {
    if (pincodesList.length <= 1) {
      Alert.alert('Minimum Required', 'At least 1 active working pincode is required for dispatch.');
      return;
    }
    setPincodesList((prev) => prev.filter((p) => p !== codeToRemove));
  };

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      updateAvailability({
        days: selectedDays,
        startHour,
        endHour,
        isOnline,
      });

      if (isOnline !== worker.availability.isOnline) {
        await toggleOnlineStatus();
      }

      // Save pincodes to worker profile & server
      await updateWorkingPincodes(pincodesList);

      const schedulePayload: DaySchedule[] = ALL_DAYS.map((day) => {
        const isAvailable = selectedDays.includes(day.short);
        return {
          dayOfWeek: day.dayOfWeek,
          dayName: day.full,
          isAvailable,
          startTime: to24Hour(startHour),
          endTime: to24Hour(endHour),
          breakStartTime: hasBreak ? to24Hour(breakStartHour) : undefined,
          breakEndTime: hasBreak ? to24Hour(breakEndHour) : undefined,
          slotDurationMins: 60,
        };
      });

      await saveWeeklySchedule(schedulePayload);

      if (isOnboarding) {
        try {
          const kycPayload = {
            address: worker.address || '',
            panNumber: worker.panNumber || '',
            panDocUrl: worker.panDocUrl || '',
            aadhaarDocUrl: worker.aadhaarDocUrl || '',
            bankAccountNo: bankDetails?.accountNumber || '',
            bankIfsc: bankDetails?.ifscCode || '',
            subServiceIds: worker.subServiceIds || [],
          };
          await submitKycRegistration(kycPayload);
        } catch (err: any) {
          console.warn('[AvailabilitySetup] submitKyc notice:', err?.message);
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'HomeTab' } }],
        });
      } else {
        safeGoBack(navigation, 'MainTabs', { screen: 'HomeTab' });
      }
    } catch (err: any) {
      console.error('[AvailabilitySetup] save error:', err);
      Alert.alert('Save Error', 'Could not save schedule to server. Check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Schedule & Availability"
        subtitle={isOnboarding ? 'Step 5 of 5 • Final Setup' : 'Configure work hours & breaks'}
        showBack
        onBack={() => safeGoBack(navigation, 'MainTabs', { screen: 'HomeTab' })}
      />

      {isOnboarding ? (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability Online / Offline Card */}
        <PremiumCard
          style={[styles.statusCard, isOnline && styles.statusCardOnline]}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.pulseIndicator,
                { backgroundColor: isOnline ? colors.onlineGreen : colors.offlineGray },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {isOnline ? 'Online & Available' : 'Offline Mode'}
              </Text>
              <Text style={styles.statusDesc}>
                {isOnline
                  ? 'Accepting instant dispatches & bookings.'
                  : 'Turn switch on to start receiving requests.'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: colors.borderDark, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </PremiumCard>

        {/* 1. Working Days */}
        <PremiumCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Weekly Working Calendar</Text>
          </View>
          <Text style={styles.cardSub}>
            Select the days of the week you are available for work:
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
        </PremiumCard>

        {/* 2. Working Hours */}
        <PremiumCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Daily Working Hours</Text>
          </View>
          <Text style={styles.cardSub}>
            Customer bookings will only be scheduled inside this shift window:
          </Text>

          <View style={styles.timeRangeBox}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Shift Start</Text>
              <View style={styles.timeSelectPill}>
                <Ionicons name="sunny-outline" size={16} color={colors.primary} />
                <Text style={styles.timeSelectText}>{startHour}</Text>
              </View>
            </View>

            <View style={styles.timeArrow}>
              <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
            </View>

            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Shift End</Text>
              <View style={styles.timeSelectPill}>
                <Ionicons name="moon-outline" size={16} color={colors.primary} />
                <Text style={styles.timeSelectText}>{endHour}</Text>
              </View>
            </View>
          </View>

          {/* Quick Shift Presets */}
          <Text style={styles.quickSlotLabel}>Quick Shift Presets:</Text>
          <View style={styles.presetRow}>
            {[
              { label: 'Standard (8 AM - 8 PM)', start: '08:00 AM', end: '08:00 PM' },
              { label: 'Morning (7 AM - 3 PM)', start: '07:00 AM', end: '03:00 PM' },
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
        </PremiumCard>

        {/* 3. Daily Break Times */}
        <PremiumCard style={styles.card}>
          <View style={styles.headerBetween}>
            <View style={styles.cardHeader}>
              <Ionicons name="cafe-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Daily Break / Lunch Time</Text>
            </View>
            <Switch
              value={hasBreak}
              onValueChange={setHasBreak}
              trackColor={{ false: colors.borderDark, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.cardSub}>
            Slots within your break time are automatically hidden from customer calendars.
          </Text>

          {hasBreak ? (
            <>
              <View style={styles.timeRangeBox}>
                <View style={styles.timePickerCol}>
                  <Text style={styles.timePickerLabel}>Break Start</Text>
                  <View style={styles.timeSelectPill}>
                    <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
                    <Text style={styles.timeSelectText}>{breakStartHour}</Text>
                  </View>
                </View>

                <View style={styles.timeArrow}>
                  <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                </View>

                <View style={styles.timePickerCol}>
                  <Text style={styles.timePickerLabel}>Break End</Text>
                  <View style={styles.timeSelectPill}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={styles.timeSelectText}>{breakEndHour}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.quickSlotLabel}>Break Presets:</Text>
              <View style={styles.presetRow}>
                {[
                  { label: 'Lunch: 1:00 PM – 2:00 PM', start: '01:00 PM', end: '02:00 PM' },
                  { label: 'Late Lunch: 1:30 PM – 2:30 PM', start: '01:30 PM', end: '02:30 PM' },
                  { label: 'Afternoon: 2:00 PM – 3:00 PM', start: '02:00 PM', end: '03:00 PM' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => {
                      setBreakStartHour(preset.start);
                      setBreakEndHour(preset.end);
                    }}
                    style={[
                      styles.presetChip,
                      breakStartHour === preset.start &&
                        breakEndHour === preset.end &&
                        styles.presetChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        breakStartHour === preset.start &&
                          breakEndHour === preset.end &&
                          styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
        </PremiumCard>

        {/* 4. Block Specific Dates */}
        <PremiumCard style={styles.card}>
          <View style={styles.headerBetween}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Block Specific Dates</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setQuickTimeOff(1, 1);
                setIsTimeOffModalVisible(true);
              }}
              style={styles.addTimeOffBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.addTimeOffText}>Block Date</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>
            Take planned leaves or vacations so no bookings are dispatched to you:
          </Text>

          {timeOffList && timeOffList.length > 0 ? (
            timeOffList.map((item) => (
              <View key={item.timeOffId} style={styles.timeOffItem}>
                <View style={styles.timeOffLeft}>
                  <View style={styles.timeOffIcon}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.timeOffDates}>
                      {item.startDate} {item.startDate !== item.endDate ? `to ${item.endDate}` : ''}
                    </Text>
                    <Text style={styles.timeOffReason}>
                      {item.reason || 'Blocked leave / personal day'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteTimeOff(
                      item.timeOffId,
                      `${item.startDate} to ${item.endDate}`
                    )
                  }
                  style={styles.deleteTimeOffBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noTimeOffBox}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.noTimeOffText}>
                No upcoming leaves blocked. You are available on your active working days.
              </Text>
            </View>
          )}
        </PremiumCard>

        {/* 5. Service Areas & Operating Pincodes */}
        <PremiumCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Service Areas & Operating Pincodes</Text>
          </View>
          <Text style={styles.cardSub}>
            Bookings created in these postal pincodes will match and dispatch to your account:
          </Text>

          {/* Active Pincodes Badges */}
          <View style={styles.pincodesGrid}>
            {pincodesList.map((code) => (
              <View key={code} style={styles.pincodeBadge}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={styles.pincodeText}>{code}</Text>
                <TouchableOpacity
                  onPress={() => handleRemovePincode(code)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.pincodeRemoveBtn}
                >
                  <Ionicons name="close" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Pincode Input */}
          <View style={styles.addPincodeRow}>
            <TextInput
              style={styles.pincodeInput}
              value={newPincode}
              onChangeText={(text) => {
                setNewPincode(text);
                if (pincodeError) setPincodeError('');
              }}
              placeholder="Enter 6-digit Pincode (e.g. 500032)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.addPincodeBtn}
              onPress={() => handleAddPincode()}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addPincodeBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {pincodeError ? <Text style={styles.pincodeErrorText}>{pincodeError}</Text> : null}

          {/* Quick Add Suggestions */}
          <Text style={styles.quickSlotLabel}>Suggested Areas (Hyderabad):</Text>
          <View style={styles.presetRow}>
            {[
              { code: '500032', name: 'Gachibowli' },
              { code: '500081', name: 'Hitec City' },
              { code: '500084', name: 'Kondapur' },
              { code: '500034', name: 'Banjara Hills' },
              { code: '500104', name: 'SR Nagar' },
            ].map((item) => {
              const alreadyAdded = pincodesList.includes(item.code);
              return (
                <TouchableOpacity
                  key={item.code}
                  disabled={alreadyAdded}
                  onPress={() => handleAddPincode(item.code)}
                  style={[
                    styles.presetChip,
                    alreadyAdded && { opacity: 0.5, backgroundColor: colors.background },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetText, alreadyAdded && { color: colors.textSecondary }]}>
                    {item.code} ({item.name}){alreadyAdded ? ' ✓' : ' +'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </PremiumCard>
      </ScrollView>

      {/* Modal for adding blocked dates */}
      <Modal
        visible={isTimeOffModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTimeOffModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Block Off Dates</Text>
              <TouchableOpacity onPress={() => setIsTimeOffModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select dates to mark unavailable in customer search and reservations:
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={timeOffStartDate}
                onChangeText={setTimeOffStartDate}
                placeholder="2026-11-02"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={timeOffEndDate}
                onChangeText={setTimeOffEndDate}
                placeholder="2026-11-03"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.quickDateShortcuts}>
              <TouchableOpacity
                onPress={() => setQuickTimeOff(1, 1)}
                style={styles.quickDatePill}
              >
                <Text style={styles.quickDateText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuickTimeOff(1, 2)}
                style={styles.quickDatePill}
              >
                <Text style={styles.quickDateText}>Next 2 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuickTimeOff(3, 3)}
                style={styles.quickDatePill}
              >
                <Text style={styles.quickDateText}>3-Day Weekend</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={timeOffReason}
                onChangeText={setTimeOffReason}
                placeholder="e.g. Personal vacation, Equipment maintenance"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.modalActions}>
              <SecondaryButton
                title="Cancel"
                size="md"
                onPress={() => setIsTimeOffModalVisible(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Confirm Block"
                size="md"
                onPress={handleAddTimeOff}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <PrimaryButton
          title={
            isSaving
              ? 'Saving Schedule...'
              : isOnboarding
              ? 'Complete Setup & Open Dashboard'
              : 'Save Availability & Hours'
          }
          size="lg"
          fullWidth
          onPress={handleFinish}
          disabled={isSaving}
          loading={isSaving}
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusCardOnline: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysSelectedSummary: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  timeRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  timePickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  timeSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeArrow: {
    paddingHorizontal: spacing.sm,
  },
  quickSlotLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  presetRow: {
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  presetTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  addTimeOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  addTimeOffText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeOffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  timeOffLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeOffIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  timeOffDates: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeOffReason: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  deleteTimeOffBtn: {
    padding: 6,
  },
  noTimeOffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  noTimeOffText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
  },
  quickDateShortcuts: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quickDatePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pincodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pincodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  pincodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pincodeRemoveBtn: {
    marginLeft: 2,
    padding: 2,
  },
  addPincodeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pincodeInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.textPrimary,
  },
  addPincodeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPincodeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pincodeErrorText: {
    fontSize: 11,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default AvailabilitySetupScreen;
