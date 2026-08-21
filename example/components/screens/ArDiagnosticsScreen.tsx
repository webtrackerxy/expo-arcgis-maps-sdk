/**
 * AR Diagnostics & Sensors — a debug screen for augmented reality.
 *
 * Surfaces the data you need to understand why an AR session is (or isn't)
 * tracking, on both iOS and Android:
 *
 * - AR: {@link isArSupported} result, live tracking state, and the AR camera's
 *   geographic pose (polled from the mounted world-scale view).
 * - Device sensors (via `expo-sensors`): accelerometer, gyroscope, magnetometer,
 *   and fused device-motion (orientation + rotation rate), each with its live
 *   values and measured update rate in Hz.
 *
 * The sensor rate readouts are the practical tell for AR trouble: ARCore/ARKit
 * need a healthy, high-frequency sensor + camera feed to converge. A low rate
 * (e.g. in a throttled debug build) explains a session stuck "Initializing".
 */
import {
  ArcgisArView,
  isArSupported,
  type ArcgisArViewRef,
  type ArSupport,
  type ArTrackingReason,
  type ArTrackingState,
} from 'expo-arcgis-maps-sdk';
import { Accelerometer, DeviceMotion, Gyroscope, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** The AR camera pose returned by `getCurrentCamera`. */
type Pose = {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  pitch: number;
  roll: number;
};

/** A three-axis sensor reading plus its measured update rate. */
type TriAxis = { x: number; y: number; z: number };

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Subscribe to a three-axis `expo-sensors` sensor. Counts samples at the native
 * rate to report true Hz, but throttles React state updates so a 50–100 Hz
 * sensor doesn't thrash rendering.
 */
function useTriAxisSensor(
  sensor: typeof Accelerometer | typeof Gyroscope | typeof Magnetometer,
  targetIntervalMs = 16
) {
  const [data, setData] = useState<TriAxis>({ x: 0, y: 0, z: 0 });
  const [hz, setHz] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);
  const times = useRef<number[]>([]);
  const lastRender = useRef(0);

  useEffect(() => {
    let active = true;
    sensor.isAvailableAsync().then((a) => active && setAvailable(a));
    // `setUpdateInterval` only throttles delivery; the underlying hardware rate is
    // SENSOR_DELAY_FASTEST vs NORMAL based on the HIGH_SAMPLING_RATE_SENSORS
    // permission (declared in the manifest). Without it, sensors with no other
    // fast consumer (e.g. the gyroscope) are capped near 5 Hz.
    sensor.setUpdateInterval(targetIntervalMs);
    const sub = sensor.addListener((reading) => {
      const now = Date.now();
      const t = times.current;
      t.push(now);
      while (t.length && now - t[0] > 1000) t.shift();
      // Throttle UI updates to ~4 Hz; Hz count stays accurate via `times`.
      if (now - lastRender.current > 250) {
        lastRender.current = now;
        setData(reading);
        setHz(t.length);
      }
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [sensor, targetIntervalMs]);

  return { data, hz, available };
}

/** Subscribe to fused device motion (orientation + rotation rate). */
function useDeviceMotion(targetIntervalMs = 16) {
  const [rotationDeg, setRotationDeg] = useState<TriAxis>({ x: 0, y: 0, z: 0 });
  const [rotationRate, setRotationRate] = useState<TriAxis>({ x: 0, y: 0, z: 0 });
  const [hz, setHz] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);
  const times = useRef<number[]>([]);
  const lastRender = useRef(0);

  useEffect(() => {
    let active = true;
    DeviceMotion.isAvailableAsync().then((a) => active && setAvailable(a));
    DeviceMotion.setUpdateInterval(targetIntervalMs);
    const sub = DeviceMotion.addListener((motion) => {
      const now = Date.now();
      const t = times.current;
      t.push(now);
      while (t.length && now - t[0] > 1000) t.shift();
      if (now - lastRender.current > 250) {
        lastRender.current = now;
        const r = motion.rotation;
        if (r) {
          setRotationDeg({ x: r.beta * RAD_TO_DEG, y: r.gamma * RAD_TO_DEG, z: r.alpha * RAD_TO_DEG });
        }
        const rr = motion.rotationRate;
        if (rr) setRotationRate({ x: rr.beta, y: rr.gamma, z: rr.alpha });
        setHz(t.length);
      }
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [targetIntervalMs]);

  return { rotationDeg, rotationRate, hz, available };
}

// --- 3D orientation cube (pure RN `matrix` transforms — no GL, no rebuild) ---

/** 4×4 column-major matrix (same layout as CSS `matrix3d` / RN `transform.matrix`). */
type Mat = number[];

/** Multiply two column-major 4×4 matrices: returns a·b. */
function matMul(a: Mat, b: Mat): Mat {
  const out = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

const rotX = (rad: number): Mat => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};
const rotY = (rad: number): Mat => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};
const rotZ = (rad: number): Mat => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
/** Translate along Z (RN has no `translateZ`, so it goes through the matrix). */
const transZ = (t: number): Mat => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, t, 1];
/** Perspective projection at viewer distance `d`. */
const persp = (d: number): Mat => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1];

/** Half the cube edge — each face is pushed this far out along its local Z. */
const CUBE_HALF = 46;

/** The six faces: a base rotation that orients the panel, plus a label + color. */
const CUBE_FACES = [
  { label: 'N', color: '#b3261e', rot: rotY(0) }, // front → North reference
  { label: 'E', color: '#37485a', rot: rotY(Math.PI / 2) },
  { label: 'S', color: '#2c3a49', rot: rotY(Math.PI) },
  { label: 'W', color: '#37485a', rot: rotY(-Math.PI / 2) },
  { label: 'UP', color: '#2f7d6e', rot: rotX(Math.PI / 2) },
  { label: 'DN', color: '#1f2937', rot: rotX(-Math.PI / 2) },
];

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const cardinal = (deg: number) => CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/**
 * A 3D cube that mirrors the device's real-world orientation. Subscribes to
 * device motion on its own (throttled to ~30 fps) so its frequent re-renders
 * stay isolated from the sensor cards. The heading it shows is the device yaw —
 * relative to where the app started, not true North (swap in `expo-location`'s
 * `watchHeadingAsync` for a North-referenced compass).
 */
function OrientationCube() {
  const [rot, setRot] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const last = useRef(0);

  useEffect(() => {
    const sub = DeviceMotion.addListener((motion) => {
      const r = motion.rotation;
      if (!r) return;
      const now = Date.now();
      if (now - last.current < 33) return; // ~30 fps
      last.current = now;
      setRot({ pitch: r.beta, roll: r.gamma, yaw: r.alpha }); // radians
    });
    return () => sub.remove();
  }, []);

  // Compose the device orientation, then project each face through it. Signs are
  // chosen so the cube turns the way the phone does; tune to taste.
  const master = matMul(rotZ(-rot.roll), matMul(rotX(-rot.pitch), rotY(rot.yaw)));
  const projection = persp(600);
  const yawDeg = (rot.yaw * RAD_TO_DEG + 360) % 360;

  return (
    <View style={styles.cubeScene}>
      <View style={styles.cubeWrap}>
        {CUBE_FACES.map((f) => {
          const m = matMul(projection, matMul(master, matMul(f.rot, transZ(CUBE_HALF))));
          return (
            <View
              key={f.label}
              style={[styles.cubeFace, { backgroundColor: f.color, transform: [{ matrix: m }] }]}
            >
              <Text style={styles.cubeFaceText}>{f.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.cubeCaption}>
        heading {cardinal(yawDeg)} · {Math.round(yawDeg)}°
      </Text>
    </View>
  );
}

/** Human-readable label for a limited-tracking reason. */
const REASON_LABEL: Record<ArTrackingReason, string> = {
  initializing: 'initializing',
  detectingPlanes: 'detecting a surface',
  insufficientFeatures: 'insufficient features — aim at a textured, lit area',
  excessiveMotion: 'excessive motion — slow down',
  insufficientLight: 'insufficient light',
  relocalizing: 'relocalizing',
  unknown: 'unknown',
};

/** Color for a tracking-state badge. */
function trackingColor(state: ArTrackingState | '—'): string {
  switch (state) {
    case 'tracking':
      return '#2f7d6e';
    case 'initializing':
      return '#a15c00';
    case 'paused':
      return '#8a5a00';
    case 'unavailable':
      return '#b3261e';
    default:
      return '#6b7280';
  }
}

/** A labeled row of x/y/z values with a Hz badge. */
function SensorCard({
  title,
  unit,
  values,
  hz,
  available,
}: {
  title: string;
  unit: string;
  values: { label: string; value: number }[];
  hz: number;
  available: boolean | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.hzBadge, available === false && styles.hzBadgeOff]}>
          {available === false ? 'N/A' : `${hz} Hz`}
        </Text>
      </View>
      <View style={styles.axisRow}>
        {values.map((v) => (
          <View key={v.label} style={styles.axisCell}>
            <Text style={styles.axisLabel}>{v.label}</Text>
            <Text style={styles.axisValue}>{v.value.toFixed(3)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

/** Debug screen: live AR tracking diagnostics + all device motion sensors. */
export function ArDiagnosticsScreen({ ready }: ScreenProps) {
  const [support, setSupport] = useState<ArSupport | null>(null);
  const [tracking, setTracking] = useState<ArTrackingState | '—'>('—');
  const [reason, setReason] = useState<ArTrackingReason | null>(null);
  const [arError, setArError] = useState<string | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const arRef = useRef<ArcgisArViewRef>(null);

  const accel = useTriAxisSensor(Accelerometer);
  const gyro = useTriAxisSensor(Gyroscope);
  const mag = useTriAxisSensor(Magnetometer);
  const motion = useDeviceMotion();

  useEffect(() => {
    let active = true;
    isArSupported()
      .then((r) => active && setSupport(r))
      .catch(() => active && setSupport({ supported: false, reason: 'unknown' }));
    return () => {
      active = false;
    };
  }, []);

  // Poll the AR camera pose while the world-scale view is mounted; a rejection
  // just means it isn't tracking yet, so we clear the pose.
  useEffect(() => {
    if (!support?.supported || !ready) return;
    const id = setInterval(async () => {
      try {
        const camera = await arRef.current?.getCurrentCamera();
        setPose(camera ?? null);
      } catch {
        setPose(null);
      }
    }, 700);
    return () => clearInterval(id);
  }, [support?.supported, ready]);

  return (
    <View style={screenStyles.fill}>
      {/* AR panel — mounts the world-scale view when supported so we get real
          tracking-state + pose diagnostics. */}
      <View style={styles.arPanel}>
        {support?.supported && ready ? (
          <ArcgisArView
            ref={arRef}
            style={StyleSheet.absoluteFill}
            mode="worldScale"
            calibrationVisible={false}
            scene={{ basemap: 'arcGISImagery', elevationEnabled: true }}
            onTrackingStateChange={(e) => {
              setTracking(e.nativeEvent.state);
              setReason(e.nativeEvent.reason ?? null);
            }}
            onArError={(e) => setArError(e.nativeEvent.code)}
          />
        ) : (
          <Centered
            text={
              support === null
                ? 'Checking AR support…'
                : `AR unavailable${support.reason ? ` (${support.reason})` : ''} — sensors below still work.`
            }
          />
        )}
        <View style={[styles.trackingBadge, { backgroundColor: trackingColor(tracking) }]}>
          <Text style={styles.trackingText}>{tracking}</Text>
        </View>
      </View>

      <ScrollView style={screenStyles.fill} contentContainerStyle={styles.scroll}>
        {/* 3D orientation cube — rotates live with the device */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3D orientation</Text>
          <OrientationCube />
          <Text style={styles.unit}>
            The cube mirrors the device&apos;s pitch / roll / yaw. Front face = heading reference (N).
          </Text>
        </View>

        {/* AR summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Augmented reality</Text>
          <Text style={styles.kv}>
            supported: <Text style={styles.mono}>{String(support?.supported ?? '…')}</Text>
            {support?.reason ? `  (${support.reason})` : ''}
          </Text>
          <Text style={styles.kv}>
            tracking state: <Text style={styles.mono}>{tracking}</Text>
            {reason ? <Text style={styles.mono}>{`  — ${REASON_LABEL[reason]}`}</Text> : ''}
          </Text>
          {arError ? (
            <Text style={[styles.kv, styles.err]}>
              AR error: <Text style={styles.mono}>{arError}</Text>
            </Text>
          ) : null}
          <Text style={styles.kv}>
            camera pose:{' '}
            <Text style={styles.mono}>
              {pose
                ? `${pose.latitude.toFixed(5)}, ${pose.longitude.toFixed(5)}  alt ${pose.altitude.toFixed(1)}m`
                : 'not tracking'}
            </Text>
          </Text>
          {pose ? (
            <Text style={styles.kv}>
              heading/pitch/roll:{' '}
              <Text style={styles.mono}>
                {pose.heading.toFixed(1)}° / {pose.pitch.toFixed(1)}° / {pose.roll.toFixed(1)}°
              </Text>
            </Text>
          ) : null}
        </View>

        <SensorCard
          title="Accelerometer"
          unit="g (gravitational units)"
          hz={accel.hz}
          available={accel.available}
          values={[
            { label: 'x', value: accel.data.x },
            { label: 'y', value: accel.data.y },
            { label: 'z', value: accel.data.z },
          ]}
        />
        <SensorCard
          title="Gyroscope"
          unit="rad/s (rotation rate)"
          hz={gyro.hz}
          available={gyro.available}
          values={[
            { label: 'x', value: gyro.data.x },
            { label: 'y', value: gyro.data.y },
            { label: 'z', value: gyro.data.z },
          ]}
        />
        <SensorCard
          title="Magnetometer"
          unit="µT (microtesla)"
          hz={mag.hz}
          available={mag.available}
          values={[
            { label: 'x', value: mag.data.x },
            { label: 'y', value: mag.data.y },
            { label: 'z', value: mag.data.z },
          ]}
        />
        <SensorCard
          title="Device motion — orientation"
          unit="degrees (pitch / roll / yaw)"
          hz={motion.hz}
          available={motion.available}
          values={[
            { label: 'pitch', value: motion.rotationDeg.x },
            { label: 'roll', value: motion.rotationDeg.y },
            { label: 'yaw', value: motion.rotationDeg.z },
          ]}
        />
        <SensorCard
          title="Device motion — rotation rate"
          unit="rad/s"
          hz={motion.hz}
          available={motion.available}
          values={[
            { label: 'pitch', value: motion.rotationRate.x },
            { label: 'roll', value: motion.rotationRate.y },
            { label: 'yaw', value: motion.rotationRate.z },
          ]}
        />

        <Text style={styles.footnote}>
          Tip: AR tracking needs a high sensor + camera rate. If Hz is low or tracking stays
          &ldquo;initializing&rdquo;, point at a well-lit, textured surface and move slowly — or run a
          release build for full frame rate.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  arPanel: {
    height: 220,
    backgroundColor: '#111827',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trackingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  hzBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  hzBadgeOff: { color: '#6b7280', backgroundColor: '#f3f4f6' },
  axisRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  axisCell: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  axisLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  axisValue: {
    fontSize: 15,
    color: '#111827',
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    marginTop: 2,
  },
  unit: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  kv: { fontSize: 13, color: '#374151', marginTop: 6 },
  mono: { fontVariant: ['tabular-nums'], color: '#111827', fontWeight: '600' },
  err: { color: '#b3261e' },
  footnote: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  cubeScene: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'visible',
  },
  cubeWrap: {
    width: CUBE_HALF * 2,
    height: CUBE_HALF * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cubeFace: {
    position: 'absolute',
    width: CUBE_HALF * 2,
    height: CUBE_HALF * 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backfaceVisibility: 'hidden',
    opacity: 0.94,
    borderRadius: 4,
  },
  cubeFaceText: { color: '#fff', fontWeight: '800', fontSize: 20, letterSpacing: 1 },
  cubeCaption: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
});
