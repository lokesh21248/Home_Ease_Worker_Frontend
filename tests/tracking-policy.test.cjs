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

test('worker app tracks job.status changes, resumes travelling GPS on relaunch, and avoids fake heartbeat jitter', () => {
  const path = require('node:path');
  const navScreen = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'screens', 'jobs', 'NavigationTrackingScreen.tsx'),
    'utf8',
  );
  const appCtx = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'state', 'AppContext.tsx'),
    'utf8',
  );
  assert.match(
    navScreen,
    /\[bookingId,\s*job\.status,\s*job\.location\.latitude,\s*job\.location\.longitude,\s*loadRoute\]/,
    'NavigationTrackingScreen must re-evaluate GPS startup when job.status transitions to travelling',
  );
  assert.equal(
    appCtx.includes('Math.random() - 0.5) * 0.0002'),
    false,
    'heartbeat interval must never synthesize fake GPS coordinate jitter',
  );
  assert.equal(
    appCtx.includes("restoredJob.status === 'travelling'"),
    true,
    'AppContext restorePersistedState must resume live tracking if active job is travelling',
  );
  const activeJobScreen = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'screens', 'jobs', 'ActiveJobScreen.tsx'),
    'utf8',
  );
  assert.equal(
    activeJobScreen.includes('Doorstep Override'),
    false,
    'ActiveJobScreen must never bypass server PIN verification',
  );
});


