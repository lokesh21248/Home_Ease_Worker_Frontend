import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated } = useApp();

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.topBadgeContainer}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>OFFICIAL SERVICE PARTNER APP</Text>
        </View>
      </View>

      <View style={styles.centerContent}>
        {/* App Logo Emblem */}
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <Ionicons name="construct-outline" size={44} color="#FFFFFF" />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.appName}>
          HomeEase <Text style={styles.workerAccent}>Partner</Text>
        </Text>

        {/* Tagline */}
        <View style={styles.taglineBox}>
          <Text style={styles.taglineMain}>Manage Bookings • Earn Daily</Text>
        </View>

        <Text style={styles.description}>
          The dedicated pro partner application for certified cleaners, electricians, plumbers, and home service specialists.
        </Text>
      </View>

      {/* Bottom CTA and trust badges */}
      <View style={styles.bottomContainer}>
        <PrimaryButton
          title="Get Started as Partner"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Login')}
          iconRight={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          style={styles.demoLink}
        >
          <Text style={styles.demoLinkText}>Explore Partner Dashboard (Demo Mode)</Text>
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="flash-outline" size={14} color={colors.primary} />
            <Text style={styles.trustText}>Direct IMPS</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
            <Text style={styles.trustText}>Verified Customers</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="star-outline" size={14} color={colors.primary} />
            <Text style={styles.trustText}>5-Star Network</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  topBadgeContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoOuterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  workerAccent: {
    color: colors.primary,
  },
  taglineBox: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  taglineMain: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  demoLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  demoLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xs,
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
});

export default SplashScreen;
