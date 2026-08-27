// Look-around from a fixed seat-eye point (pov + compare modes). Ports the
// clamped yaw/pitch drag + FOV zoom the original <stadium-view> ran in its
// `_frame` pov branch (`this.look = { yaw, pitch }`, wheel -> fov).
//
// Position is LOCKED to the seat-eye coordinate — this is head-turn, not orbit.
// Runs in useFrame; it is mounted after <CameraRig> in the scene so it wins the
// frame over the (disabled) CameraControls in these modes. CameraRig still flies
// the camera IN to the seat; this takes over ~1s later.
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useBookingStore } from '../../store/useBookingStore.js';
import { povPose } from '../../stadium/camera.js';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// head-turn limits
const YAW_LIMIT = 1.3;   // ±~75°
const PITCH_MIN = -0.42;  // look down ~24°
const PITCH_MAX = 0.5;    // look up ~29°
// FOV "lean in / out" — never moves position, so the user can't leave the seat
const FOV_DELTA_MIN = -26; // zoom in
const FOV_DELTA_MAX = 6;   // slight zoom out

const DRAG_YAW = 0.0035;
const DRAG_PITCH = 0.0026;
const WHEEL_FOV = 0.03;
const HANDOFF_MS = 1000; // let CameraRig's fly-in land before we take over

export default function PovController() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);
  const selectedSeat = useBookingStore((s) => s.selectedSeat);

  const active = (mode === 'pov' || mode === 'compare') && !!selectedSeat;

  const look = useRef({ yaw: 0, pitch: 0, fovDelta: 0 });
  const base = useRef(null); // { eye, baseDir, baseFov }
  const takeoverAt = useRef(0);
  const drag = useRef(null);

  // anchor (recomputed on seat or aspect change so it stays correct after resize)
  useEffect(() => {
    if (!active) {
      base.current = null;
      return;
    }
    const st = stands.find((s) => s.id === selectedSeat.standId);
    if (!st) return;
    const pose = povPose(st, selectedSeat, size.width / size.height);
    base.current = {
      eye: pose.position.clone(),
      baseDir: pose.target.clone().sub(pose.position).normalize(),
      baseFov: pose.fov,
    };
  }, [active, selectedSeat, stands, size.width, size.height]);

  // reset look + delay takeover only when entering pov / switching seats
  useEffect(() => {
    if (!active) return;
    look.current = { yaw: 0, pitch: 0, fovDelta: 0 };
    takeoverAt.current = performance.now() + HANDOFF_MS;
  }, [active, selectedSeat]);

  // drag + wheel on the canvas
  useEffect(() => {
    if (!active) return undefined;
    const el = gl.domElement;
    const onDown = (e) => {
      drag.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current = { x: e.clientX, y: e.clientY };
      const L = look.current;
      L.yaw = THREE.MathUtils.clamp(L.yaw - dx * DRAG_YAW, -YAW_LIMIT, YAW_LIMIT);
      L.pitch = THREE.MathUtils.clamp(L.pitch - dy * DRAG_PITCH, PITCH_MIN, PITCH_MAX);
    };
    const onUp = (e) => {
      drag.current = null;
      el.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e) => {
      e.preventDefault();
      const L = look.current;
      L.fovDelta = THREE.MathUtils.clamp(
        L.fovDelta + e.deltaY * WHEEL_FOV,
        FOV_DELTA_MIN,
        FOV_DELTA_MAX,
      );
      if (base.current) {
        // FOV-only zoom (position never moves), eased so it feels like leaning
        gsap.to(camera, {
          fov: base.current.baseFov + L.fovDelta,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => camera.updateProjectionMatrix(),
        });
      }
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      drag.current = null;
    };
  }, [active, gl, camera]);

  useFrame(() => {
    if (!active || !base.current) return;
    if (performance.now() < takeoverAt.current) return; // fly-in still running

    const { eye, baseDir } = base.current;
    const L = look.current;

    camera.position.copy(eye); // hard lock — no free-fly

    const dir = baseDir.clone().applyAxisAngle(WORLD_UP, L.yaw);
    const right = new THREE.Vector3().crossVectors(dir, WORLD_UP).normalize();
    dir.applyAxisAngle(right, L.pitch);
    camera.lookAt(eye.x + dir.x, eye.y + dir.y, eye.z + dir.z);
    // FOV is handled by the wheel handler's gsap tween, not here
  });

  return null;
}
