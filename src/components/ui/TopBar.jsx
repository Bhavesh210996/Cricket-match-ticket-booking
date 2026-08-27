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
        // flows inside <OverviewTopStack>; the gradient still lives here so the
        // fade sits behind the fixture header only, as on desktop
        position: 'relative',
        padding: '14px 16px 16px',
        background:
          'linear-gradient(180deg, rgba(5,8,14,.94) 0%, rgba(5,8,14,.72) 60%, rgba(5,8,14,0) 100%)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <button style={{ ...iconBtn, flexShrink: 0 }} onClick={backToOverview} aria-label="Close">
        ×
      </button>

      {/* pill is taken out of flow so it can't squeeze the title on a phone */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 96 }}>
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
            // 24px on desktop; scales down on narrow phones so it wraps to at
            // most two lines instead of three
            fontSize: 'clamp(19px, 5.4vw, 24px)',
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
          position: 'absolute',
          top: 14,
          right: 16,
          pointerEvents: 'auto',
          padding: '7px 11px',
          borderRadius: 10,
          border: '1px solid rgba(215,255,62,.3)',
          background: 'rgba(215,255,62,.1)',
          fontFamily: COND,
          fontSize: 'clamp(10px, 2.9vw, 12px)',
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
