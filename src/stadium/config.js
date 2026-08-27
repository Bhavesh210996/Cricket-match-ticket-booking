// Ported verbatim from `Cricket Seat Preview.dc.html` project -> stadium-view.js
// (Claude Design export). Pure data + helpers, no three.js dependency.

/* ---------------------------------------------------------------- config */
export const TIERS = {
  premium: { id: 'premium', label: 'Premium', color: 0xf5b02a, base: 12000, step: 280 },
  club:    { id: 'club',    label: 'Club',    color: 0xe4571c, base: 6800,  step: 150 },
  general: { id: 'general', label: 'General', color: 0x9c2b2b, base: 3200,  step: 95  },
  berm:    { id: 'berm',    label: 'Berm',    color: 0x7e8590, base: 1400,  step: 40  },
};

export const EX = 1;
export const EZ = 1;
export const ACCENT = 0xd7ff3e;
export const LETTERS = 'ABCDEFGHIJKL'.split('');
export const SECTORS = 12;
export const PREMIUM_SECTORS = [2, 3, 9, 10];
export const BERM_SECTORS = [5, 6, 7];
export const TAU = Math.PI * 2;

export function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) ^ 0x5bf03635;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
