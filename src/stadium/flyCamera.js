// Small bridge so UI components (which live outside <Canvas>) can move the
// same camera CameraRig drives, without adding camera state to the store.
// CameraRig registers the live CameraControls + camera on mount; the camera
// preset bar and compass read/act through here.

import * as THREE from 'three';
import gsap from 'gsap';

let _controls = null;
let _camera = null;

const _sph = new THREE.Spherical();
const TWO_PI = Math.PI * 2;

export function registerCamera(controls, camera) {
  _controls = controls;
  _camera = camera;
}

// Push the camera's actual current pose into CameraControls' internal state
// without animating. Call before flyTo() when returning from POV, so the fly
// animation starts from wherever the user dragged the look direction rather
// than from CameraControls' stale (pre-POV) target.
export function syncControlsToCamera() {
  if (!hasCamera()) return;
  const p = _camera.position;
  const d = new THREE.Vector3();
  _camera.getWorldDirection(d);
  _controls.setLookAt(p.x, p.y, p.z, p.x + d.x, p.y + d.y, p.z + d.z, false);
}

export function hasCamera() {
  return !!_controls && !!_camera;
}

export function getCamera() {
  return _camera;
}

// pose: { position: Vector3, target: Vector3, fov: number }
export function flyTo(pose, animate = true) {
  if (!hasCamera()) return;
  const { position: p, target: t, fov } = pose;
  _controls.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, animate);

  // Shortest-path azimuth. setLookAt derives the end azimuth from
  // atan2(position - target), so it always lands in (-π, π]; but
  // _controls.azimuthAngle is a free-running accumulator that may sit several
  // turns away. Re-express the end angle as the multiple of 2π nearest the
  // current one, then rewrite just the end azimuth (rotateTo leaves the target
  // + radius that setLookAt set). The eased rotation then sweeps ≤180° instead
  // of possibly unwinding the long way around the ±180° seam. Only meaningful
  // while animating — an instant cut has no visible path.
  if (animate) {
    const current = _controls.azimuthAngle;
    _controls.getSpherical(_sph, true); // _sph <- pending end spherical
    const nearest = _sph.theta + TWO_PI * Math.round((current - _sph.theta) / TWO_PI);
    if (nearest !== _sph.theta) _controls.rotateTo(nearest, _sph.phi, true);
  }

  gsap.killTweensOf(_camera);
  gsap.to(_camera, {
    fov,
    duration: animate ? 0.9 : 0,
    ease: 'power3.inOut',
    overwrite: true,
    onUpdate: () => _camera.updateProjectionMatrix(),
  });
}

// live orientation for the compass dial (radians). azimuth = around Y,
// polar = from +Y (so elevation above the horizon is 90° - polar).
export function getCameraAngles() {
  if (!_controls) return { azimuth: 0, polar: Math.PI / 4 };
  return { azimuth: _controls.azimuthAngle, polar: _controls.polarAngle };
}

export function viewportAspect() {
  return (window.innerWidth || 1) / (window.innerHeight || 1);
}

// world-space point -> {x, y} in CSS pixels, or null when behind the camera.
// Used to anchor the seat chip near its seat as the camera moves.
export function projectToScreen(v) {
  if (!_camera) return null;
  const p = v.clone().project(_camera);
  if (p.z > 1) return null; // behind the near plane / camera
  return {
    x: (p.x * 0.5 + 0.5) * window.innerWidth,
    y: (-p.y * 0.5 + 0.5) * window.innerHeight,
  };
}
