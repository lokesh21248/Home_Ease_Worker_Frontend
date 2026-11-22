// Unit tests for the partner GPS upload policy. Run: npm run test:tracking
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  classifyUploadResponse,
  nextBackoffMs,
  uploadIntervalMs,
  headingDelta,
  shouldUpload,
  LatestFixBuffer,
  MAX_RESEND_AGE_MS,
  distanceMeters,
  currentStepIndex,
} = require('../src/services/trackingPolicy.ts');

test('server responses map to the right loop action', () => {
  assert.equal(classifyUploadResponse(200), 'OK');
  assert.equal(classifyUploadResponse(null), 'RETRY');           // network down
  assert.equal(classifyUploadResponse(undefined), 'RETRY');
  assert.equal(classifyUploadResponse(503), 'RETRY');
  assert.equal(classifyUploadResponse(429), 'RETRY');            // rate limited
  assert.equal(classifyUploadResponse(401), 'AUTH_REQUIRED');    // never fall back to a bare user id
  assert.equal(classifyUploadResponse(403), 'STOP_TRACKING');    // not the assigned partner
  assert.equal(classifyUploadResponse(409), 'STOP_TRACKING');    // arrived
  assert.equal(classifyUploadResponse(410), 'STOP_TRACKING');    // tracking closed
  assert.equal(classifyUploadResponse(422), 'DROP_FRAME');       // fix rejected (accuracy / timestamp)
  assert.equal(classifyUploadResponse(400), 'DROP_FRAME');
});

test('backoff doubles from 2 s and caps at 30 s', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 10].map(nextBackoffMs), [2000, 4000, 8000, 16000, 30000, 30000, 30000]);
  assert.equal(nextBackoffMs(-3), 2000);
});

test('adaptive interval saves battery when stopped and speeds up near the customer', () => {
  assert.equal(uploadIntervalMs(0.2), 12_000);          // waiting at a signal
  assert.equal(uploadIntervalMs(2), 5_000);             // slow traffic
  assert.equal(uploadIntervalMs(12), 3_000);            // riding
  assert.equal(uploadIntervalMs(null), 5_000);          // unknown speed
  assert.equal(uploadIntervalMs(-1), 5_000);            // Android "unknown"
  assert.equal(uploadIntervalMs(0.2, 250), 2_000);      // almost there: arrival geofence needs fresh fixes
  assert.equal(uploadIntervalMs(12, 301), 3_000);
  // every cadence stays inside the server's 30 s live window
  for (const s of [null, 0, 0.3, 1, 5, 20]) assert.ok(uploadIntervalMs(s) < 30_000);
});

test('heading delta takes the short way round', () => {
  assert.equal(headingDelta(350, 10), 20);
  assert.equal(headingDelta(10, 350), 20);
  assert.equal(headingDelta(90, 270), 180);
  assert.equal(headingDelta(null, 10), 0);
});

test('uploads early on a big move or a turn, never faster than 1.5 s', () => {
  const base = { nowMs: 10_000, lastSentAtMs: 9_000, intervalMs: 3_000, movedMeters: 0, headingChangeDeg: 0 };
  assert.equal(shouldUpload({ ...base, lastSentAtMs: null }), true);
  assert.equal(shouldUpload(base), false);
  assert.equal(shouldUpload({ ...base, nowMs: 12_000 }), true);                       // interval elapsed
  assert.equal(shouldUpload({ ...base, movedMeters: 80 }), false);                    // only 1 s since last
  assert.equal(shouldUpload({ ...base, nowMs: 10_600, movedMeters: 80 }), true);      // 1.6 s + big move
  assert.equal(shouldUpload({ ...base, nowMs: 10_600, headingChangeDeg: 45 }), true); // turned a corner
});

test('offline buffer keeps only the newest fix and drops ones the server would reject as stale', () => {
  const buf = new LatestFixBuffer();
  const f = (ts) => ({ latitude: 17.44, longitude: 78.37, heading: 0, speed: 5, accuracy: 5, timestamp: ts });
  buf.offer(f(1_000));
  buf.offer(f(3_000));
  buf.offer(f(2_000)); // older: ignored
  assert.equal(buf.peek().timestamp, 3_000);
  assert.equal(buf.take(3_500).timestamp, 3_000);
  assert.equal(buf.take(3_600), null, 'taken once');
  buf.offer(f(1_000));
  assert.equal(buf.take(1_000 + MAX_RESEND_AGE_MS + 1), null, 'too old to resend');
});

test('distance helper is sane (Hitec City -> Madhapur ~1.5 km)', () => {
  const d = distanceMeters(17.4435, 78.3772, 17.4486, 78.3908);
  assert.ok(d > 1_400 && d < 1_700, String(d));
});

test('current step = the first provider step whose end is still ahead', () => {
  const steps = [
    { endLat: 17.4499, endLng: 78.3751 },
    { endLat: 17.4486, endLng: 78.3908 },
  ];
  assert.equal(currentStepIndex([], { latitude: 0, longitude: 0 }), -1);
  assert.equal(currentStepIndex(steps, { latitude: 17.4487, longitude: 78.3749 }), 0);   // heading north
  assert.equal(currentStepIndex(steps, { latitude: 17.4499, longitude: 78.3752 }), 1);   // at the turn: next step
  assert.equal(currentStepIndex(steps, { latitude: 17.4490, longitude: 78.3880 }), 1);
});

const { decodePolyline, distanceToRouteMeters, maneuverIcon } = require('../src/services/trackingPolicy.ts');

test('decodes the Google reference polyline into [lng, lat] pairs', () => {
  // Example from Google's encoded polyline algorithm documentation
  const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert.deepEqual(pts, [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
  assert.throws(() => decodePolyline('_p~iF~ps|U_'), /Malformed/);   // truncated: never a partial line
});

test('distance to the route detects leaving the road', () => {
  const route = [[78.3772, 17.4435], [78.3908, 17.4435]]; // ~1.4 km east-west line
  assert.ok(distanceToRouteMeters({ latitude: 17.4435, longitude: 78.38 }, route) < 1);
  const off = distanceToRouteMeters({ latitude: 17.4445, longitude: 78.38 }, route); // ~111 m north
  assert.ok(off > 100 && off < 120, String(off));
  assert.equal(distanceToRouteMeters({ latitude: 0, longitude: 0 }, []), Infinity);
});

test('manoeuvre codes map to matching icons, unknown codes never show a turn', () => {
  assert.equal(maneuverIcon('TURN_LEFT'), 'arrow-back');
  assert.equal(maneuverIcon('TURN_SLIGHT_RIGHT'), 'arrow-forward');
  assert.equal(maneuverIcon('UTURN_RIGHT'), 'refresh');
  assert.equal(maneuverIcon('ROUNDABOUT_LEFT'), 'refresh');
  assert.equal(maneuverIcon('DEPART'), 'navigate');
  assert.equal(maneuverIcon('STRAIGHT'), 'arrow-up');
  assert.equal(maneuverIcon(undefined), 'arrow-up');
});
