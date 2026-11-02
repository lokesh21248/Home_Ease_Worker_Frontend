import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadiusValue?: number;
  style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadiusValue = borderRadius.sm,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: borderRadiusValue,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.cardListContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.cardHeaderRow}>
            <LoadingSkeleton width={44} height={44} borderRadiusValue={borderRadius.md} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <LoadingSkeleton width="70%" height={16} />
              <LoadingSkeleton width="45%" height={12} style={{ marginTop: 6 }} />
            </View>
            <LoadingSkeleton width={60} height={24} borderRadiusValue={borderRadius.full} />
          </View>
          <LoadingSkeleton width="100%" height={12} style={{ marginTop: 14 }} />
          <LoadingSkeleton width="85%" height={12} style={{ marginTop: 6 }} />
          <View style={styles.cardFooterRow}>
            <LoadingSkeleton width="48%" height={38} borderRadiusValue={borderRadius.md} />
            <LoadingSkeleton width="48%" height={38} borderRadiusValue={borderRadius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F4',
  },
  cardListContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
});

export default LoadingSkeleton;

