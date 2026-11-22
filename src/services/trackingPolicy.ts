/**
 * trackingPolicy.ts - pure, dependency-free rules for the partner's live GPS upload loop.
 *
 * Kept free of React Native / Expo imports so it is unit-tested with plain Node
 * (tests/tracking-policy.test.cjs) and behaves identically in the foreground watcher and the
 * background task.
 */

export type UploadOutcome =
  | 'OK'
  /** network failure / 5xx / 429: keep the newest fix and retry with backoff */
  | 'RETRY'
  /** 401: the signed session is gone; stop uploading and ask the partner to sign in again */
  | 'AUTH_REQUIRED'
  /** 403 / 409 / 410: not (or no longer) the assigned partner, or tracking ended (arrived/cancelled) */
  | 'STOP_TRACKING'
  /** 400 / 422: this particular fix was rejected (bad accuracy, stale timestamp...); drop it, keep tracking */
  | 'DROP_FRAME';

/** Maps an HTTP status (null = no response, i.e. network error) to what the upload loop must do. */
export function classifyUploadResponse(status: number | null | undefined): UploadOutcome {
  if (status === null || status === undefined || status === 0) return 'RETRY';
  if (status >= 200 && status < 300) return 'OK';
  if (status === 401) return 'AUTH_REQUIRED';
  if (status === 403 || status === 409 || status === 410) return 'STOP_TRACKING';
  if (status === 400 || status === 422) return 'DROP_FRAME';
  if (status === 429 || status >= 500) return 'RETRY';
  return 'DROP_FRAME';
}

/** Exponential backoff: 2 s, 4 s, 8 s, 16 s, then 30 s ceiling. Deterministic (no jitter) for testability. */
export function nextBackoffMs(attempt: number): number {
  const n = Math.max(0, Math.floor(attempt));
  return Math.min(30_000, 2_000 * 2 ** n);
}

/**
 * Adaptive upload interval (battery vs. freshness):
 *  - close to the customer (<= 300 m): every 2 s, so the arrival geofence and the customer's map react quickly
 *  - stationary (< 0.5 m/s, e.g. at a signal): every 12 s
 *  - slow (< 4 m/s, walking / heavy traffic): every 5 s
 *  - moving: every 3 s
 *  - unknown speed: every 5 s
 * The server's live window is 30 s, so even the slowest cadence keeps the customer's map "live".
 */
export function uploadIntervalMs(speedMps: number | null | undefined, distanceToDestinationM?: number | null): number {
  if (typeof distanceToDestinationM === 'number' && Number.isFinite(distanceToDestinationM) && distanceToDestinationM <= 300) {
    return 2_000;
  }
  if (typeof speedMps !== 'number' || !Number.isFinite(speedMps) || speedMps < 0) return 5_000;
  if (speedMps < 0.5) return 12_000;
  if (speedMps < 4) return 5_000;
  return 3_000;
}

/** Smallest heading change, in degrees, between two compass bearings. */
export function headingDelta(a: number | null | undefined, b: number | null | undefined): number {
  if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const d = Math.abs((((b - a) % 360) + 540) % 360 - 180);
  return d;
}

/**
 * Whether a new fix should be uploaded now. A big move (>= 50 m) or a turn (>= 30 deg) is sent early (but never
 * more often than every 1.5 s) so the customer's marker and the route follow corners promptly.
 */
export function shouldUpload(args: {
  nowMs: number;
  lastSentAtMs: number | null;
  intervalMs: number;
  movedMeters: number;
  headingChangeDeg: number;
}): boolean {
  const { nowMs, lastSentAtMs, intervalMs, movedMeters, headingChangeDeg } = args;
  if (lastSentAtMs === null) return true;
  const elapsed = nowMs - lastSentAtMs;
  if (elapsed >= intervalMs) return true;
  if (elapsed >= 1_500 && (movedMeters >= 50 || headingChangeDeg >= 30)) return true;
  return false;
}

export interface PendingFix {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

/** The server rejects fixes older than 120 s; anything older than this is never worth re-sending. */
export const MAX_RESEND_AGE_MS = 110_000;

/**
 * Offline buffer for the upload loop. Only the NEWEST unsent fix is kept: the customer needs the current position,
 * not a replay of where the partner was, and older fixes would be rejected as out-of-order anyway.
 */
export class LatestFixBuffer {
  private fix: PendingFix | null = null;

  offer(fix: PendingFix): void {
    if (!this.fix || fix.timestamp > this.fix.timestamp) this.fix = fix;
  }

  /** The pending fix if it is still young enough to be accepted by the server; otherwise discards it. */
  take(nowMs: number): PendingFix | null {
    const f = this.fix;
    this.fix = null;
    if (!f || nowMs - f.timestamp > MAX_RESEND_AGE_MS) return null;
    return f;
  }

  peek(): PendingFix | null {
    return this.fix;
  }

  clear(): void {
    this.fix = null;
  }
}

/** Haversine distance in metres. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Decodes a Google encoded polyline (precision 1e5) into GeoJSON order [lng, lat] pairs, the format
 * PartnerGoogleMapView expects. Throws on malformed input rather than drawing a partial line.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const out: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = (): number => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      if (index >= encoded.length) throw new Error('Malformed polyline');
      b = encoded.charCodeAt(index++) - 63;
      if (b < 0 || b > 63) throw new Error('Malformed polyline');
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    out.push([lng / 1e5, lat / 1e5]);
  }
  return out;
}

/** Shortest distance in metres from a point to a polyline given as [lng, lat] pairs (local planar approximation). */
export function distanceToRouteMeters(point: { latitude: number; longitude: number }, route: [number, number][]): number {
  if (route.length === 0) return Number.POSITIVE_INFINITY;
  if (route.length === 1) return distanceMeters(point.latitude, point.longitude, route[0][1], route[0][0]);
  const mPerDegLat = 111_195;
  const mPerDegLng = 111_195 * Math.cos((point.latitude * Math.PI) / 180);
  const px = 0;
  const py = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < route.length - 1; i++) {
    const ax = (route[i][0] - point.longitude) * mPerDegLng;
    const ay = (route[i][1] - point.latitude) * mPerDegLat;
    const bx = (route[i + 1][0] - point.longitude) * mPerDegLng;
    const by = (route[i + 1][1] - point.latitude) * mPerDegLat;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    best = Math.min(best, Math.hypot(cx - px, cy - py));
  }
  return best;
}

/** Ionicons glyph for a Google Routes manoeuvre code. Unknown codes get a neutral arrow, never a wrong turn. */
export function maneuverIcon(maneuver: string | null | undefined): string {
  const m = (maneuver || '').toUpperCase();
  if (m.includes('UTURN') || m.startsWith('ROUNDABOUT')) return 'refresh';
  if (m.includes('LEFT')) return 'arrow-back';
  if (m.includes('RIGHT')) return 'arrow-forward';
  if (m === 'DEPART') return 'navigate';
  return 'arrow-up';
}

/**
 * Index of the provider step the partner is currently on: the first step whose end point is still ahead.
 * Used to show the real next instruction from the Routes API (never a made-up one).
 */
export function currentStepIndex(
  steps: { endLat: number; endLng: number }[],
  position: { latitude: number; longitude: number },
  passedThresholdMeters = 25,
): number {
  if (!steps.length) return -1;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  steps.forEach((s, i) => {
    const d = distanceMeters(position.latitude, position.longitude, s.endLat, s.endLng);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  // standing on the end point of a step means that step is done: show the next one
  if (bestDist <= passedThresholdMeters && best < steps.length - 1) return best + 1;
  return best;
}
