// Design tokens lifted from `Cricket Seat Preview.dc.html` (inline styles in the
// x-dc template + renderVals). Kept as plain objects/strings so the UI matches
// the reference exactly without pulling in a CSS framework.

export const COND = "'Barlow Condensed', system-ui, sans-serif";
export const BODY = "'Barlow', system-ui, sans-serif";
export const ACCENT = '#d7ff3e';
export const COMPARE = '#2ee6ff'; // "in compare" seat state (see config.js COMPARE)

export const PANEL_BASE = {
  background: 'rgba(10,15,24,.93)',
  border: '1px solid rgba(255,255,255,.09)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

// #rrggbb for a TIERS numeric color
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// ₹ 12,000  — matches DCLogic.money() (currency prop defaulted to ₹)
export const money = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

// quality badge palette — from DCLogic._quality()
export function qualityStyle(quality) {
  if (quality === 'Excellent') return { background: 'rgba(215,255,62,.16)', color: ACCENT };
  if (quality === 'Good') return { background: 'rgba(61,123,217,.2)', color: '#8fb8ff' };
  if (quality === 'Restricted') return { background: 'rgba(224,138,60,.18)', color: '#f0ad63' };
  return { background: 'rgba(255,255,255,.06)', color: '#c3cddc' };
}

// sightline note — from DCLogic._note()
export function seatNote(seat) {
  if (!seat) return '';
  if (seat.obstructed || seat.quality === 'Restricted') {
    return seat.deck === 'lower'
      ? 'Upper-deck overhang cuts the sky and high catches'
      : 'Roof support column sits in the sightline';
  }
  if (seat.deck === 'lower' && seat.row <= 3) {
    return 'Front-row railing in frame · square of the wicket';
  }
  return 'Clear sightline over the pitch, full square visible';
}

// round 34px icon button (close / back), from the template
export const iconBtn = {
  width: 34,
  height: 34,
  flex: '0 0 34px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(14,20,31,.8)',
  color: '#eaf0f8',
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  pointerEvents: 'auto',
};
