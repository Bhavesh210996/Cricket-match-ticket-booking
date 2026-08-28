// POV-mode seat detail. Two pieces:
//   1. a thin "your view from" bar at the top (back button + drag hint)
//   2. a bottom panel with a slim always-visible bar — seat label,
//      tier/distance/eye-height, price, quality badge — plus a chevron at the
//      top that collapses/expands the description, sun-exposure timeline and
//      action buttons. Opens EXPANDED (and re-expands on every new seat); the
//      user can collapse it down to the slim bar to clear the horizon view.
import { useState } from 'react';
import { useBookingStore } from '../../store/useBookingStore.js';
import { primeReplayAudio } from '../../stadium/replaySound.js';
import { captureSeatPov } from '../../stadium/snapshot.js';
import { seatSunTimeline, parseMatchStart, formatHour } from '../../stadium/sun.js';
import { shareSeatCard } from './shareCard.js';
import { MATCH } from './mockData.js';
import { useViewport } from './useViewport.js';
import { COND, ACCENT, PANEL_BASE, money, qualityStyle, seatNote, iconBtn } from './tokens.js';

// per-band tint for the sun-exposure summary
const SUN_BAND_TINT = {
  glare: { background: 'rgba(224,110,60,.2)', color: '#f0a35f' },
  direct: { background: 'rgba(245,176,42,.16)', color: '#f5b02a' },
  partial: { background: 'rgba(150,170,200,.14)', color: '#b7c6dd' },
  shaded: { background: 'rgba(120,160,200,.14)', color: '#a8c4de' },
  night: { background: 'rgba(215,255,62,.12)', color: ACCENT },
};

// resolved once — the mock fixture's scheduled start trims the sample window
const MATCH_START = parseMatchStart(MATCH.date);

const EYE_HEIGHT_M = 1.18; // constant from the reference design

