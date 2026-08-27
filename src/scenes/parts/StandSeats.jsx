// Seat layer for EVERY stand — instanced bucket pans + backs, colour-coded for
// Available / Sold / Selected / Shortlisted, plus an invisible full-seat hit
// volume so pan + back (+ the gap between) act as one click target. Rendered for
// all stands so seat status (and shortlist glow) is visible everywhere, not just
// the stand the camera has flown into.
//
// Interaction is gated by focus: a tap anywhere on an un-focused stand flies the
// camera to it (like clicking the stand shell); only once a stand is the one in
// focus do per-seat taps preview / select. Occupant detail is tiered the same
// way (for perf) — the focused stand gets the full detailed occupant geometry
// (torso/head/hair); other stands rely on <Crowd> for the cheap capsule fill.
//
// On the focused stand: first tap on an unsold seat previews it (highlight +
// chip, no camera move); tapping it again — or the chip's View — flies to POV.
// Ported from stadium-view.js `_showSeats(st)` + `markSelected(seat)` + `_tap()`.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { bucketSeat, bucketBack, occupantBody, occupantHead, occupantHair } from '../../stadium/geometry.js';
import { badgeTexture } from '../../stadium/textures.js';
import { seatPos, isSold, seatData } from '../../stadium/seats.js';
import { SEAT_AVAILABLE, SEAT_SOLD, ACCENT, COMPARE, hash } from '../../stadium/config.js';

const WEAR = [0x1b3f77, 0xd9622b, 0xe4e7ee, 0x2f3644, 0x3d7bd9, 0xb03a3a, 0xd9c25a, 0x2fa35c, 0x7a4fa3];
const SKINS = [0x9c7550, 0x7a563c, 0xb99070, 0x5e422e];
const HAIR = [0x0a0a0a, 0x161314, 0x2c1e15, 0x3a2c22, 0x4a4a4a]; // black / dark brown / dark grey
const BALD_FRACTION = 0.1;
const ZERO = new THREE.Vector3(0, 0, 0);

// full-seat click volume — envelopes pan + backrest (from the original `_showSeats` hitGeo)
function hitBox() {
  const g = new THREE.BoxGeometry(1, 1.1, 0.95);
  g.translate(0, 0.6, 0);
  return g;
}

// slightly oversized shell drawn additively around a shortlisted seat — reads as
// an outline / glow so "in compare" seats stand out among many visible seats.
function glowBox() {
  const g = new THREE.BoxGeometry(1.16, 1.22, 1.08);
  g.translate(0, 0.62, 0);
  return g;
}

// Shared, created once — every stand instances the same buffers (as <Crowd>
// does). App-lifetime singletons, so no per-stand allocation or disposal.
const GEO = {
  pan: bucketSeat(),
  back: bucketBack(),
  torso: occupantBody(),
  head: occupantHead(),
  hair: occupantHair(),
  hit: hitBox(),
  glow: glowBox(),
};
const BADGE_TEX = [1, 2, 3].map((n) => badgeTexture(n));

