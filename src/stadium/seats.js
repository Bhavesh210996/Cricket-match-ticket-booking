// Ported from stadium-view.js (Claude Design export). The original were methods
// on the <stadium-view> web component; here they are pure functions.
//   - `this.seatPos/isSold/isObstructed` -> module-level calls
//   - `this.stands` (in getConfig) -> `stands` argument
// Logic is otherwise byte-for-byte identical.

import * as THREE from 'three';
import { TIERS, PREMIUM_SECTORS, EX, EZ, hash } from './config.js';

export function seatPos(st, row, col) {
  const fr = (row + 0.5) / st.rows;
  const r = st.r0 + (st.r1 - st.r0) * fr;
  const y = st.y0 + (st.y1 - st.y0) * fr;
  const pad = (st.a1 - st.a0) * 0.05;
  const a = st.a0 + pad + ((st.a1 - st.a0) - 2 * pad) * ((col + 0.5) / st.cols);
  return new THREE.Vector3(Math.cos(a) * r * EX, y, Math.sin(a) * r * EZ);
}

export function isSold(st, row, col) {
  const base = st.tier === 'premium' ? 0.42 : st.tier === 'club' ? 0.5 : 0.62;
  return hash(st.sector + (st.deck === 'upper' ? 40 : 0), row, col) < base;
}

export function isObstructed(st, row, col) {
  if (st.deck === 'lower') return row >= st.rows - 2;
  if (st.tier === 'berm') return false;
  return col <= 1 || col >= st.cols - 2;
}

export function seatData(st, row, col) {
  const tier = TIERS[st.tier];
  const price = Math.round((tier.base - row * tier.step) / 50) * 50;
  const obstructed = isObstructed(st, row, col);
  const p = seatPos(st, row, col);
  const dist = Math.round(Math.hypot(p.x, p.z));
  const sideOn = PREMIUM_SECTORS.includes(st.sector);
  const quality = obstructed ? 'Restricted' : (st.deck === 'lower' && row < 9) || (sideOn && row < 12) ? 'Excellent' : 'Good';
  return {
    key: `${st.id}-${row}-${col}`,
    standId: st.id, block: st.id, letter: st.letter, deck: st.deck,
    tier: st.tier, tierLabel: tier.label, tierColor: '#' + new THREE.Color(tier.color).getHexString(),
    row: row + 1, num: col + 1, rowLabel: String.fromCharCode(65 + row), price, quality, obstructed,
    distance: dist, sold: isSold(st, row, col),
  };
}

export function getConfig(stands) {
  const out = { tiers: [], stands: [] };
  Object.values(TIERS).forEach((t) => {
    const list = stands.filter((s) => s.tier === t.id);
    let seats = 0, avail = 0, min = Infinity, max = 0;
    list.forEach((st) => {
      for (let r = 0; r < st.rows; r++) {
        const p = Math.round((t.base - r * t.step) / 50) * 50;
        min = Math.min(min, p); max = Math.max(max, p);
        for (let c = 0; c < st.cols; c++) { seats++; if (!isSold(st, r, c)) avail++; }
      }
    });
    out.tiers.push({
      id: t.id, label: t.label, color: '#' + new THREE.Color(t.color).getHexString(),
      from: min, to: max, seats, avail, blocks: list.map((s) => s.id),
    });
  });
  out.stands = stands.map((s) => ({ id: s.id, tier: s.tier, deck: s.deck, letter: s.letter }));
  return out;
}