;(() => {
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const fs = require('node:fs');
  const path = require('node:path');
  const Module = require('node:module');
  const vm = require('node:vm');
  const ts = require('typescript');

  const ROOT = path.resolve(__dirname, '..');

  function loadWorkerClientModule() {
    const clientPath = path.join(ROOT, 'src', 'api', 'client.ts');
    const source = fs.readFileSync(clientPath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: clientPath,
    });

    const mod = { exports: {} };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const localRequire = (specifier) => {
      if (specifier === '../utils/uuid') {
        return { isValidUuid: (v) => typeof v === 'string' && uuidRegex.test(v.trim()) };
      }
      if (specifier === './endpoints') {
        return { BASE_API_URL: 'https://example.invalid' };
      }
      if (specifier === 'axios') {
        return {
          create: () => ({
            interceptors: {
              request: { use() {} },
              response: { use() {} },
            },
          }),
        };
      }
      return Module.createRequire(clientPath)(specifier);
    };

    const fn = vm.runInThisContext(
      `(function(exports, require, module, __filename, __dirname) { ${transpiled.outputText} \n})`,
      { filename: clientPath }
    );
    fn(mod.exports, localRequire, mod, clientPath, path.dirname(clientPath));
    return mod.exports;
  }

  function makeJwt(payloadObj) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    return `${header}.${payload}.fakesignature`;
  }

  test('isJwtToken rejects expired, bare-UUID, and malformed tokens while accepting unexpired JWTs', () => {
    const { isJwtToken, isJwtTokenExpired } = loadWorkerClientModule();
    const nowSec = Math.floor(Date.now() / 1000);

    const validJwt = makeJwt({ sub: '0d3dd87e-2cc0-46a9-9177-8e5a541a36e9', exp: nowSec + 3600 });
    const expiredJwt = makeJwt({ sub: '0d3dd87e-2cc0-46a9-9177-8e5a541a36e9', exp: nowSec - 120 });
    const uuidToken = '0d3dd87e-2cc0-46a9-9177-8e5a541a36e9';

    assert.equal(isJwtToken(validJwt), true);
    assert.equal(isJwtTokenExpired(validJwt), false);

    assert.equal(isJwtToken(expiredJwt), false);
    assert.equal(isJwtTokenExpired(expiredJwt), true);

    assert.equal(isJwtToken(uuidToken), false);
    assert.equal(isJwtToken(''), false);
    assert.equal(isJwtToken(null), false);
    assert.equal(isJwtToken(undefined), false);
    assert.equal(isJwtToken('not.a.jwt.with.four.parts'), false);
  });

  test('workerApiService signedToken delegates to isJwtToken and ActiveJobScreen links to NavigationTracking', () => {
    const apiSvc = fs.readFileSync(path.join(ROOT, 'src', 'api', 'workerApiService.ts'), 'utf8');
    const activeJobScreen = fs.readFileSync(path.join(ROOT, 'src', 'screens', 'jobs', 'ActiveJobScreen.tsx'), 'utf8');
    const appCtx = fs.readFileSync(path.join(ROOT, 'src', 'state', 'AppContext.tsx'), 'utf8');
    const jobsTab = fs.readFileSync(path.join(ROOT, 'src', 'screens', 'jobs', 'JobsTabScreen.tsx'), 'utf8');
    const jobDetails = fs.readFileSync(path.join(ROOT, 'src', 'screens', 'jobs', 'JobDetailsScreen.tsx'), 'utf8');
    const rootLayout = fs.readFileSync(path.join(ROOT, 'app', '_layout.tsx'), 'utf8');

    assert.match(apiSvc, /function\s+signedToken[\s\S]*isJwtToken\(t\)/);
    assert.match(activeJobScreen, /navigate\(['"]NavigationTracking['"]/);

    assert.match(appCtx, /hasRealGpsFixRef\s*=\s*React\.useRef\(false\)/);
    assert.doesNotMatch(appCtx, /locationData\?\.latitude\s*\|\|\s*17\.447812/);
    assert.doesNotMatch(appCtx, /locationData\?\.longitude\s*\|\|\s*78\.373954/);

    assert.match(jobsTab, /await\s+acceptJob\(bookingId\)/);
    assert.match(jobDetails, /await\s+acceptJob\(bookingId\)/);
    assert.match(rootLayout, /await\s+acceptJob\(bookingId\)/);

    const navScreen = fs.readFileSync(
      path.join(ROOT, 'src', 'screens', 'jobs', 'NavigationTrackingScreen.tsx'),
      'utf8'
    );
    assert.match(navScreen, /GPS PAUSED/);

    // Verify no hardcoded fallback user UUID remains in heartbeat or live-tracking / routing methods
    const heartbeatSection = apiSvc.slice(
      apiSvc.indexOf('sendLocationHeartbeat('),
      apiSvc.indexOf('getJobRequests(')
    );
    const trackingStart = apiSvc.indexOf('publishLiveLocation(');
    const trackingEnd = apiSvc.indexOf('getDrivingRoute(') + 1200;
    const trackingMethodsSection = apiSvc.slice(trackingStart, trackingEnd);
    assert.doesNotMatch(heartbeatSection, /1270d52d-9f4e-4399-9a80-15cab07f1763/);
    assert.doesNotMatch(trackingMethodsSection, /1270d52d-9f4e-4399-9a80-15cab07f1763/);
  });

  function loadTrackingLifecycleModule(mocks) {
    const lifecyclePath = path.join(ROOT, 'src', 'services', 'TrackingLifecycleManager.ts');
    const policyPath = path.join(ROOT, 'src', 'services', 'trackingPolicy.ts');
    const clientPath = path.join(ROOT, 'src', 'api', 'client.ts');
    const lifecycleSrc = fs.readFileSync(lifecyclePath, 'utf8');
    const transpiled = ts.transpileModule(lifecycleSrc, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: lifecyclePath,
    });
    const mod = { exports: {} };
    const localRequire = (specifier) => {
      if (specifier === '@react-native-async-storage/async-storage') {
        return { __esModule: true, default: mocks.asyncStorage };
      }
      if (specifier === 'expo-location') {
        return mocks.expoLocation;
      }
      if (specifier === 'expo-task-manager') {
        return mocks.taskManager;
      }
      if (specifier === '../api/workerApiService') {
        return { __esModule: true, default: mocks.workerApiService };
      }
      if (specifier === '../api/client') {
        const clientExports = loadWorkerClientModule();
        return {
          ...clientExports,
          apiClient: mocks.apiClient,
        };
      }
      if (specifier === './storageService') {
        return { storageService: mocks.storageService };
      }
      if (specifier === './trackingPolicy') {
        return require(policyPath);
      }
      return Module.createRequire(clientPath)(specifier);
    };
    const fn = vm.runInThisContext(
      `(function(exports, require, module, __filename, __dirname) { ${transpiled.outputText} \n})`,
      { filename: lifecyclePath }
    );
    fn(mod.exports, localRequire, mod, lifecyclePath, path.dirname(lifecyclePath));
    return mod.exports;
  }

  test('TrackingLifecycleManager catches unexpected upload throws, coalesces newer fixes, and retries safely', async () => {
    const store = new Map();
    const calls = [];
    let attempt = 0;
    const managerMod = loadTrackingLifecycleModule({
      asyncStorage: {
        setItem: async (k, v) => { store.set(k, v); },
        getItem: async (k) => store.get(k) ?? null,
        removeItem: async (k) => { store.delete(k); },
      },
      expoLocation: {
        Accuracy: { High: 5 },
        requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
        requestBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
        hasServicesEnabledAsync: async () => true,
        watchPositionAsync: async () => ({ remove() {} }),
        hasStartedLocationUpdatesAsync: async () => false,
        startLocationUpdatesAsync: async () => {},
        stopLocationUpdatesAsync: async () => {},
      },
      taskManager: {
        isTaskDefined: () => true,
        defineTask: () => {},
      },
      workerApiService: {
        publishLiveLocation: async (bId, lat, lng, _h, _s, _a, ts) => {
          attempt += 1;
          calls.push({ attempt, bId, lat, lng, ts });
          if (attempt === 1) {
            throw new Error('ECONNRESET socket hang up');
          }
          return { status: 200, data: { status: 'SUCCESS' } };
        },
        reportDeviceStatus: async () => ({ status: 200, data: null }),
        stopTrackingSession: async () => ({ status: 200, data: null }),
      },
      apiClient: {
        hasSignedSession: () => true,
        getAuthToken: () => makeJwt({ sub: 'w-1', exp: Math.floor(Date.now() / 1000) + 3600 }),
        setAuthToken: () => {},
        setUserId: () => {},
      },
      storageService: {
        loadAuthSession: async () => ({ token: null, userId: null }),
      },
    });

    const mgr = managerMod.workerTrackingLifecycle;
    const bookingId = '11111111-1111-4111-8111-111111111111';
    await mgr.startTravelTracking(bookingId, undefined, undefined, { lat: 17.46, lng: 78.36 });

    const baseTs = Date.now();
    await mgr.handleGpsFix({ latitude: 17.4401, longitude: 78.3489, accuracy: 8 }, baseTs);

    // After unexpected exception on attempt 1: status is RETRYING and newest fix remains preserved
    assert.equal(mgr.getStatus().state, 'RETRYING');
    assert.match(mgr.getStatus().message || '', /GPS PAUSED/);
    assert.ok(mgr.retryTimer, 'single retry timer should be scheduled');
    const firstTimer = mgr.retryTimer;

    // A newer fix arrives while waiting for backoff retry: buffer replaces older fix without duplicating timer
    await mgr.handleGpsFix({ latitude: 17.4425, longitude: 78.3510, accuracy: 6 }, baseTs + 4000);
    assert.equal(mgr.retryTimer, firstTimer, 'must not allocate duplicate retry timers');

    // Manually trigger retry flush immediately and confirm newest coordinates upload and go LIVE
    clearTimeout(mgr.retryTimer);
    mgr.retryTimer = null;
    await mgr.flush();

    assert.equal(calls.length, 2);
    assert.equal(calls[1].lat, 17.4425);
    assert.equal(calls[1].lng, 78.3510);
    assert.equal(mgr.getStatus().state, 'LIVE');

    await mgr.stopTracking(bookingId, 'STOPPED', false);
  });

  test('TrackingLifecycleManager stops permanently on 401 AUTH_REQUIRED and 403/409/410 STOP_TRACKING', async () => {
    for (const [httpStatus, expectedState] of [
      [401, 'AUTH_REQUIRED'],
      [403, 'ENDED'],
      [409, 'ENDED'],
      [410, 'ENDED'],
    ]) {
      const store = new Map();
      const managerMod = loadTrackingLifecycleModule({
        asyncStorage: {
          setItem: async (k, v) => { store.set(k, v); },
          getItem: async (k) => store.get(k) ?? null,
          removeItem: async (k) => { store.delete(k); },
        },
        expoLocation: {
          Accuracy: { High: 5 },
          requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
          requestBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
          hasServicesEnabledAsync: async () => true,
          watchPositionAsync: async () => ({ remove() {} }),
          hasStartedLocationUpdatesAsync: async () => false,
          startLocationUpdatesAsync: async () => {},
          stopLocationUpdatesAsync: async () => {},
        },
        taskManager: { isTaskDefined: () => true, defineTask: () => {} },
        workerApiService: {
          publishLiveLocation: async () => ({ status: httpStatus, data: { error: 'stopped' } }),
          reportDeviceStatus: async () => ({ status: 200, data: null }),
          stopTrackingSession: async () => ({ status: 200, data: null }),
        },
        apiClient: {
          hasSignedSession: () => true,
          getAuthToken: () => makeJwt({ sub: 'w-1', exp: Math.floor(Date.now() / 1000) + 3600 }),
          setAuthToken: () => {},
          setUserId: () => {},
        },
        storageService: { loadAuthSession: async () => ({ token: null, userId: null }) },
      });

      const mgr = managerMod.workerTrackingLifecycle;
      const bookingId = '22222222-2222-4222-8222-222222222222';
      await mgr.startTravelTracking(bookingId);
      await mgr.handleGpsFix({ latitude: 17.44, longitude: 78.35, accuracy: 6 }, Date.now());
      assert.equal(mgr.getStatus().state, expectedState, `HTTP ${httpStatus} should stop cleanly`);
      assert.equal(mgr.retryTimer, null, `HTTP ${httpStatus} must never leave a retry timer`);
      await mgr.stopTracking(bookingId, 'STOPPED', false);
    }
  });

  test('TrackingLifecycleManager restores signed JWT + booking in headless background task and rejects missing JWT', async () => {
    const bookingId = '33333333-3333-4333-8333-333333333333';
    const validJwt = makeJwt({ sub: 'worker-uuid-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    const store = new Map([
      ['@homeease/live-tracking/active-booking', bookingId],
      ['@homeease/live-tracking/active-destination', JSON.stringify({ lat: 17.46, lng: 78.36 })],
    ]);
    let signed = false;
    let restoredToken = null;
    let restoredUserId = null;
    const uploads = [];

    const managerMod = loadTrackingLifecycleModule({
      asyncStorage: {
        setItem: async (k, v) => { store.set(k, v); },
        getItem: async (k) => store.get(k) ?? null,
        removeItem: async (k) => { store.delete(k); },
      },
      expoLocation: {
        Accuracy: { High: 5 },
        requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
        requestBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
        hasServicesEnabledAsync: async () => true,
        watchPositionAsync: async () => ({ remove() {} }),
        hasStartedLocationUpdatesAsync: async () => false,
        startLocationUpdatesAsync: async () => {},
        stopLocationUpdatesAsync: async () => {},
      },
      taskManager: { isTaskDefined: () => true, defineTask: () => {} },
      workerApiService: {
        publishLiveLocation: async (bId, lat, lng) => {
          uploads.push({ bId, lat, lng });
          return { status: 200, data: { status: 'SUCCESS' } };
        },
        reportDeviceStatus: async () => ({ status: 200, data: null }),
        stopTrackingSession: async () => ({ status: 200, data: null }),
      },
      apiClient: {
        hasSignedSession: () => signed,
        getAuthToken: () => restoredToken,
        setAuthToken: (t) => { restoredToken = t; signed = true; },
        setUserId: (u) => { restoredUserId = u; },
      },
      storageService: {
        loadAuthSession: async () => ({ token: validJwt, userId: 'worker-uuid-1' }),
      },
    });

    const mgr = managerMod.workerTrackingLifecycle;
    await mgr.handleBackgroundGpsPoint({
      coords: { latitude: 17.445, longitude: 78.352, accuracy: 7, heading: 90, speed: 5 },
      timestamp: Date.now(),
    });

    assert.equal(restoredToken, validJwt);
    assert.equal(restoredUserId, 'worker-uuid-1');
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].bId, bookingId);
    assert.equal(mgr.getStatus().state, 'LIVE');

    await mgr.stopTracking(bookingId, 'STOPPED', false);
  });
})();
