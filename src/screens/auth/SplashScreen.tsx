import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Button from '../../components/Button';
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.topBadgeContainer}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>OFFICIAL PARTNER PLATFORM</Text>
        </View>
      </View>

      <View style={styles.centerContent}>
        {/* App Logo Emblem */}
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <Ionicons name="construct" size={48} color={colors.surface} />
          </View>
          <View style={styles.sparkleBadge}>
            <Ionicons name="flash" size={16} color={colors.accent} />
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.appName}>
          HomeEase <Text style={styles.workerAccent}>Worker</Text>
        </Text>

        {/* Tagline */}
        <View style={styles.taglineBox}>
          <Text style={styles.taglineMain}>Manage Services</Text>
          <Text style={styles.taglineSub}>Grow Your Earnings</Text>
        </View>

        <Text style={styles.description}>
          The all-in-one professional app for cleaners, plumbers, electricians, AC technicians, and home care experts.
        </Text>
      </View>

      {/* Bottom CTA and trust badges */}
      <View style={styles.bottomContainer}>
        <Button
          title="Get Started as Partner"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Login')}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
          iconPosition="right"
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
            <Ionicons name="flash" size={14} color={colors.success} />
            <Text style={styles.trustText}>Instant Payouts</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.trustText}>Verified Leads</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={styles.trustText}>Top Incentives</Text>
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
    paddingHorizontal: spacing.xl,
  },
  topBadgeContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoOuterCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    position: 'relative',
    ...shadows.md,
  },
  logoInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.sm,
  },
  appName: {
    ...typography.h1,
    fontSize: 32,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  workerAccent: {
    color: colors.primary,
  },
  taglineBox: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  taglineMain: {
    ...typography.h2,
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  taglineSub: {
    ...typography.h2,
    fontSize: 20,
    color: colors.success,
    fontWeight: '800',
    marginTop: 2,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  bottomContainer: {
    paddingBottom: spacing.xxl,
    width: '100%',
  },
  demoLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  demoLinkText: {
    ...typography.subtitle2,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
});

export default SplashScreen;
