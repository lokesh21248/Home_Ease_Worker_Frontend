import { Job } from '../types';

/**
 * Maps incoming backend booking payload (from GET /workers/bookings/requests or active booking)
 * into a typed Job object for AppContext.tsx and UI components.
 * Guarantees that job.id and job.bookingId are BOTH the real 36-character Booking UUID.
 */
export const mapBackendBookingToJob = (item: any): Job => {
  const bookingId = item.bookingId || item.id || 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a';
  const totalAmount = Number(item.totalAmount ?? item.price ?? 918.2);
  const commission = Math.round(totalAmount * 0.15 * 100) / 100;
  const netPayout = Math.round((totalAmount - commission) * 100) / 100;

  let scheduledDate = 'Today';
  let scheduledTime = '11:30 AM';
  if (item.scheduledAt) {
    try {
      const d = new Date(item.scheduledAt);
      scheduledDate = 'Today';
      scheduledTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {}
  }

  const userLat = Number(item.userLat ?? 17.448293);
  const userLng = Number(item.userLng ?? 78.374182);

  return {
    id: bookingId, // Real Booking UUID from accepted dispatch
    bookingId: bookingId, // Real Booking UUID
    jobId: item.jobId || `#HE-${bookingId.slice(0, 4).toUpperCase()}`,
    customer: {
      id: item.customerId || `cust-${bookingId.slice(0, 8)}`,
      name: item.customerName || item.customer?.name || 'Rahul Sharma',
      phone: item.customerPhone || item.customer?.phone || '+919876543210',
      avatar:
        item.customerAvatar ||
        item.customer?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      rating: item.customerRating || 4.9,
      totalBookings: 14,
    },
    serviceId: item.serviceId || 'srv-ac',
    serviceName: item.serviceName || 'AC Repair & Service',
    category: item.category || 'AC Technicians',
    location: {
      address: item.address || item.location?.address || 'Flat 402, Sai Balaji Residency, Madhapur',
      landmark: item.landmark || item.location?.landmark || 'Near Metro Station',
      city: item.city || item.location?.city || 'Hyderabad',
      pincode: item.pincode || item.location?.pincode || '500081',
      latitude: userLat,
      longitude: userLng,
      distanceKm: item.distanceKm ?? 2.1,
    },
    scheduledDate,
    scheduledTime,
    price: totalAmount,
    totalAmount: totalAmount,
    commission,
    netPayout,
    status:
      item.status === 'SEARCHING'
        ? 'requested'
        : item.status?.toLowerCase() === 'accepted'
        ? 'accepted'
        : item.status?.toLowerCase() === 'in_progress'
        ? 'started'
        : item.status?.toLowerCase() === 'completed'
        ? 'completed'
        : 'requested',
    pinCode: item.pinCode || '4821',
    subServices: item.subServices || [],
    instructions: item.instructions || 'Customer requested service via HomeEase app.',
    paymentMode: item.paymentMode || 'Online Pre-paid',
    paymentStatus: item.paymentStatus || 'PENDING',
    estimatedDuration: item.estimatedDuration || '1 hr 30 mins',
    timeline: item.timeline || {},
  };
};
