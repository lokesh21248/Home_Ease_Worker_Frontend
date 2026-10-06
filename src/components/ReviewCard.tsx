import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewItem } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ReviewCardProps {
  review: ReviewItem;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Image
          source={{
            uri:
              review.customerAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <Text style={styles.serviceTag}>{review.serviceName}</Text>
        </View>
        <Text style={styles.dateText}>{review.date}</Text>
      </View>

      {/* Stars Row */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={colors.accent}
            style={styles.starIcon}
          />
        ))}
        <Text style={styles.ratingScore}>{review.rating}.0</Text>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      {review.workerReply && (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Ionicons name="return-down-forward" size={14} color={colors.primary} />
            <Text style={styles.replyTitle}>Your Response</Text>
          </View>
          <Text style={styles.replyText}>{review.workerReply}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
  serviceTag: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingScore: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  comment: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  replyBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  replyText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default ReviewCard;
