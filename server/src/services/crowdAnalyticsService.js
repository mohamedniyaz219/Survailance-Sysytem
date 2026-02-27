const DEFAULT_CAMERA_AREA_SQM = Number(process.env.DEFAULT_CAMERA_AREA_SQM || 50);
const SURGE_LOOKBACK_SAMPLES = Number(process.env.CROWD_SURGE_LOOKBACK || 6);
const SURGE_RATIO_THRESHOLD = Number(process.env.CROWD_SURGE_RATIO || 1.8);
const MIN_SURGE_DELTA = Number(process.env.CROWD_SURGE_MIN_DELTA || 12);
const FLOW_DELTA_THRESHOLD = Number(process.env.CROWD_FLOW_DELTA || 3);

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveAreaSqm(payloadAreaSqm) {
  const area = safeNumber(payloadAreaSqm, DEFAULT_CAMERA_AREA_SQM);
  if (area <= 0) return DEFAULT_CAMERA_AREA_SQM;
  return area;
}

export function classifyDensity(peopleCount, areaSqm) {
  const count = Math.max(0, safeNumber(peopleCount));
  const area = Math.max(1, safeNumber(areaSqm, DEFAULT_CAMERA_AREA_SQM));
  const perSqm = count / area;

  if (perSqm >= 0.75) {
    return { densityLevel: 'critical', densityPerSqm: Number(perSqm.toFixed(3)) };
  }
  if (perSqm >= 0.35) {
    return { densityLevel: 'dense', densityPerSqm: Number(perSqm.toFixed(3)) };
  }
  return { densityLevel: 'normal', densityPerSqm: Number(perSqm.toFixed(3)) };
}

export function detectFlowDirection({
  peopleCount,
  previousCount,
  prevDirection,
  recentCounts = []
}) {
  const current = safeNumber(peopleCount);
  const previous = safeNumber(previousCount);
  const delta = current - previous;

  let baseDirection = 'static';
  if (delta >= FLOW_DELTA_THRESHOLD) baseDirection = 'in';
  if (delta <= -FLOW_DELTA_THRESHOLD) baseDirection = 'out';

  const trendSeries = [...recentCounts.map((value) => safeNumber(value)), current];
  const signChanges = trendSeries.reduce((acc, value, idx, list) => {
    if (idx < 2) return acc;
    const d1 = list[idx - 1] - list[idx - 2];
    const d2 = value - list[idx - 1];
    if (Math.sign(d1) !== 0 && Math.sign(d2) !== 0 && Math.sign(d1) !== Math.sign(d2)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  if (signChanges >= 2 && Math.abs(delta) >= FLOW_DELTA_THRESHOLD) {
    return 'chaotic';
  }

  if (baseDirection === 'static' && prevDirection && ['in', 'out'].includes(prevDirection)) {
    return 'static';
  }

  return baseDirection;
}

export function detectSuddenSurge({ peopleCount, recentCounts = [] }) {
  const current = Math.max(0, safeNumber(peopleCount));
  const samples = recentCounts
    .map((value) => Math.max(0, safeNumber(value)))
    .slice(-SURGE_LOOKBACK_SAMPLES);

  if (!samples.length) {
    return { isSurge: false, baseline: 0, ratio: 0, delta: current };
  }

  const baseline = samples.reduce((sum, val) => sum + val, 0) / samples.length;
  const ratio = baseline > 0 ? current / baseline : (current > 0 ? Infinity : 0);
  const delta = current - baseline;
  const isSurge = ratio >= SURGE_RATIO_THRESHOLD && delta >= MIN_SURGE_DELTA;

  return {
    isSurge,
    baseline: Number(baseline.toFixed(2)),
    ratio: Number((Number.isFinite(ratio) ? ratio : 99).toFixed(2)),
    delta: Number(delta.toFixed(2))
  };
}
