import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Badge, BadgeVariant } from './Badge';
import { JobStatus } from '../types';

interface BookingStatusBadgeProps {
  status: JobStatus | string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'sm',
  style,
  textStyle,
}) => {
  const normalized = (status || '').toUpperCase();

  let label = normalized.replace(/_/g, ' ');
  let variant: BadgeVariant = 'neutral';

  switch (normalized) {
    case 'ACCEPTED':
    case 'CONFIRMED':
      label = 'Accepted';
      variant = 'primary';
      break;
    case 'TRAVELLING':
    case 'ON_THE_WAY':
      label = 'On the Way';
      variant = 'info';
      break;
    case 'ARRIVED':
      label = 'Arrived';
      variant = 'warning';
      break;
    case 'STARTED':
    case 'IN_PROGRESS':
      label = 'In Progress';
      variant = 'warning';
      break;
    case 'COMPLETED':
      label = 'Completed';
      variant = 'success';
      break;
    case 'CANCELLED':
    case 'REJECTED':
      label = normalized === 'REJECTED' ? 'Declined' : 'Cancelled';
      variant = 'danger';
      break;
    case 'PENDING':
    case 'REQUESTED':
    case 'SEARCHING':
      label = 'New Request';
      variant = 'primary';
      break;
    default:
      label = normalized;
      variant = 'neutral';
  }

  return (
    <Badge
      label={label}
      variant={variant}
      size={size}
      style={style}
      textStyle={textStyle}
    />
  );
};

export default BookingStatusBadge;
