import { Job } from '../types';

/**
 * Maps incoming backend booking payload (from GET /workers/bookings/requests, WebSocket push, or active booking)
 * into a typed Job object for AppContext.tsx and UI components.
 * Guarantees that job.id and job.bookingId are BOTH the real Booking UUID without dummy/mock fallbacks.
 */
export const mapBackendBookingToJob = (item: any): Job => {
  const bookingId = item.bookingId || item.id || '';
  const totalAmount = Number(item.totalAmount ?? item.price ?? 0);
  const commission = Math.round(totalAmount * 0.15 * 100) / 100;
  const netPayout = Math.max(0, Math.round((totalAmount - commission) * 100) / 100);

  let scheduledDate = 'Today';
  let scheduledTime = 'Immediate';
  if (item.scheduledAt) {
    try {
      const d = new Date(item.scheduledAt);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      if (isToday) {
        scheduledDate = 'Today';
      } else if (isTomorrow) {
        scheduledDate = 'Tomorrow';
      } else {
        scheduledDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }

      scheduledTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (item.scheduledEndAt) {
        try {
          const endD = new Date(item.scheduledEndAt);
          scheduledTime = `${scheduledTime} - ${endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch {}
      }
    } catch {}
  }

  const bookingType: 'INSTANT' | 'SCHEDULED' =
    item.bookingType === 'INSTANT' || item.bookingType === 'SCHEDULED'
      ? item.bookingType
      : item.estimatedArrivalMinutes ? 'INSTANT' : 'SCHEDULED';

  const userLat = Number(item.userLat ?? item.latitude ?? 17.448293);
  const userLng = Number(item.userLng ?? item.longitude ?? 78.374182);

  const rawAddress =
    item.customerAddress ||
    item.address ||
    item.recipientAddress ||
    item.location?.address ||
    'Customer Location';

  const statusRaw = (item.status || '').toUpperCase();
  let mappedStatus: Job['status'] = 'requested';
  if (statusRaw === 'SEARCHING' || statusRaw === 'REQUESTED' || statusRaw === 'PENDING') {
    mappedStatus = 'requested';
  } else if (statusRaw === 'ACCEPTED' || statusRaw === 'CONFIRMED') {
    mappedStatus = 'accepted';
  } else if (statusRaw === 'ON_THE_WAY' || statusRaw === 'TRAVELLING') {
    mappedStatus = 'travelling';
  } else if (statusRaw === 'ARRIVED') {
    mappedStatus = 'arrived';
  } else if (statusRaw === 'IN_PROGRESS' || statusRaw === 'STARTED') {
    mappedStatus = 'started';
  } else if (statusRaw === 'COMPLETED') {
    mappedStatus = 'completed';
  } else if (statusRaw === 'CANCELLED') {
    mappedStatus = 'cancelled';
  }

  return {
    id: bookingId,
    bookingId: bookingId,
    jobId: item.jobId || `#HE-${bookingId ? bookingId.slice(0, 4).toUpperCase() : 'REQ'}`,
    customer: {
      id: item.customerId || item.user?.userId || `cust-${bookingId.slice(0, 8)}`,
      name: item.customerName || item.customer?.name || item.recipientName || 'Customer',
      phone: item.customerPhone || item.customer?.phone || item.recipientPhone || '',
      avatar: item.customerAvatar || item.customer?.avatar || undefined,
      rating: typeof item.customerRating === 'number' ? item.customerRating : 5.0,
      totalBookings: item.totalBookings ?? 1,
    },
    serviceId: item.serviceId || 'srv-general',
    serviceName: item.serviceName || item.subServiceName || 'Home Service',
    category: item.category || item.serviceName || 'Home Services',
    location: {
      address: rawAddress,
      landmark: item.landmark || item.location?.landmark || '',
      city: item.city || item.location?.city || '',
      pincode: item.pincode || item.servicePincode || item.location?.pincode || '',
      latitude: userLat,
      longitude: userLng,
      distanceKm: typeof item.distanceKm === 'number' ? item.distanceKm : 0,
    },
    scheduledDate,
    scheduledTime,
    scheduledEndAt: item.scheduledEndAt,
    bookingType,
    estimatedArrivalMinutes: item.estimatedArrivalMinutes,
    price: totalAmount,
    totalAmount: totalAmount,
    commission,
    netPayout,
    status: mappedStatus,
    pinCode: undefined, // Never exposed to worker frontend; worker must obtain it manually from customer
    subServices: item.subServices || [],
    instructions: item.instructions || item.cancellationReason || '',
    paymentMode: item.paymentMethod || item.paymentMode || 'Online Payment',
    paymentStatus: item.paymentStatus || 'PENDING',
    estimatedDuration: item.estimatedDuration || '1 hr',
    timeline: item.timeline || {},
  };
};
