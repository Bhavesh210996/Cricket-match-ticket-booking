// Ported verbatim from stadium-view.js (Claude Design export).
// Only change: `import * as THREE from 'three'` (bundled) instead of the
// unpkg ESM URL, and EX/EZ pulled from ./config.js.

import * as THREE from 'three';
import { EX, EZ } from './config.js';

export function loft(a0, a1, section, segs = 26) {
  const pos = [], idx = [], uv = [], n = section.length;
  for (let s = 0; s <= segs; s++) {
    const t = s / segs, a = a0 + (a1 - a0) * t, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < n; k++) {
      pos.push(ca * section[k][0] * EX, section[k][1], sa * section[k][0] * EZ);
      uv.push(t * 6, k / (n - 1));
    }
  }
  for (let s = 0; s < segs; s++)
    for (let k = 0; k < n - 1; k++) {
      const a = s * n + k, b = a + n;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function bucketSeat() {
  const pan = new THREE.BoxGeometry(0.92, 0.11, 0.8);
  pan.translate(0, 0.34, -0.02);
  return pan;
}

export function bucketBack() {
  const back = new THREE.CylinderGeometry(0.5, 0.5, 0.78, 10, 1, true, -0.62, 1.24);
  back.translate(0, 0.74, -0.08);
  return back;
}

export function mergeGeos(list) {
  let n = 0;
  const parts = list.map((g) => { const p = g.index ? g.toNonIndexed() : g; n += p.attributes.position.count; return p; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let off = 0;
  parts.forEach((p) => {
    pos.set(p.attributes.position.array, off * 3);
    nor.set(p.attributes.normal.array, off * 3);
    off += p.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

/* low-poly seated body: tapered torso with a flat shoulder line + arms bent 90° on the lap.
   Local -Z faces the pitch; legs are omitted (hidden by the seat back in front). */
export function occupantBody() {
  const parts = [];

  const torso = new THREE.CylinderGeometry(0.27, 0.2, 0.46, 4, 1);
  torso.rotateY(Math.PI / 4);
  torso.scale(1.16, 1, 0.76);
  torso.translate(0, 0.63, -0.04);
  parts.push(torso);

  const shoulders = new THREE.BoxGeometry(0.62, 0.09, 0.3);
  shoulders.translate(0, 0.88, -0.04);
  parts.push(shoulders);

  // (neck lives in occupantHead() now — skin-toned + a real gap above the shoulders)

  [-1, 1].forEach((sx) => {
    const upper = new THREE.BoxGeometry(0.11, 0.28, 0.13);
    upper.translate(sx * 0.31, 0.73, -0.02);
    parts.push(upper);
    const fore = new THREE.BoxGeometry(0.11, 0.11, 0.3);
    fore.translate(sx * 0.31, 0.6, -0.2);
    parts.push(fore);
    const hand = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    hand.translate(sx * 0.24, 0.58, -0.36);
    parts.push(hand);
  });

  return mergeGeos(parts);
}

// Skin-toned head unit: a short neck cylinder bridging the shoulders, then a
// subtly oval skull (a touch taller than wide) lifted so a real neck gap shows
// instead of a ball fused onto the shoulder line. One instanced mesh, one
// instance colour — neck + head share the skin tone. Local -Z faces the pitch.
export function occupantHead() {
  const neck = new THREE.CylinderGeometry(0.062, 0.082, 0.14, 6, 1, true);
  neck.translate(0, 0.985, -0.05);
  const head = new THREE.SphereGeometry(0.16, 8, 6);
  head.scale(0.95, 1.2, 1.0); // subtle oval silhouette, not a ball
  head.translate(0, 1.19, -0.055);
  return mergeGeos([neck, head]);
}

// Separate low-poly hair shell over the crown + back of the head, concentric
// with occupantHead()'s skull and a hair's-width proud of it. Open at the face
// and underside (a phi/theta wedge) so it reads from the behind/above angles
// the crowd is seen from. Its own instanced mesh + instance colour (hair
// tones); callers collapse the instance to zero scale for the bald fraction.
export function occupantHair() {
  const g = new THREE.SphereGeometry(
    0.178, 9, 5,
    -Math.PI * 0.18, Math.PI * 1.36, // phi: wrap the back, a little onto the sides, open at the face
    0, Math.PI * 0.66,               // theta: crown down past where the ears would be
  );
  g.scale(1.03, 1.22, 1.1);
  g.translate(0, 1.19, -0.045);
  return g;
}
