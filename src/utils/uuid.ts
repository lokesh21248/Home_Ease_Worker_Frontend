/**
 * Utility functions for validating and resolving Booking and Worker UUIDs.
 */

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = (value?: string | null): boolean => {
  if (!value || typeof value !== 'string') return false;
  return UUID_V4_REGEX.test(value.trim());
};

/**
 * Resolves a given set of candidate identifiers to a valid 36-character backend Booking UUID.
 */
export const resolveBookingUuid = (
  ...candidates: (string | undefined | null)[]
): string => {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (isValidUuid(trimmed)) {
      return trimmed;
    }
  }
  return '';
};
