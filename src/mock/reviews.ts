import { ReviewItem } from '../types';

export interface RatingOverview {
  overallRating: number;
  totalReviews: number;
  starDistribution: {
    stars: number;
    count: number;
    percentage: number;
  }[];
  badges: {
    id: string;
    title: string;
    icon: string;
    count: number;
  }[];
  reviews: ReviewItem[];
}

export const mockReviewsData: RatingOverview = {
  overallRating: 5.0,
  totalReviews: 0,
  starDistribution: [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ],
  badges: [],
  reviews: [],
};
