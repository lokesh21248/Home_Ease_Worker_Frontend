import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Check, Navigation, MapPin, Wrench, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { JobStatus } from '../types';

export interface TimelineStep {
  key: JobStatus | string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const DEFAULT_STEPS: TimelineStep[] = [
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'travelling', label: 'On Way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'started', label: 'In Progress', icon: Wrench },
  { key: 'completed', label: 'Completed', icon: ShieldCheck },
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
          const IconComp = isDone ? Check : step.icon;

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
                  <IconComp
                    size={12}
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
    borderWidth: 3,
    borderColor: colors.primarySoft,
  },
  dotPending: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  connectorActive: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelCurrent: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  labelDone: {
    color: colors.textPrimary,
  },
});
