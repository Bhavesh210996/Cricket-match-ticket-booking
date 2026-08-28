// Floating shortlist pill. Appears as soon as one seat is shortlisted (any
// mode except the compare screen itself) and lets the user jump to the compare
// screen at any time — they don't have to reach the 3-seat cap first.
import { useBookingStore } from '../../store/useBookingStore.js';
import { COND, ACCENT } from './tokens.js';

export default function CompareTray() {
  const mode = useBookingStore((s) => s.mode);
  const compareList = useBookingStore((s) => s.compareList);
  const openCompare = useBookingStore((s) => s.openCompare);

  // hidden on the compare screen itself, and in POV where the seat card already
  // carries a shortlist action and this bottom-centre pill would overlap it
  if (mode === 'compare' || mode === 'pov' || compareList.length === 0) return null;
  const n = compareList.length;

  return (
    <button
      onClick={openCompare}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 22,
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 15px 10px 12px',
        borderRadius: 999,
        border: '1px solid rgba(215,255,62,.4)',
        background: 'rgba(10,15,24,.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 10px 30px rgba(0,0,0,.5)',
        color: '#eaf0f8',
        cursor: 'pointer',
        animation: 'fadeUp .3s ease both',
      }}
    >
      <span style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 2,
              background: i < n ? ACCENT : 'rgba(255,255,255,.16)',
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        {n} seat{n > 1 ? 's' : ''} shortlisted
      </span>
      <span
        style={{
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: ACCENT,
        }}
      >
        Compare ›
      </span>
    </button>
  );
}
