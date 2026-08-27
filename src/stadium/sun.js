// Simplified sun / shadow model for the cricket bowl.
//
// Deliberately NOT astronomical — no date, no latitude, no equation of time.
// It's a single sine arc: the sun rises low in the east, peaks at solar noon,
// sets low in the west. Two independent consumers use it:
//
//   1. The 3D scene lighting (Lights / Environment) — locked to ONE fixed hour
//      (SCENE_SUN_HOUR). There is no user time control and no live relighting.
//   2. The SeatInfoCard "sun exposure" timeline — a pure background calculation
//      that samples this same formula across the match window for the selected
//      seat. Completely decoupled from what the scene actually renders.

import * as THREE from 'three';
import { seatPos } from './seats.js';

const DAY_START = 6;        // notional sunrise
const DAY_END = 19;         // notional sunset (~7:00 PM)
const MAX_ELEVATION = THREE.MathUtils.degToRad(62); // sun height at solar noon
const SUN_DISTANCE = 320;   // how far out to park the directional light

// Fixed hour the 3D scene is lit at — a good-looking dusk. Independent of the
// per-seat timeline below; changing it never re-runs any seat calculation.
export const SCENE_SUN_HOUR = 18.5;

// 0 at sunrise, 1 at solar noon, 0 at sunset. <0 outside daylight.
function dayFraction(hour) {
  return (hour - DAY_START) / (DAY_END - DAY_START);
}

// Daylight strength on a simple sine curve: 0 at the horizon, 1 at noon.
export function daylight(hour) {
  const t = dayFraction(hour);
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

// Unit vector from the field centre toward the sun.
//   elevation: sine arc, low at the ends, MAX_ELEVATION at noon
//   azimuth:   sweeps east (+X) → south (+Z) → west (-X) across the day
export function sunDirection(hour) {
  const t = THREE.MathUtils.clamp(dayFraction(hour), 0, 1);
  const elev = MAX_ELEVATION * Math.sin(t * Math.PI);
  const h = t * Math.PI; // 0 = due east, PI = due west
  const ce = Math.cos(elev);
  return new THREE.Vector3(ce * Math.cos(h), Math.sin(elev), ce * Math.sin(h)).normalize();
}

// Everything the scene lights need for a given (fixed) hour.
export function sunLight(hour) {
  const e = daylight(hour);
  const dir = sunDirection(hour);
  const elevationDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)));

  const gold = new THREE.Color('#ff8a3d');
  const noon = new THREE.Color('#fff2df');
  const color = '#' + gold.lerp(noon, THREE.MathUtils.smoothstep(e, 0.12, 0.7)).getHexString();

  return {
    position: [dir.x * SUN_DISTANCE, dir.y * SUN_DISTANCE, dir.z * SUN_DISTANCE],
    color,
    intensity: THREE.MathUtils.lerp(0.12, 2.3, e),
    floodFactor: THREE.MathUtils.lerp(1, 0.2, e),
    ambientIntensity: THREE.MathUtils.lerp(0.2, 0.4, e),
    hemiIntensity: THREE.MathUtils.lerp(0.5, 0.95, e),
    elevationDeg,
    daylight: e,
  };
}

/* -------------------------------------------------------------- sky dome tone */
const SKY_NIGHT = ['#080b12', '#131a26', '#2b2b30', '#4a3c31', '#6b503a'];
const SKY_SUNSET = ['#141d2e', '#2b2f47', '#584056', '#9a5433', '#e88b3c'];
const SKY_DAY = ['#3f6094', '#5f7f9e', '#8fa1a8', '#c0b394', '#dcc9a8'];
const SKY_OFFSETS = [0, 0.42, 0.72, 0.88, 1];

function mixHex(a, b, t) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

