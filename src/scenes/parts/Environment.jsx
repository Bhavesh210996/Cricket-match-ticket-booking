// Sky dome + field + boundary rope + 30-yard ring.
// Ported from stadium-view.js `_initScene()` (sky / field / rope / ring30).
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { skyTexture, turfTexture } from '../../stadium/textures.js';
import { EX, EZ } from '../../stadium/config.js';

export default function Environment() {
  const sky = useMemo(() => skyTexture(), []);
  const turf = useMemo(() => turfTexture(), []);
  useEffect(() => () => { sky.dispose(); turf.dispose(); }, [sky, turf]);

  return (
    <>
      {/* dome enlarged from the original 900 so the overview camera (which can
          now sit ~1000 out on very narrow viewports) stays inside it */}
      <mesh>
        <sphereGeometry args={[2000, 32, 24]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} />
      </mesh>

      <group scale={[EX, 1, EZ]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[87, 96]} />
          <meshStandardMaterial map={turf} roughness={0.95} metalness={0} />
        </mesh>

        <mesh rotation-x={-Math.PI / 2} position-y={0.35}>
          <torusGeometry args={[76, 0.45, 6, 120]} />
          <meshStandardMaterial color={0xf2f4f8} roughness={0.6} emissive={0x222222} />
        </mesh>

        <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
          <ringGeometry args={[45.4, 45.9, 96]} />
          <meshBasicMaterial color={0xdfe7ef} transparent opacity={0.28} />
        </mesh>
      </group>
    </>
  );
}
