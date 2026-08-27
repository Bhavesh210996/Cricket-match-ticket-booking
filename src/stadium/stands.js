// Ported verbatim from stadium-view.js (Claude Design export).
// `buildStands()` returns the plain stand descriptors (arc, radii, row/col
// counts, tier, deck, cross-section). No three.js dependency — the `mesh`
// field the original attached later is added by the R3F <Stands> component.

import { SECTORS, LETTERS, PREMIUM_SECTORS, BERM_SECTORS, TAU } from './config.js';

export function buildStands() {
  const stands = [];
  for (let i = 0; i < SECTORS; i++) {
    const gap = 0.012;
    const a0 = (i / SECTORS) * TAU + gap;
    const a1 = ((i + 1) / SECTORS) * TAU - gap;
    const letter = LETTERS[i];
    stands.push({
      id: letter + '1', sector: i, letter, deck: 'lower',
      tier: PREMIUM_SECTORS.includes(i) ? 'premium' : 'general',
      a0, a1, r0: 88, y0: 3.2, r1: 112, y1: 11, rows: 14, cols: 26,
      section: [[88, 0], [88, 3.2], [112, 11], [112, 13.4]],
    });
    const berm = BERM_SECTORS.includes(i);
    stands.push({
      id: letter + '2', sector: i, letter, deck: 'upper',
      tier: berm ? 'berm' : 'club',
      a0, a1, r0: 112, y0: 15.5, r1: 140, y1: 31, rows: 18, cols: 30,
      section: [[112, 11], [112, 15.5], [140, 31], [140, 34.4]],
    });
  }
  return stands;
}