export function skyStops(hour) {
  const e = daylight(hour);
  let from, to, k;
  if (e <= 0.35) {
    from = SKY_NIGHT; to = SKY_SUNSET; k = e / 0.35;
  } else if (e <= 0.75) {
    from = SKY_SUNSET; to = SKY_DAY; k = (e - 0.35) / 0.4;
  } else {
    from = SKY_DAY; to = SKY_DAY; k = 0;
  }
  return SKY_OFFSETS.map((o, i) => [o, mixHex(from[i], to[i], k)]);
}

/* --------------------------------------------------- per-seat sun-exposure timeline */
const GLARE_CONE = Math.cos(THREE.MathUtils.degToRad(42));

// Bands the raw 30-min samples are grouped into, worst → best exposure.
const BAND_META = {
  glare: { label: 'Glare', emoji: '🔆' },
  direct: { label: 'Direct sun', emoji: '☀️' },
  partial: { label: 'Partial shade', emoji: '🌤️' },
  shaded: { label: 'Fully shaded', emoji: '⛱️' },
  night: { label: 'Floodlit', emoji: '💡' },
};

// One time sample -> one band category for this seat, using the same
// glare/shade dot-product as everywhere else in this module.
function classifySample(facing, hour) {
  if (daylight(hour) < 0.06) return 'night';

  const sun = sunDirection(hour);
  const sunElevDeg = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(sun.y, -1, 1)));
  const sunHoriz = new THREE.Vector3(sun.x, 0, sun.z).normalize();
  const align = facing.dot(sunHoriz); // 1 = sun dead ahead of the viewer, -1 = directly behind

  // low sun sitting right in the viewer's eyeline
  if (align > GLARE_CONE && sunElevDeg < 34) return 'glare';
  // sun overhead (near noon) or coming from over the field toward the seat
  if (sunElevDeg > 55 || align > 0.2) return 'direct';
  // sun behind the stand -> roof / upper deck / back wall shade the seat
  if (align < -0.25) return 'shaded';
  // sun raking along the stand
  return 'partial';
}

// "Sat 12 Sep · 19:30" -> 19.5 ; null if no HH:MM found.
export function parseMatchStart(dateStr) {
  const m = /(\d{1,2}):(\d{2})/.exec(dateStr || '');
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

// Match-relevant sampling window. Trimmed around a known start time, otherwise a
// generic afternoon→night window.
function matchWindow(startHour) {
  if (startHour == null) return [14, 22];
  // from the afternoon lead-in through to well after the scheduled start
  const w0 = THREE.MathUtils.clamp(startHour - 4.5, 13, 19);
  const w1 = THREE.MathUtils.clamp(startHour + 3.5, w0 + 4, 23.5);
  return [w0, w1];
}

// h (decimal) -> "5:30" / "10:00" (12-hour, no am/pm — the window is one evening)
export function formatHour(h) {
  const hr = Math.floor(h + 1e-9);
  const min = Math.round((h - hr) * 60);
  const disp = ((hr + 11) % 12) + 1;
  return `${disp}:${String(min).padStart(2, '0')}`;
}

// Automatic, no user input: sample the glare/shade formula every 30 min across
// the match window and merge consecutive same-category samples into ranges.
// Returns [{ category, label, emoji, glare, start, end }] in chronological order.
export function seatSunTimeline(seat, st, { startHour = null } = {}) {
  if (!seat || !st) return [];

  const p = seatPos(st, seat.row - 1, seat.num - 1);
  const facing = new THREE.Vector3(-p.x, 0, -p.z).normalize(); // seat always faces the pitch centre

  const [w0, w1] = matchWindow(startHour);
  const bands = [];
  for (let h = w0; h <= w1 + 1e-9; h += 0.5) {
    const category = classifySample(facing, h);
    const prev = bands[bands.length - 1];
    if (prev && prev.category === category) prev.end = h;
    else bands.push({ category, start: h, end: h });
  }

  // stretch each band to the next band's start (last one to the window end)
  return bands.map((b, i) => ({
    category: b.category,
    start: b.start,
    end: i < bands.length - 1 ? bands[i + 1].start : w1,
    label: BAND_META[b.category].label,
    emoji: BAND_META[b.category].emoji,
  }));
}
