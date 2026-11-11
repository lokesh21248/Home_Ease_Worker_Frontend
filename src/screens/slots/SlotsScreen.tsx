import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation as useNavigation } from '../../navigation/useAppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { useApp } from '../../state/AppContext';
import { WorkerScheduleSlot } from '../../types';
import { CustomHeader } from '../../components/CustomHeader';
import { SlotCalendar } from '../../components/SlotCalendar';
import { PremiumCard } from '../../components/PremiumCard';
import { SectionHeader } from '../../components/SectionHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCardList } from '../../components/LoadingSkeleton';
import { ScheduledBookingCard } from '../../components/ScheduledBookingCard';

type FilterType = 'all' | 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled';

export const SlotsScreen: React.FC = () => {
  const navigation = useNavigation();

  const {
    allScheduleSlots = [],
    fetchAllScheduleSlots,
    updateSlotStatus,
    setSlotAvailability,
    weeklySchedule,
    timeOffList,
    addWorkerTimeOff,
    deleteWorkerTimeOff,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Time-off Modal State
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  const [timeOffReason, setTimeOffReason] = useState('Personal Work');

  const loadData = async () => {
    try {
      setLoading(true);
      if (typeof fetchAllScheduleSlots === 'function') {
        await fetchAllScheduleSlots();
      }
    } catch (err) {
      console.warn('[SlotsScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter slots by status & selected date
  const filteredSlots = useMemo(() => {
    const list = Array.isArray(allScheduleSlots) ? allScheduleSlots : [];

    return list.filter((slot) => {
      const slotDate = slot.scheduledAt?.split('T')[0] || '';

      if (filter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return slotDate === todayStr;
      }
      if (filter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        return slotDate === tomorrowStr;
      }
      if (filter === 'upcoming') {
        const todayStr = new Date().toISOString().split('T')[0];
        return slotDate > todayStr;
      }
      if (filter === 'completed') {
        return slot.status?.toUpperCase() === 'COMPLETED';
      }
      if (filter === 'cancelled') {
        return slot.status?.toUpperCase() === 'CANCELLED';
      }
      // 'all' filter: filter by selected calendar date if clicked
      if (selectedDate && slotDate) {
        return slotDate === selectedDate;
      }
      return true;
    });
  }, [allScheduleSlots, filter, selectedDate]);

  const handleToggleSlot = (slot: WorkerScheduleSlot) => {
    const currentAvailable = slot.isAvailable ?? true;
    const nextState = !currentAvailable;

    if (slot.bookingId) {
      setSlotAvailability(slot.bookingId, nextState);
    }
  };

  const handleAddTimeOff = async () => {
    try {
      await addWorkerTimeOff(selectedDate, selectedDate, timeOffReason);
      setIsTimeOffModalOpen(false);
      Alert.alert('Time Off Saved', `Marked ${selectedDate} as unavailable.`);
    } catch (e: any) {
      Alert.alert('Notice', 'Unable to record time off.');
    }
  };

  const formatSlotTime = (timeStr?: string) => {
    if (!timeStr) return '09:00 AM - 10:00 AM';
    try {
      if (timeStr.includes('T')) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Schedule & Slots"
        subtitle={`${filteredSlots.length} slots for selected date`}
        rightAction={
          <TouchableOpacity
            style={styles.timeOffHeaderBtn}
            onPress={() => setIsTimeOffModalOpen(true)}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.timeOffHeaderBtnText}>Block Time</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Horizontal Calendar Strip */}
        <SlotCalendar
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setFilter('all');
          }}
        />

        {/* Working Hours Summary Card */}
        <PremiumCard style={styles.workingHoursCard}>
          <View style={styles.workingHoursRow}>
            <View style={styles.whIconWrap}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.whTextCol}>
              <Text style={styles.whTitle}>Regular Working Hours</Text>
              <Text style={styles.whSub}>Mon - Sat • 08:00 AM - 08:00 PM</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.whEditBtn}
              onPress={() => navigation.navigate('AvailabilitySetup', { isOnboarding: false })}
            >
              <Text style={styles.whEditText}>Edit</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </PremiumCard>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {(['all', 'today', 'tomorrow', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setFilter(tab)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slots List or Empty State */}
        <SectionHeader
          title="Daily Booking Slots"
          subtitle={`Showing slots on ${selectedDate}`}
          badge={filteredSlots.length}
        />

        {loading ? (
          <SkeletonCardList count={3} />
        ) : filteredSlots.length === 0 ? (
          <PremiumCard style={styles.emptyCardWrap}>
            <EmptyState
              iconName="calendar-outline"
              title="No Slots Scheduled"
              description={`There are no bookings or scheduled slots on this day. Tap below to adjust working hours.`}
              actionTitle="Configure Hours"
              onActionPress={() =>
                navigation.navigate('AvailabilitySetup', { isOnboarding: false })
              }
            />
          </PremiumCard>
        ) : (
          filteredSlots.map((slot, index) => {
            const isBooked = !!slot.bookingId;
            const isAvailable = slot.isAvailable ?? true;

            if (isBooked) {
              return (
                <ScheduledBookingCard
                  key={slot.bookingId || `slot-${index}`}
                  bookingId={slot.bookingId || ''}
                  serviceName={slot.serviceName || 'Home Service'}
                  customerName={slot.customerName}
                  scheduledTime={formatSlotTime(slot.scheduledAt)}
                  scheduledDate={slot.scheduledAt?.split('T')[0]}
                  locality={slot.address || 'Hyderabad'}
                  status={slot.status || 'SCHEDULED'}
                  style={{ marginBottom: spacing.md }}
                />
              );
            }

            return (
              <PremiumCard key={`slot-${index}`} style={styles.slotCard}>
                <View style={styles.slotTopRow}>
                  <View style={styles.timeTag}>
                    <Ionicons name="time-outline" size={15} color={colors.primary} />
                    <Text style={styles.timeText}>
                      {formatSlotTime(slot.scheduledAt)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isAvailable ? styles.statusPillAvailable : styles.statusPillBlocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAvailable ? styles.statusPillTextAvailable : styles.statusPillTextBlocked,
                      ]}
                    >
                      {isAvailable ? 'AVAILABLE' : 'BLOCKED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.availableSlotContent}>
                  <Text style={styles.openSlotText}>
                    {isAvailable
                      ? 'Open for customer instant or scheduled booking'
                      : 'Blocked - No bookings will be assigned in this hour'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.toggleSlotBtn, !isAvailable && styles.toggleSlotBtnEnable]}
                    onPress={() => handleToggleSlot(slot)}
                  >
                    <Text style={[styles.toggleSlotBtnText, !isAvailable && styles.toggleSlotBtnTextEnable]}>
                      {isAvailable ? 'Block Slot' : 'Make Available'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </PremiumCard>
            );
          })
        )}
      </ScrollView>

      {/* Block Time-off Modal */}
      <Modal visible={isTimeOffModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Block Time Off</Text>
              <TouchableOpacity onPress={() => setIsTimeOffModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDateInfo}>
              Date selected: <Text style={{ fontWeight: '700' }}>{selectedDate}</Text>
            </Text>

            <Text style={styles.inputLabel}>Reason for Time Off</Text>
            {(['Personal Work', 'Vehicle Maintenance', 'Emergency / Health', 'Day Off'] as const).map(
              (reason) => {
                const isSelected = timeOffReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    activeOpacity={0.8}
                    onPress={() => setTimeOffReason(reason)}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}

            <View style={styles.modalActionsRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setIsTimeOffModalOpen(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Confirm Block"
                onPress={handleAddTimeOff}
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  timeOffHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  timeOffHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  workingHoursCard: {
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whIconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  whTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  whSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  whEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  whEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyCardWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  slotCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusPillBooked: {
    backgroundColor: colors.primarySoft,
  },
  statusPillAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusPillBlocked: {
    backgroundColor: colors.surfaceAlt,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextBooked: {
    color: colors.primary,
  },
  statusPillTextAvailable: {
    color: '#059669',
  },
  statusPillTextBlocked: {
    color: colors.textSecondary,
  },
  slotDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  customerName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  availableSlotContent: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openSlotText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.md,
  },
  toggleSlotBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  toggleSlotBtnEnable: {
    backgroundColor: colors.primarySoft,
  },
  toggleSlotBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggleSlotBtnTextEnable: {
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 36, 58, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalDateInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  reasonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});

export default SlotsScreen;