// One stand's seats. `focused` (the stand the camera has flown into) adds the
// full occupant geometry on sold seats and enables per-seat tap/preview; on any
// other stand the seats render bare (pans + backs, <Crowd> supplies the fill)
// and a tap anywhere just flies the camera to that stand.
function StandSeatLayer({ st, focused }) {
  const previewSeat = useBookingStore((s) => s.previewSeat);
  const selectStand = useBookingStore((s) => s.selectStand);

  // the accent-lit seat (pending in stand mode, else the committed seat) — but
  // only if it belongs to THIS stand. A plain string keeps the subscription
  // cheap: every layer re-renders on a select, only the relevant one re-colours.
  const markedKey = useBookingStore((s) => {
    const m = s.pendingSeat ?? s.selectedSeat;
    return m && m.standId === st.id ? `${m.row - 1}-${m.num - 1}` : null;
  });

  // this stand's shortlist entries as "row-col=order" (order is 1-based across
  // the whole shortlist), joined into one stable string for the same reason.
  const compareSig = useBookingStore((s) => {
    const parts = [];
    s.compareList.forEach((c, i) => {
      if (c.standId === st.id) parts.push(`${c.row - 1}-${c.num - 1}=${i + 1}`);
    });
    return parts.join('|');
  });

  const compareMap = useMemo(() => {
    const m = new Map();
    if (compareSig)
      compareSig.split('|').forEach((p) => {
        const [rc, order] = p.split('=');
        m.set(rc, Number(order));
      });
    return m;
  }, [compareSig]);

  // per-seat transforms + sold flag for this stand
  const build = useMemo(() => {
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

  // shortlisted seats in this stand: transform + 1-based order, for the additive
  // glow shell and the floating number badge.
  const glow = useMemo(() => {
    const mats = [];
    const orders = [];
    build.index.forEach((s, i) => {
      const order = compareMap.get(`${s.row}-${s.col}`);
      if (order != null) {
        mats.push(build.mats[i]);
        orders.push(order);
      }
    });
    return { mats, orders };
  }, [build, compareMap]);

  const panRef = useRef();
  const backRef = useRef();
  const torsoRef = useRef();
  const headRef = useRef();
  const hairRef = useRef();
  const hitRef = useRef();
  const glowRef = useRef();

  // seat transforms — set once per stand (colour is a separate effect)
  useLayoutEffect(() => {
    if (!panRef.current) return;
    build.mats.forEach((mat, i) => {
      panRef.current.setMatrixAt(i, mat);
      backRef.current.setMatrixAt(i, mat);
      hitRef.current.setMatrixAt(i, mat);
    });
    panRef.current.instanceMatrix.needsUpdate = true;
    backRef.current.instanceMatrix.needsUpdate = true;
    hitRef.current.instanceMatrix.needsUpdate = true;
  }, [build]);

  // seat colours — re-runs only when this stand's marked / shortlisted seats change.
  // Seat STATE is the only thing painted here; tier identity lives on the stand
  // shell / awning tint, never on the seat mesh — so the palette is one closed
  // set (red / dark / lime / cyan) that can't collide with a tier colour.
  useLayoutEffect(() => {
    if (!panRef.current) return;
    const availCol = new THREE.Color(SEAT_AVAILABLE);
    const soldCol = new THREE.Color(SEAT_SOLD);
    const accent = new THREE.Color(ACCENT);
    const compareCol = new THREE.Color(COMPARE);
    const col = new THREE.Color();

    build.index.forEach((s, i) => {
      const sel = markedKey === `${s.row}-${s.col}`;
      const shortlisted = compareMap.has(`${s.row}-${s.col}`);
      // selected/pending wins, then shortlisted, then sold, then plain available
      col.copy(sel ? accent : shortlisted ? compareCol : s.sold ? soldCol : availCol);
      panRef.current.setColorAt(i, col);
      backRef.current.setColorAt(
        i,
        sel || s.sold || shortlisted ? col : col.clone().multiplyScalar(0.86),
      );
    });

    panRef.current.instanceColor.needsUpdate = true;
    backRef.current.instanceColor.needsUpdate = true;
  }, [build, markedKey, compareMap]);

  // detailed occupants on sold seats — focused stand only
  useLayoutEffect(() => {
    if (!focused || !torsoRef.current) return;
    const col = new THREE.Color();
    const hairMat = new THREE.Matrix4();

    let o = 0;
    build.index.forEach((s, i) => {
      if (!s.sold) return;
      const mat = build.mats[i];
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
    });

    for (const ref of [torsoRef, headRef, hairRef]) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [focused, build, st]);

  // position the additive glow shells over the current shortlist
  useLayoutEffect(() => {
    if (!glowRef.current) return;
    glow.mats.forEach((m, i) => glowRef.current.setMatrixAt(i, m));
    glowRef.current.instanceMatrix.needsUpdate = true;
  }, [glow]);

  const onTap = (e) => {
    e.stopPropagation();
    // A tap anywhere on an un-focused stand just flies the camera to it — no
    // seat is picked until the stand is the one in focus.
    if (!focused) {
      selectStand(st.id);
      return;
    }
    const s = build.index[e.instanceId];
    if (!s || s.sold) return;
    previewSeat(seatData(st, s.row, s.col));
  };

  return (
    <group>
      <instancedMesh ref={panRef} args={[GEO.pan, undefined, build.count]}>
        <meshStandardMaterial roughness={0.52} metalness={0.06} />
      </instancedMesh>
      <instancedMesh ref={backRef} args={[GEO.back, undefined, build.count]}>
        <meshStandardMaterial roughness={0.52} metalness={0.06} side={THREE.DoubleSide} />
      </instancedMesh>

      {focused && (
        <>
          <instancedMesh ref={torsoRef} args={[GEO.torso, undefined, build.soldCount]}>
            <meshStandardMaterial roughness={0.97} metalness={0} flatShading />
          </instancedMesh>
          <instancedMesh ref={headRef} args={[GEO.head, undefined, build.soldCount]}>
            <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
          </instancedMesh>
          <instancedMesh ref={hairRef} args={[GEO.hair, undefined, build.soldCount]}>
            <meshStandardMaterial roughness={1} metalness={0} flatShading />
          </instancedMesh>
        </>
      )}

      {/* invisible: one click target covering the whole seat */}
      <instancedMesh
        ref={hitRef}
        args={[GEO.hit, undefined, build.count]}
        onClick={onTap}
        renderOrder={-2}
      >
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>

      {/* "In compare" state: additive outline shell + floating order badge.
          At most 3 of each — cheap, and only present while seats are shortlisted. */}
      {glow.mats.length > 0 && (
        <instancedMesh
          key={`glow-${glow.mats.length}`}
          ref={glowRef}
          args={[GEO.glow, undefined, glow.mats.length]}
          renderOrder={-1}
        >
          <meshBasicMaterial
            color={COMPARE}
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}
      {glow.mats.map((m, i) => {
        const p = new THREE.Vector3().setFromMatrixPosition(m);
        return (
          <sprite key={`badge-${i}`} position={[p.x, p.y + 1.9, p.z]} scale={[0.85, 0.85, 0.85]}>
            <spriteMaterial
              map={BADGE_TEX[glow.orders[i] - 1]}
              transparent
              depthWrite={false}
              depthTest={false}
            />
          </sprite>
        );
      })}
    </group>
  );
}

export default function StandSeats() {
  const stands = useBookingStore((s) => s.stands);
  const focusedStandId = useBookingStore((s) => s.focusedStandId);

  return stands.map((st) => (
    <StandSeatLayer key={st.id} st={st} focused={st.id === focusedStandId} />
  ));
}
