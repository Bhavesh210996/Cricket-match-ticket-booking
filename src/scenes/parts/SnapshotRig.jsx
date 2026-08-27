// Offscreen POV capture for the "Compare your shortlist" feature.
//
// Registers a capture fn on the snapshot bridge: it points a throwaway
// PerspectiveCamera at the seat-eye pose from povPose(), does one out-of-band
// gl.render() into the (preserveDrawingBuffer) canvas, copies the pixels down
// to a bounded-width JPEG data URL, then immediately re-renders the real camera
// so the on-screen view never visibly flickers.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { povPose } from '../../stadium/camera.js';
import { registerSnapshot } from '../../stadium/snapshot.js';

const MAX_W = 720; // downscale target — keeps the stored data URL small

export default function SnapshotRig() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const shot = new THREE.PerspectiveCamera();

    registerSnapshot((st, seat) => {
      const src = gl.domElement;
      const aspect = src.width / src.height || 1.6;
      const pose = povPose(st, seat, aspect);

      shot.fov = pose.fov;
      shot.aspect = aspect;
      shot.near = camera.near;
      shot.far = camera.far;
      shot.position.copy(pose.position);
      shot.lookAt(pose.target);
      shot.updateProjectionMatrix();

      gl.render(scene, shot);

      const scale = Math.min(1, MAX_W / src.width);
      const oc = document.createElement('canvas');
      oc.width = Math.max(1, Math.round(src.width * scale));
      oc.height = Math.max(1, Math.round(src.height * scale));
      oc.getContext('2d').drawImage(src, 0, 0, oc.width, oc.height);
      const url = oc.toDataURL('image/jpeg', 0.8);

      gl.render(scene, camera); // restore the live view this same frame
      return url;
    });

    return () => registerSnapshot(null);
  }, [gl, scene, camera]);

  return null;
}
