import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Header from '../../components/Header';
import ReviewCard from '../../components/ReviewCard';
import { useApp } from '../../state/AppContext';

export const ReviewsRatingsScreen: React.FC = () => {
  const { reviewsOverview } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Ratings & Reviews"
        subtitle={`Based on ${reviewsOverview.totalReviews} verified service orders`}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rating Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.scoreCol}>
            <Text style={styles.largeScore}>{reviewsOverview.overallRating}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={16} color={colors.accent} />
              ))}
            </View>
            <Text style={styles.totalReviewsText}>
              {reviewsOverview.totalReviews} total ratings
            </Text>
          </View>

          <View style={styles.heroDivider} />

          {/* Star Distribution Progress Bars */}
          <View style={styles.distributionCol}>
            {reviewsOverview.starDistribution.map((item) => (
              <View key={item.stars} style={styles.distRow}>
                <Text style={styles.starNum}>{item.stars}★</Text>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${item.percentage}%` }]} />
                </View>
                <Text style={styles.starPercent}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Worker Recognition Badges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionHeader}>Customer Recognition Badges</Text>
          <View style={styles.badgeGrid}>
            {reviewsOverview.badges.map((b) => (
              <View key={b.id} style={styles.badgeCard}>
                <View style={styles.badgeIconCircle}>
                  <Ionicons name={b.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.badgeTitle}>{b.title}</Text>
                <Text style={styles.badgeCount}>{b.count} customers tagged this</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Customer Reviews List */}
        <View style={styles.reviewsListHeader}>
          <Text style={styles.sectionHeader}>Customer Feedback</Text>
          <Text style={styles.latestCount}>Showing latest {reviewsOverview.reviews.length}</Text>
        </View>

        {reviewsOverview.reviews.map((rev) => (
          <ReviewCard key={rev.id} review={rev} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  scoreCol: {
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  largeScore: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 52,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
    gap: 2,
  },
  totalReviewsText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  heroDivider: {
    width: 1,
    height: 90,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  distributionCol: {
    flex: 1,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  starNum: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 22,
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    flex: 1,
    height: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    marginHorizontal: spacing.xs + 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  starPercent: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    width: 28,
    textAlign: 'right',
  },
  badgesSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  badgeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  badgeCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  reviewsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  latestCount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default ReviewsRatingsScreen;
