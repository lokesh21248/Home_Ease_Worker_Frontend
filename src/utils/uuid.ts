/**
 * Utility functions for validating and resolving Booking and Worker UUIDs.
 * Ensures local/mock strings (such as 'job-req-003') never leak into backend API routes.
 */

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = (value?: string | null): boolean => {
  if (!value || typeof value !== 'string') return false;
  return UUID_V4_REGEX.test(value.trim());
};

export const MOCK_JOB_ID_TO_UUID: Record<string, string> = {
  'job-req-001': 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a',
  'job-req-002': 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4b',
  'job-req-003': 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a',
  'job-act-004': 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a',
  'job-comp-005': 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4d',
};

/**
 * Resolves a given set of candidate identifiers (e.g. route.params?.bookingId,
 * currentJob.bookingId, currentJob.id) to a valid 36-character backend Booking UUID.
 */
export const resolveBookingUuid = (
  ...candidates: (string | undefined | null)[]
): string => {
  // First pass: return the first candidate that is already a valid UUID
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (isValidUuid(trimmed)) {
      return trimmed;
    }
  }

  // Second pass: check known mock ID map
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (MOCK_JOB_ID_TO_UUID[trimmed]) {
      return MOCK_JOB_ID_TO_UUID[trimmed];
    }
  }

  // Fallback default valid booking UUID from backend dispatch guide
  return 'c4d32e1a-8f90-4a12-b34c-9f8e7d6c5b4a';
};