const secondaryBtn = {
  width: '100%',
  padding: 11,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'rgba(255,255,255,.04)',
  color: '#eaf0f8',
  fontFamily: COND,
  fontWeight: 600,
  fontSize: 13.5,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

export default function SeatInfoCard() {
  const mode = useBookingStore((s) => s.mode);
  const seat = useBookingStore((s) => s.selectedSeat);
  const stands = useBookingStore((s) => s.stands);
  const compareList = useBookingStore((s) => s.compareList);
  const deselectSeat = useBookingStore((s) => s.deselectSeat);
  const addToCompare = useBookingStore((s) => s.addToCompare);
  const openCompare = useBookingStore((s) => s.openCompare);
  const startReplay = useBookingStore((s) => s.startReplay);
  const replaying = useBookingStore((s) => s.replaying);
  const vp = useViewport();

  // Opens expanded, except on a landscape phone where there's no vertical room —
  // there it opens collapsed so the seat view stays visible.
  const openExpanded = !vp.isShort;
  const [expanded, setExpanded] = useState(openExpanded);

  // re-apply the default whenever the selected seat changes (render-phase reset
  // on a changed key — no effect, no cascading render)
  const [lastKey, setLastKey] = useState(seat?.key);
  if (seat?.key !== lastKey) {
    setLastKey(seat?.key);
    setExpanded(openExpanded);
  }

  if (mode !== 'pov' || !seat) return null;

  const short = `${seat.block} · Row ${seat.rowLabel} · Seat ${seat.num}`;
  const q = qualityStyle(seat.quality);
  const inList = compareList.some((c) => c.key === seat.key);
  const note = seatNote(seat);

  // Automatic per-seat sun-exposure timeline. Pure background calc from the
  // simplified sun formula — no time state, decoupled from the scene lighting.
  const sunStand = stands.find((x) => x.id === seat.standId);
  const sunTimeline = seatSunTimeline(seat, sunStand, { startHour: MATCH_START });

  // add this seat (snapshotting its POV) then open the compare screen
  const addAndCompare = () => {
    if (!inList) {
      const st = stands.find((s) => s.id === seat.standId);
      addToCompare(seat, st ? captureSeatPov(st, seat) : null);
    }
    openCompare();
  };

  // composite the seat's POV into a shareable PNG and hand it to the share
  // sheet / a download. Grab a fresh snapshot if this seat has none yet.
  const shareSeat = () => {
    const st = stands.find((s) => s.id === seat.standId);
    const img = seat.povImage || (st ? captureSeatPov(st, seat) : null);
    shareSeatCard(seat, img);
  };

  const book = () => {
    // no real booking flow yet
    console.log('[book]', short, money(seat.price));
    window.alert(`Booking ${short}\n${money(seat.price)} incl. fees`);
  };

  const toggle = () => setExpanded((v) => !v);

  return (
    <>
      {/* "your view from" bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: vp.isShort ? '8px 12px 14px' : '14px 16px 26px',
          background: 'linear-gradient(180deg, rgba(5,8,14,.85) 0%, rgba(5,8,14,0) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          pointerEvents: 'none',
          color: '#eaf0f8',
        }}
      >
        <button style={{ ...iconBtn, fontSize: 15 }} onClick={deselectSeat} aria-label="Back">
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: COND,
              fontSize: 10.5,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            Your view from
          </div>
          <div
            style={{
              fontFamily: COND,
              fontWeight: 700,
              fontSize: vp.isPhone ? 16 : 19,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            {short}
          </div>
        </div>
        {!vp.isShort && (
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 9,
              background: 'rgba(6,8,13,.7)',
              border: '1px solid rgba(255,255,255,.12)',
              fontSize: 10.5,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: '#c3cddc',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Drag to look
          </span>
        )}
      </div>

      {/* bottom panel — slim bar + upward-expanding detail */}
      <div
        style={{
          position: 'absolute',
          left: vp.isPhone ? 12 : 24,
          right: vp.isPhone ? 12 : 'auto',
          bottom: vp.isShort ? 10 : vp.isPhone ? 14 : 24,
          width: vp.isPhone ? 'auto' : 430,
          maxWidth: vp.isPhone ? 'none' : 'calc(100vw - 48px)',
          padding: 16,
          borderRadius: 20,
          pointerEvents: 'auto',
          color: '#eaf0f8',
          animation: 'fadeUp .35s ease both',
          ...PANEL_BASE,
        }}
      >
        {/* the always-visible slim bar — the whole thing toggles expand */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse seat details' : 'Expand seat details'}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          {/* chevron control — top-centre, clearly visible; whole bar toggles */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 22,
                borderRadius: 11,
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.16)',
              }}
            >
              <svg
                width="14"
                height="9"
                viewBox="0 0 14 9"
                fill="none"
                style={{
                  display: 'block',
                  transform: expanded ? 'none' : 'rotate(180deg)',
                  transition: 'transform .3s ease',
                }}
              >
                <path
                  d="M1 1.5 L7 7.5 L13 1.5"
                  stroke="#eaf0f8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: COND,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                {short}
              </div>
              <div style={{ fontSize: 12, color: '#93a1b6', marginTop: 3 }}>
                {seat.tierLabel} tier · {seat.distance}m from the pitch centre · eye height{' '}
                {EYE_HEIGHT_M}m
              </div>
              <div style={{ marginTop: 9 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '5px 10px',
                    borderRadius: 8,
                    fontFamily: COND,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    ...q,
                  }}
                >
                  {seat.quality} view
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: COND,
                  fontWeight: 700,
                  fontSize: 26,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {money(seat.price)}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: '#7d8ba1',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                per seat
              </div>
            </div>
          </div>
        </div>

        {/* expandable detail — grid 0fr→1fr animates height, card is bottom-
            anchored so it grows upward from the slim bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: 'grid-template-rows .4s cubic-bezier(.4, 0, .2, 1)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity .28s ease',
                paddingTop: 14,
                marginTop: 14,
                borderTop: '1px solid rgba(255,255,255,.09)',
                // cap so the expanded card can't exceed the viewport; inner
                // content scrolls. Tighter reserve on short / phone screens.
                maxHeight: `calc(100dvh - ${vp.isShort ? 84 : vp.isPhone ? 116 : 150}px)`,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              {note && (
                <div style={{ fontSize: 12, color: '#8b98ac', lineHeight: 1.45 }}>{note}</div>
              )}

              {/* automatic per-seat sun-exposure timeline across the match window */}
              {sunTimeline.length > 0 && (
                <div style={{ marginTop: note ? 12 : 0 }}>
                  <div
                    style={{
                      fontFamily: COND,
                      fontSize: 10,
                      letterSpacing: '.2em',
                      textTransform: 'uppercase',
                      color: '#66738a',
                      marginBottom: 6,
                    }}
                  >
                    Sun exposure
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {sunTimeline.map((b, i) => (
                      <span
                        key={i}
                        title={`${b.label} · ${formatHour(b.start)}–${formatHour(b.end)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 8px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          ...SUN_BAND_TINT[b.category],
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 12 }}>
                          {b.emoji}
                        </span>
                        {b.label}
                        <span
                          style={{ opacity: 0.7, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatHour(b.start)}–{formatHour(b.end)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={deselectSeat}
                  style={{
                    flex: 1,
                    padding: 13,
                    borderRadius: 13,
                    border: '1px solid rgba(255,255,255,.16)',
                    background: 'rgba(255,255,255,.04)',
                    color: '#eaf0f8',
                    fontFamily: COND,
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Try another seat
                </button>
                <button
                  onClick={book}
                  style={{
                    flex: 1.25,
                    padding: 13,
                    border: 'none',
                    borderRadius: 13,
                    background: ACCENT,
                    color: '#06080d',
                    fontFamily: COND,
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Book this seat
                </button>
              </div>

              <button
                onClick={() => {
                  // resume the AudioContext inside the user gesture so the very
                  // first click makes sound (no second interaction needed)
                  primeReplayAudio();
                  startReplay();
                }}
                disabled={replaying}
                style={{
                  ...secondaryBtn,
                  marginTop: 10,
                  border: `1px solid rgba(215,255,62,${replaying ? '.2' : '.35'})`,
                  background: 'rgba(215,255,62,.08)',
                  color: ACCENT,
                  fontWeight: 700,
                  cursor: replaying ? 'default' : 'pointer',
                  opacity: replaying ? 0.6 : 1,
                }}
              >
                {replaying ? 'Reliving the moment…' : '▶ Relive the moment'}
              </button>

              <button onClick={shareSeat} style={{ ...secondaryBtn, marginTop: 8 }}>
                ⤴ Share this seat
              </button>

              <button
                onClick={addAndCompare}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: 9,
                  border: 'none',
                  borderRadius: 10,
                  background: 'transparent',
                  color: ACCENT,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {inList
                  ? `View your shortlist (${compareList.length})`
                  : `+ Add to compare (${compareList.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
