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
  overallRating: 4.9,
  totalReviews: 148,
  starDistribution: [
    { stars: 5, count: 130, percentage: 88 },
    { stars: 4, count: 14, percentage: 9 },
    { stars: 3, count: 3, percentage: 2 },
    { stars: 2, count: 1, percentage: 1 },
    { stars: 1, count: 0, percentage: 0 },
  ],
  badges: [
    { id: 'b1', title: 'Top Rated Pro', icon: 'ribbon', count: 96 },
    { id: 'b2', title: 'Always Punctual', icon: 'time', count: 112 },
    { id: 'b3', title: 'Spotless Cleaning', icon: 'sparkles', count: 84 },
    { id: 'b4', title: 'Polite & Courteous', icon: 'heart', count: 104 },
  ],
  reviews: [
    {
      id: 'rev-01',
      customerName: 'Aarav Singhania',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      rating: 5,
      serviceName: 'Full Home Deep Cleaning',
      date: '27 Sep 2026',
      comment: 'Excellent service. Very professional, arrived 5 minutes early with all professional vacuum gear and left our living room shining.',
      workerReply: 'Thank you Aarav ji! Glad you loved the deep clean. Looking forward to serving again.',
    },
    {
      id: 'rev-02',
      customerName: 'Meenakshi Sundaram',
      customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
      rating: 5,
      serviceName: 'Bathroom Tap & Pipe Repair',
      date: '25 Sep 2026',
      comment: 'Quick and neat plumbing work. Found the concealed leak in 10 minutes that another plumber could not diagnose. Highly recommended!',
    },
    {
      id: 'rev-03',
      customerName: 'Karan Mehra',
      customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      rating: 5,
      serviceName: 'Kitchen Deep Sanitization',
      date: '21 Sep 2026',
      comment: 'Raj Kumar did a fantastic job with our greasy kitchen tiles and chimney filters. Polite behavior and wore gloves/shoe covers throughout.',
    },
    {
      id: 'rev-04',
      customerName: 'Sneha Patel',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      rating: 4,
      serviceName: 'Switchboard Repair',
      date: '17 Sep 2026',
      comment: 'Good work on the bedroom circuit breaker. Cleaned up the wire scraps after finishing. Very reliable.',
    },
    {
      id: 'rev-05',
      customerName: 'Rohan Gupta',
      customerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
      rating: 5,
      serviceName: 'AC Power Jet Service',
      date: '12 Sep 2026',
      comment: 'Super fast cooling restored! Measured the temperature drop in front of me before leaving. 5 stars all the way!',
    },
  ],
};
