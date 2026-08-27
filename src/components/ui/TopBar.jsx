// Overview-mode fixture header: competition eyebrow, teams, date/venue, close
// (X) button, total-availability pill. Reference: isOverview top block in
// `Cricket Seat Preview.dc.html`.
import { useBookingStore } from '../../store/useBookingStore.js';
import { useTierConfig } from './useTierConfig.js';
import { MATCH } from './mockData.js';
import { COND, ACCENT, iconBtn } from './tokens.js';

export default function TopBar() {
  const mode = useBookingStore((s) => s.mode);
  const backToOverview = useBookingStore((s) => s.backToOverview);
  const tiers = useTierConfig();

  if (mode !== 'overview') return null;

  const totalAvail = tiers.reduce((a, t) => a + t.avail, 0);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '14px 16px 30px',
        background:
          'linear-gradient(180deg, rgba(5,8,14,.94) 0%, rgba(5,8,14,.72) 55%, rgba(5,8,14,0) 100%)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <button style={iconBtn} onClick={backToOverview} aria-label="Close">
        ×
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: COND,
            fontSize: 11,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: ACCENT,
          }}
        >
          {MATCH.competition}
        </div>
        <div
          style={{
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: '.01em',
          }}
        >
          {MATCH.homeTeam} <span style={{ color: '#66738a' }}>v</span> {MATCH.awayTeam}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#93a1b6',
            marginTop: 3,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>{MATCH.date}</span>
          <span style={{ color: '#3d4757' }}>|</span>
          <span>{MATCH.venue}</span>
        </div>
      </div>

      <div
        style={{
          pointerEvents: 'auto',
          padding: '7px 11px',
          borderRadius: 10,
          border: '1px solid rgba(215,255,62,.3)',
          background: 'rgba(215,255,62,.1)',
          fontFamily: COND,
          fontSize: 12,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: ACCENT,
          whiteSpace: 'nowrap',
        }}
      >
        {totalAvail.toLocaleString('en-IN')} seats
      </div>
    </div>
  );
}
