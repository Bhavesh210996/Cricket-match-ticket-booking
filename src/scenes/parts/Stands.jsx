// Lofted stand shells + upper-deck letter labels.
// Ported from stadium-view.js `_initScene()` (this.stands.forEach deck block)
// and the tier-highlight logic from `_applyHighlight()`.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { loft } from '../../stadium/geometry.js';
import { labelSprite } from '../../stadium/textures.js';
import { TIERS, EX, EZ } from '../../stadium/config.js';

function StandLabel({ letter, position }) {
  const sprite = useMemo(() => labelSprite(letter), [letter]);
  useEffect(() => () => { sprite.material.map?.dispose(); sprite.material.dispose(); }, [sprite]);
  return <primitive object={sprite} position={position} />;
}

export default function Stands() {
  const stands = useBookingStore((s) => s.stands);
  const activeTier = useBookingStore((s) => s.activeTier);
  const selectStand = useBookingStore((s) => s.selectStand);

  const built = useMemo(
    () =>
      stands.map((st) => ({
        st,
        geometry: loft(st.a0, st.a1, st.section),
        baseColor: new THREE.Color(TIERS[st.tier].color).multiplyScalar(
          st.tier === 'berm' ? 0.34 : 0.5,
        ),
      })),
    [stands],
  );
  useEffect(() => () => built.forEach((b) => b.geometry.dispose()), [built]);

  return (
    <group>
      {built.map(({ st, geometry, baseColor }) => {
        const dim = activeTier && st.tier !== activeTier;
        const lit = activeTier && !dim;
        const color = baseColor
          .clone()
          .multiplyScalar(dim ? 0.32 : activeTier ? 1.55 : 1);
        return (
          <mesh
            key={st.id}
            geometry={geometry}
            receiveShadow
            onClick={(e) => { e.stopPropagation(); selectStand(st.id); }}
          >
            <meshStandardMaterial
              color={color}
              roughness={0.82}
              metalness={0.04}
              side={THREE.DoubleSide}
              emissive={lit ? TIERS[st.tier].color : 0x000000}
              emissiveIntensity={lit ? 0.32 : 0}
            />
          </mesh>
        );
      })}

      {built
        .filter(({ st }) => st.deck === 'upper')
        .map(({ st }) => {
          const am = (st.a0 + st.a1) / 2;
          return (
            <StandLabel
              key={st.id}
              letter={st.letter}
              position={[
                Math.cos(am) * (st.r1 + 5) * EX,
                st.y1 + 6.5,
                Math.sin(am) * (st.r1 + 5) * EZ,
              ]}
            />
          );
        })}
    </group>
  );
}
