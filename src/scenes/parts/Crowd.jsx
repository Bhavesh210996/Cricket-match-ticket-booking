// Overview crowd — sold seats rendered as low-poly instanced capsules + heads
// (+ a separate hair layer), one set of InstancedMeshes per stand (as in the
// original, so the focused stand's crowd can be swapped for <StandSeats>).
// Ported from stadium-view.js `_initScene()` (occupied-seats-become-crowd block).
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { seatPos, isSold } from '../../stadium/seats.js';
import { hash } from '../../stadium/config.js';

const SHIRTS = [0x1b3f77, 0xd9622b, 0xe8e9ee, 0x2a2f3a, 0x3d7bd9, 0xb03a3a, 0xd9c25a];
const SKINS = [0x8d6a4f, 0x6f4f39, 0xb08968, 0x513826, 0x9c7a5b];
const HAIR = [0x0a0a0a, 0x161314, 0x2c1e15, 0x3a2c22, 0x4a4a4a]; // black / dark brown / dark grey
const BALD_FRACTION = 0.1;
const ZERO = new THREE.Vector3(0, 0, 0);

// shared, created once — every stand's crowd instances the same geometry
const BODY_GEO = new THREE.CapsuleGeometry(0.2, 0.44, 2, 6);
const HEAD_GEO = (() => {
  const g = new THREE.SphereGeometry(0.14, 7, 5);
  g.scale(0.95, 1.16, 1); // subtle oval, not a ball
  return g;
})();
const HAIR_GEO = (() => {
  // low-poly cap over the crown + upper back (no per-instance facing here)
  const g = new THREE.SphereGeometry(0.152, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
  g.scale(1, 1.18, 1);
  g.translate(0, 0.02, 0);
  return g;
})();

function StandCrowd({ st }) {
  const bodies = useRef();
  const heads = useRef();
  const hair = useRef();

  const pts = useMemo(() => {
    const out = [];
    for (let r = 0; r < st.rows; r++)
      for (let c = 0; c < st.cols; c++)
        if (isSold(st, r, c)) out.push(seatPos(st, r, c));
    return out;
  }, [st]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    pts.forEach((p, i) => {
      m.makeTranslation(p.x, p.y + 0.4, p.z);
      bodies.current.setMatrixAt(i, m);
      col.setHex(SHIRTS[Math.floor(hash(st.sector, i, 7) * SHIRTS.length)])
        .multiplyScalar(0.28 + hash(i, st.sector, 3) * 0.34);
      bodies.current.setColorAt(i, col);

      m.makeTranslation(p.x, p.y + 0.78, p.z);
      heads.current.setMatrixAt(i, m);
      col.setHex(SKINS[Math.floor(hash(st.sector, i, 11) * SKINS.length)])
        .multiplyScalar(0.5 + hash(i, st.sector, 5) * 0.3);
      heads.current.setColorAt(i, col);

      if (hash(st.sector + 5, i, 3) < BALD_FRACTION) m.scale(ZERO); // bald: hide hair
      hair.current.setMatrixAt(i, m);
      col.setHex(HAIR[Math.floor(hash(st.sector + 6, i, 2) * HAIR.length)])
        .multiplyScalar(0.7 + hash(i, st.sector, 4) * 0.5);
      hair.current.setColorAt(i, col);
    });
    for (const ref of [bodies, heads, hair]) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [pts, st]);

  return (
    <>
      <instancedMesh ref={bodies} args={[BODY_GEO, undefined, pts.length]}>
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[HEAD_GEO, undefined, pts.length]}>
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={hair} args={[HAIR_GEO, undefined, pts.length]}>
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </>
  );
}

export default function Crowd() {
  const stands = useBookingStore((s) => s.stands);
  const focusedStandId = useBookingStore((s) => s.focusedStandId);

  return stands
    .filter((st) => st.id !== focusedStandId)
    .map((st) => <StandCrowd key={st.id} st={st} />);
}
