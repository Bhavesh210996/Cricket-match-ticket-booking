// Detailed seat layer for the focused stand: instanced bucket pans + backs,
// instanced occupants on sold seats, and an invisible full-seat hit volume so
// pan + back (+ the gap between) select as one unit.
// First tap on an unsold seat previews it (highlight + chip, no camera move);
// tapping it again — or the chip's View — confirms and flies to POV.
// Ported from stadium-view.js `_showSeats(st)` + `markSelected(seat)` + `_tap()`.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { bucketSeat, bucketBack, occupantBody, occupantHead, occupantHair } from '../../stadium/geometry.js';
import { seatPos, isSold, seatData } from '../../stadium/seats.js';
import { TIERS, ACCENT, hash } from '../../stadium/config.js';

const WEAR = [0x1b3f77, 0xd9622b, 0xe4e7ee, 0x2f3644, 0x3d7bd9, 0xb03a3a, 0xd9c25a, 0x2fa35c, 0x7a4fa3];
const SKINS = [0x9c7550, 0x7a563c, 0xb99070, 0x5e422e];
const HAIR = [0x0a0a0a, 0x161314, 0x2c1e15, 0x3a2c22, 0x4a4a4a]; // black / dark brown / dark grey
const BALD_FRACTION = 0.1;
const SOLD_SEAT = 0x323a48;
const ZERO = new THREE.Vector3(0, 0, 0);

// full-seat click volume — envelopes pan + backrest (from the original `_showSeats` hitGeo)
function hitBox() {
  const g = new THREE.BoxGeometry(1, 1.1, 0.95);
  g.translate(0, 0.6, 0);
  return g;
}

export default function StandSeats() {
  const stands = useBookingStore((s) => s.stands);
  const focusedStandId = useBookingStore((s) => s.focusedStandId);
  const selectedSeat = useBookingStore((s) => s.selectedSeat);
  const pendingSeat = useBookingStore((s) => s.pendingSeat);
  const previewSeat = useBookingStore((s) => s.previewSeat);

  // the seat drawn in accent: pending (stand mode) takes priority, else the
  // committed seat (so it stays lit through POV).
  const markedSeat = pendingSeat ?? selectedSeat;

  const st = useMemo(
    () => stands.find((x) => x.id === focusedStandId) || null,
    [stands, focusedStandId],
  );

  // shared geometry (independent of which stand is focused)
  const geo = useMemo(
    () => ({
      pan: bucketSeat(),
      back: bucketBack(),
      torso: occupantBody(),
      head: occupantHead(),
      hair: occupantHair(),
      hit: hitBox(),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  // per-seat transforms + sold index for the focused stand
  const build = useMemo(() => {
    if (!st) return null;
    const one = new THREE.Vector3(1, 1, 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const mats = [];
    const index = [];
    let soldCount = 0;
    for (let r = 0; r < st.rows; r++)
      for (let c = 0; c < st.cols; c++) {
        const p = seatPos(st, r, c);
        e.set(0, Math.atan2(p.x, p.z), 0);
        q.setFromEuler(e);
        m.compose(p, q, one);
        mats.push(m.clone());
        const sold = isSold(st, r, c);
        if (sold) soldCount++;
        index.push({ row: r, col: c, sold });
      }
    return { mats, index, count: mats.length, soldCount };
  }, [st]);

  const panRef = useRef();
  const backRef = useRef();
  const torsoRef = useRef();
  const headRef = useRef();
  const hairRef = useRef();
  const hitRef = useRef();

  useLayoutEffect(() => {
    if (!st || !build || !panRef.current) return;
    const tierCol = new THREE.Color(TIERS[st.tier].color);
    const soldCol = new THREE.Color(SOLD_SEAT);
    const accent = new THREE.Color(ACCENT);
    const col = new THREE.Color();
    const hairMat = new THREE.Matrix4();

    let o = 0;
    build.index.forEach((s, i) => {
      const mat = build.mats[i];
      panRef.current.setMatrixAt(i, mat);
      backRef.current.setMatrixAt(i, mat);
      hitRef.current.setMatrixAt(i, mat);

      const sel =
        markedSeat &&
        markedSeat.standId === st.id &&
        s.row === markedSeat.row - 1 &&
        s.col === markedSeat.num - 1;

      col.copy(sel ? accent : s.sold ? soldCol : tierCol.clone().multiplyScalar(1.12));
      panRef.current.setColorAt(i, col);
      backRef.current.setColorAt(i, sel || s.sold ? col : col.clone().multiplyScalar(0.86));

      if (s.sold) {
        torsoRef.current.setMatrixAt(o, mat);
        headRef.current.setMatrixAt(o, mat);
        col
          .setHex(WEAR[Math.floor(hash(st.sector + 3, s.row, s.col) * WEAR.length)])
          .multiplyScalar(0.68 + hash(s.row, s.col, 9) * 0.3);
        torsoRef.current.setColorAt(o, col);
        col
          .setHex(SKINS[Math.floor(hash(st.sector + 8, s.row, s.col) * SKINS.length)])
          .multiplyScalar(0.74);
        headRef.current.setColorAt(o, col);

        // hair: darker separate layer, with a bald fraction collapsed to nothing
        if (hash(st.sector + 5, s.row, s.col) < BALD_FRACTION) {
          hairRef.current.setMatrixAt(o, hairMat.copy(mat).scale(ZERO));
        } else {
          hairRef.current.setMatrixAt(o, mat);
        }
        col
          .setHex(HAIR[Math.floor(hash(st.sector + 6, s.row, s.col) * HAIR.length)])
          .multiplyScalar(0.7 + hash(s.row, s.col, 4) * 0.5);
        hairRef.current.setColorAt(o, col);

        o++;
      }
    });

    hitRef.current.instanceMatrix.needsUpdate = true;
    for (const ref of [panRef, backRef, torsoRef, headRef, hairRef]) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [st, build, markedSeat]);

  if (!st || !build) return null;

  const onTap = (e) => {
    e.stopPropagation();
    const s = build.index[e.instanceId];
    if (!s || s.sold) return;
    previewSeat(seatData(st, s.row, s.col));
  };

  return (
    <group key={st.id}>
      <instancedMesh ref={panRef} args={[geo.pan, undefined, build.count]}>
        <meshStandardMaterial roughness={0.52} metalness={0.06} />
      </instancedMesh>
      <instancedMesh ref={backRef} args={[geo.back, undefined, build.count]}>
        <meshStandardMaterial roughness={0.52} metalness={0.06} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={torsoRef} args={[geo.torso, undefined, build.soldCount]}>
        <meshStandardMaterial roughness={0.97} metalness={0} flatShading />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[geo.head, undefined, build.soldCount]}>
        <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
      <instancedMesh ref={hairRef} args={[geo.hair, undefined, build.soldCount]}>
        <meshStandardMaterial roughness={1} metalness={0} flatShading />
      </instancedMesh>

      {/* invisible: one click target covering the whole seat */}
      <instancedMesh
        ref={hitRef}
        args={[geo.hit, undefined, build.count]}
        onClick={onTap}
        renderOrder={-2}
      >
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
