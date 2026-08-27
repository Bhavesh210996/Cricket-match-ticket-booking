// Camera poses for the state machine. Distilled from stadium-view.js's
// `_overviewCam()`, `setMode('stand')`, `setMode('pov')`, `_povTarget()`,
// `_povFov()` — the original drove a hand-rolled spherical rig + tween; here
// each mode just yields a { position, target, fov } that <CameraRig> feeds to
// drei's CameraControls.setLookAt().

import * as THREE from 'three';
import { EX, EZ } from './config.js';
import { seatPos } from './seats.js';

// ---------------------------------------------------------------------------
// Stadium dimensions — keep in sync with src/stadium/stands.js, Environment.jsx
// and Roof.jsx. Every pose below is *constructed* from these numbers rather
// than hand-tuned, so it stays correct if the build is rescaled again.
const FIELD_R = 87;         // playing-surface radius   (Environment circleGeometry)
const STAND_FRONT_R = 88;   // lower-tier front row      (stands.js r0)
const ROOF_R = 182;         // outer roof rim            (Roof.jsx loft)
const PITCH_HALF_LEN = 13;  // pitch box is 26 along X    (Pitch.jsx)
const EYE_Y = 2.6;          // standing eye height on the field
// The overview orbit clamp (CameraRig MIN/MAX_POLAR) forbids looking up from
// below the horizon, so every preset keeps its camera *above* its look target.

// spherical -> cartesian, matching the original: x=sinθcosφ·r, y=sinφ·r, z=cosθcosφ·r
function orbit(theta, phi, radius, target) {
  return new THREE.Vector3(
    Math.sin(theta) * Math.cos(phi) * radius,
    Math.sin(phi) * radius,
    Math.cos(theta) * Math.cos(phi) * radius,
  ).add(target);
}

// FRAME_RADIUS ≈ roof rim + a little apron; the distance is then solved so that
// sphere fits the frustum at the *current* aspect rather than being a fixed
// number that only worked for one window size.
const FRAME_RADIUS = ROOF_R + 18; // ~200

// distance at which a sphere of `frame` fits the frustum at this aspect:
// vertical half-angle limits landscape, the narrower horizontal one limits
// portrait. Capped at the overview OrbitControls maxDistance.
function fitRadius(fov, aspect, frame = FRAME_RADIUS) {
  const halfV = (fov * Math.PI) / 360;
  const halfFit = Math.atan(Math.tan(halfV) * Math.min(aspect, 1));
  return Math.min((frame / Math.sin(halfFit)) * 1.04, 1100);
}

export function overviewPose(aspect = 1.6) {
  const portrait = aspect < 0.9;
  const theta = -Math.PI * 0.62;
  const phi = 0.5;
  const target = new THREE.Vector3(0, 12, 0);
  const fov = portrait ? 55 : 40;
  return { position: orbit(theta, phi, fitRadius(fov, aspect), target), target, fov };
}

// Camera-only framings for the preset bar, each constructed from the stadium
// radii above. All land inside/above the bowl and look downward at their
// target (never up from below the horizon).
export function presetPose(id, aspect = 1.6, stands) {
  switch (id) {
    case 'top': {
      // Bird's-eye: near-straight-down over the bowl centre, lifted until the
      // roof rim + a margin of apron fills the frame at this aspect.
      const fov = 45;
      const target = new THREE.Vector3(0, 0, 0);
      const radius = fitRadius(fov, aspect, ROOF_R + 60); // ~242
      // phi 1.5 = ~4° off vertical: essentially top-down but "up" stays defined
      return { position: orbit(-Math.PI * 0.62, 1.5, radius, target), target, fov };
    }
    case 'side': {
      // Side on: square of the wicket (on the +Z axis), low in the near stand
      // just past the boundary, looking level across the pitch at the far
      // stand. r ≈ 95 → well inside the roof opening, above the front seats.
      return {
        position: new THREE.Vector3(0, 15, STAND_FRONT_R + 7),
        target: new THREE.Vector3(0, 2.5, 0),
        fov: 42,
      };
    }
    case 'block': {
      // Block D: identical framing to tapping the stand — derived from the
      // stand's real arc + rake, camera backed off toward the bowl centre.
      const d = stands?.find((s) => s.id === 'D1');
      return d ? standPose(d, aspect) : overviewPose(aspect);
    }
    case 'pitch': {
      // Pitch level: standing on the grass ~8 m past one end of the pitch at
      // eye height, gazing level across the square to the far stands.
      return {
        position: new THREE.Vector3(-(PITCH_HALF_LEN + 8), EYE_Y + 0.4, 6),
        target: new THREE.Vector3(FIELD_R + 13, 0.3, -12),
        fov: 58,
      };
    }
    default:
      return overviewPose(aspect);
  }
}

export function standPose(st, aspect = 1.6) {
  const am = (st.a0 + st.a1) / 2;
  const mid = new THREE.Vector3(
    Math.cos(am) * ((st.r0 + st.r1) / 2) * EX,
    (st.y0 + st.y1) / 2 + 1,
    Math.sin(am) * ((st.r0 + st.r1) / 2) * EZ,
  );
  const portrait = aspect < 0.9;
  const fov = portrait ? 46 : 34;
  const vh = Math.tan((fov / 2) * Math.PI / 180);
  const hh = vh * aspect;
  const arcW = (st.a1 - st.a0) * ((st.r0 + st.r1) / 2);
  const depth = Math.hypot(st.r1 - st.r0, st.y1 - st.y0);
  const fitW = (arcW * (portrait ? 0.42 : 0.86)) / 2 / hh;
  const fitH = (depth * 1.05) / 2 / vh;
  // max 125: the pose backs off toward the centre by ~cos(phi)·radius, so a
  // larger radius (relative to the stand's ~100u mid-radius) would overshoot
  // past the bowl centre to the far side.
  const radius = THREE.MathUtils.clamp(Math.max(fitW, fitH), portrait ? 46 : 62, 125);
  const theta = Math.atan2(mid.x, mid.z) + Math.PI;
  const phi = portrait ? 0.82 : 0.68;
  return { position: orbit(theta, phi, radius, mid), target: mid, fov };
}

// Constructed from the seat's real world position — always inside the bowl.
export function povPose(st, seat, aspect = 1.6) {
  const p = seatPos(st, seat.row - 1, seat.num - 1);
  const dir = new THREE.Vector3(-p.x, 0, -p.z).normalize();
  const eye = p.clone().add(new THREE.Vector3(0, 1.18, 0)).add(dir.clone().multiplyScalar(0.35));
  const fov = aspect < 0.85 ? 82 : 62;
  const dist = Math.hypot(eye.x, eye.z);
  const tilt = (aspect < 0.85 ? 19 : 8) * Math.PI / 180;
  const target = new THREE.Vector3(0, eye.y - Math.tan(tilt) * dist, 0);
  return { position: eye, target, fov };
}
