// Camera state machine. Replaces the original hand-rolled spherical rig +
// per-frame cubic tween (`_camState`/`_startTween`/`_frame` in stadium-view.js)
// with drei's CameraControls: each store mode change resolves to a pose from
// src/stadium/camera.js and is flown to via flyTo(). The live controls +
// camera are registered so the UI layer (preset bar, compass) can share them.
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { useBookingStore } from '../../store/useBookingStore.js';
import { overviewPose, standPose, povPose } from '../../stadium/camera.js';
import { registerCamera, flyTo, syncControlsToCamera } from '../../stadium/flyCamera.js';

// original phi clamp was 0.015..1.53 (elevation from horizon); as three polar
// angle (from +Y) that's this band — keeps the camera above the pitch.
const MAX_POLAR = Math.PI / 2 - 0.015;
const MIN_POLAR = Math.PI / 2 - 1.53;

export default function CameraRig() {
  const controls = useRef();
  const firstApply = useRef(true);
  const camera = useThree((s) => s.camera);
  const { width, height } = useThree((s) => s.size);
  const aspect = width / height;

  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);
  const focusedStandId = useBookingStore((s) => s.focusedStandId);
  const selectedSeat = useBookingStore((s) => s.selectedSeat);
  const prevMode = useRef(mode);

  useEffect(() => {
    if (controls.current) registerCamera(controls.current, camera);
  }, [camera]);

  useEffect(() => {
    if (!controls.current) return;

    // returning from POV/compare: PovController has been driving the camera, so
    // hand its real pose back to CameraControls before it animates away.
    const leftPov = prevMode.current === 'pov' || prevMode.current === 'compare';
    prevMode.current = mode;
    if (leftPov && (mode === 'stand' || mode === 'overview')) {
      syncControlsToCamera();
    }

    let pose;
    if (mode === 'stand' && focusedStandId) {
      const st = stands.find((s) => s.id === focusedStandId);
      if (st) pose = standPose(st, aspect);
    } else if (mode === 'pov' && selectedSeat) {
      const st = stands.find((s) => s.id === selectedSeat.standId);
      if (st) pose = povPose(st, selectedSeat, aspect);
    } else if (mode === 'overview') {
      pose = overviewPose(aspect);
    }
    if (!pose) return; // 'compare' (and any gap): leave the camera put

    // first application (initial mount) is instant + aspect-correct, so the
    // approximate camera in App.jsx never shows; later changes fly.
    flyTo(pose, !firstApply.current);
    firstApply.current = false;
  }, [mode, focusedStandId, selectedSeat, stands, aspect, camera]);

  const orbiting = mode === 'overview' || mode === 'stand';

  return (
    <CameraControls
      ref={controls}
      makeDefault
      // once a fly settles, fold the accumulated azimuth back into (-π, π] so it
      // can't drift unbounded over a long session (flyTo does shortest-path off
      // this value, so it must stay bounded). No-op visually — end == start here.
      onRest={() => controls.current?.normalizeRotations()}
      // pov look-around + the compare grid are UI-phase work; lock input there
      enabled={orbiting}
      // Step 1 kept a zoom band + kept the camera above ground; same idea,
      // rescaled to the ported stadium (~6x larger world than the Step 1 pitch).
      minDistance={mode === 'overview' ? 40 : 6}
      maxDistance={mode === 'overview' ? 1100 : 420}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      dollySpeed={0.6}
    />
  );
}
