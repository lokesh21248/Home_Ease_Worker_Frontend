import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue...
  dayNumber: number; // 1..31
  isToday: boolean;
  slotsCount?: number;
}

interface SlotCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateString: string) => void;
  daysCount?: number;
}

export const SlotCalendar: React.FC<SlotCalendarProps> = ({
  selectedDate,
  onSelectDate,
  daysCount = 14,
}) => {
  const days: CalendarDay[] = useMemo(() => {
    const list: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const isToday = i === 0;

      list.push({
        dateString,
        dayName,
        dayNumber,
        isToday,
      });
    }

    return list;
  }, [daysCount]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((item) => {
          const isSelected = item.dateString === selectedDate;

          return (
            <TouchableOpacity
              key={item.dateString}
              activeOpacity={0.75}
              onPress={() => onSelectDate(item.dateString)}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
                item.isToday && !isSelected && styles.dayCardToday,
              ]}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                {item.dayNumber}
              </Text>
              {item.isToday ? (
                <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
              ) : (
                <View style={styles.todayDotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayCard: {
    width: 54,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCardToday: {
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
    opacity: 0.85,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  todayDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
});

export default SlotCalendar;

