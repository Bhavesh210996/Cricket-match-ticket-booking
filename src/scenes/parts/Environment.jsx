// Sky dome + field + boundary rope + 30-yard ring.
// Ported from stadium-view.js `_initScene()` (sky / field / rope / ring30).
// The dome gradient + scene fog/clear colour are toned for ONE fixed hour
// (SCENE_SUN_HOUR) — there is no user time control and no live relighting.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { skyTexture, turfTexture } from '../../stadium/textures.js';
import { EX, EZ } from '../../stadium/config.js';
import { skyStops, daylight, SCENE_SUN_HOUR } from '../../stadium/sun.js';

const SKY_STOPS = skyStops(SCENE_SUN_HOUR);
// fog / clear colour follows the horizon stop, pulled back toward the original
// near-black so the bowl edges read warm at dusk without washing out.
const FOG_COLOR = new THREE.Color(SKY_STOPS[SKY_STOPS.length - 1][1])
  .lerp(new THREE.Color('#05070c'), 0.62 - daylight(SCENE_SUN_HOUR) * 0.32)
  .getStyle();

export default function Environment() {
  const sky = useMemo(() => skyTexture(SKY_STOPS), []);
  const turf = useMemo(() => turfTexture(), []);
  useEffect(() => () => sky.dispose(), [sky]);
  useEffect(() => () => turf.dispose(), [turf]);

  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.0006]} />

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
