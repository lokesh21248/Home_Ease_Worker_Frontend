import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewItem } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

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
            size={14}
            color="#F59E0B"
            style={styles.starIcon}
          />
        ))}
        <Text style={styles.ratingScore}>{review.rating}.0</Text>
      </View>

      <Text style={styles.comment}>{review.comment}</Text>

      {review.workerReply ? (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Ionicons name="return-down-forward" size={13} color={colors.primary} />
            <Text style={styles.replyTitle}>Your Response</Text>
          </View>
          <Text style={styles.replyText}>{review.workerReply}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceTag: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  comment: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 2,
  },
  replyBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  replyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  replyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ReviewCard;
