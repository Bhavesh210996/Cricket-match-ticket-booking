// Pitch strip + creases + stumps + on-field players.
// Ported from stadium-view.js `_initScene()` (pitch / crease / stumps / players).
import { useMemo } from 'react';
import * as THREE from 'three';

const CREASE_X = [-9, 9];
const STUMP_S = [-1, 0, 1];

// fielding positions from the original `spots` array
const SPOTS = [
  [-11, 0], [9.4, 1.4], [10.6, -1.2], [-16, 8], [24, 26], [-30, 18], [38, -14],
  [12, 40], [-40, -26], [50, 20], [-8, -34], [30, 52], [-56, 30],
];

export default function Pitch() {
  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }),
    [],
  );
  const bodyGeo = useMemo(() => new THREE.CapsuleGeometry(0.34, 0.95, 4, 8), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.24, 10, 8), []);

  return (
    <>
      <mesh position-y={0.07} receiveShadow>
        <boxGeometry args={[26, 0.14, 9]} />
        <meshStandardMaterial color={0xcdb58c} roughness={0.9} />
      </mesh>

      {CREASE_X.map((x) => (
        <group key={x}>
          <mesh position={[x, 0.15, 0]} material={whiteMat}>
            <boxGeometry args={[0.16, 0.02, 3.6]} />
          </mesh>
          {STUMP_S.map((s) => (
            <mesh key={s} position={[x, 0.5, s * 0.22]} material={whiteMat}>
              <cylinderGeometry args={[0.06, 0.06, 0.72, 6]} />
            </mesh>
          ))}
        </group>
      ))}

      {SPOTS.map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh geometry={bodyGeo} position-y={1.1} castShadow>
            <meshStandardMaterial color={i < 3 ? 0xf2f5fa : 0x1b3f77} roughness={0.7} />
          </mesh>
          <mesh geometry={headGeo} position-y={1.85}>
            <meshStandardMaterial color={0x8d6a4f} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}
