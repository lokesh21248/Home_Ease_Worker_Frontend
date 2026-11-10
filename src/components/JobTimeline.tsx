import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { JobStatus } from '../types';

export interface TimelineStep {
  key: JobStatus | string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_STEPS: TimelineStep[] = [
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { key: 'travelling', label: 'On Way', icon: 'bicycle' },
  { key: 'arrived', label: 'Arrived', icon: 'location' },
  { key: 'started', label: 'In Progress', icon: 'hammer' },
  { key: 'completed', label: 'Completed', icon: 'shield-checkmark' },
];

interface JobTimelineProps {
  currentStatus: JobStatus | string;
  steps?: TimelineStep[];
  style?: ViewStyle;
}

export const JobTimeline: React.FC<JobTimelineProps> = ({
  currentStatus,
  steps = DEFAULT_STEPS,
  style,
}) => {
  const normalized = (currentStatus || '').toLowerCase();

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
        return 0;
      case 'travelling':
      case 'on_the_way':
        return 1;
      case 'arrived':
        return 2;
      case 'started':
      case 'in_progress':
      case 'otp_verified':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const activeIdx = getStepIndex(normalized);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.stepsRow}>
        {steps.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isPending = idx > activeIdx;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.dot,
                    isDone && styles.dotDone,
                    isCurrent && styles.dotCurrent,
                    isPending && styles.dotPending,
                  ]}
                >
                  <Ionicons
                    name={isDone ? 'checkmark' : step.icon}
                    size={13}
                    color={
                      isDone || isCurrent
                        ? colors.textInverse
                        : colors.textMuted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.labelCurrent,
                    isDone && styles.labelDone,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>

              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    idx < activeIdx && styles.connectorActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    width: 58,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  dotPending: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginHorizontal: -4,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelCurrent: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  labelDone: {
    color: colors.textPrimary,
  },
});

export default JobTimeline;
