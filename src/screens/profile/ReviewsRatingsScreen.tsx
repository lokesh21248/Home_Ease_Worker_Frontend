import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CustomHeader } from '../../components/CustomHeader';
import { PremiumCard } from '../../components/PremiumCard';
import { ReviewCard } from '../../components/ReviewCard';
import { useApp } from '../../state/AppContext';

export const ReviewsRatingsScreen: React.FC = () => {
  const { reviewsOverview } = useApp();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader
        title="Ratings & Reviews"
        subtitle={`Based on ${reviewsOverview.totalReviews} verified service orders`}
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Hero Card */}
        <PremiumCard style={styles.heroCard}>
          <View style={styles.scoreCol}>
            <Text style={styles.largeScore}>{reviewsOverview.overallRating}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={15} color="#F59E0B" />
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
        </PremiumCard>

        {/* Customer Recognition Badges */}
        {reviewsOverview.badges.length > 0 ? (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionHeader}>Customer Recognition Badges</Text>
            <View style={styles.badgeGrid}>
              {reviewsOverview.badges.map((b) => (
                <PremiumCard key={b.id} style={styles.badgeCard} padding={spacing.md}>
                  <View style={styles.badgeIconCircle}>
                    <Ionicons name={b.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                  <Text style={styles.badgeCount}>{b.count} customers</Text>
                </PremiumCard>
              ))}
            </View>
          </View>
        ) : null}

        {/* Customer Reviews Section */}
        <Text style={styles.sectionHeader}>Customer Feedback</Text>
        {reviewsOverview.reviews.length > 0 ? (
          reviewsOverview.reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))
        ) : (
          <Text style={styles.emptyReviewsText}>No customer reviews received yet.</Text>
        )}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreCol: {
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  largeScore: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heroDivider: {
    width: 1,
    height: 70,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  distributionCol: {
    flex: 1,
    gap: 4,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starNum: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 20,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  starPercent: {
    fontSize: 10,
    color: colors.textSecondary,
    width: 26,
    textAlign: 'right',
  },
  badgesSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgeCard: {
    flex: 1,
    alignItems: 'center',
  },
  badgeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyReviewsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default ReviewsRatingsScreen;
