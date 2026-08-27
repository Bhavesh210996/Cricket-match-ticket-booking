// POV-mode seat detail: "your view from" bar + bottom card with label, price,
// distance/eye-height, quality badge, Try another seat / Book this seat, and
// add-to-compare. Reference: isPov top bar + povCardStyle card.
import { useBookingStore } from '../../store/useBookingStore.js';
import { primeReplayAudio } from '../../stadium/replaySound.js';
import { captureSeatPov } from '../../stadium/snapshot.js';
import { shareSeatCard } from './shareCard.js';
import { COND, ACCENT, PANEL_BASE, money, qualityStyle, seatNote, iconBtn } from './tokens.js';

const EYE_HEIGHT_M = 1.18; // constant from the reference design

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

  if (mode !== 'pov' || !seat) return null;

  const short = `${seat.block} · Row ${seat.rowLabel} · Seat ${seat.num}`;
  const q = qualityStyle(seat.quality);
  const inList = compareList.some((c) => c.key === seat.key);

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

  return (
    <>
      {/* "your view from" bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 16px 26px',
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
              fontSize: 19,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            {short}
          </div>
        </div>
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
          }}
        >
          Drag to look
        </span>
      </div>

      {/* detail card */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          bottom: 24,
          width: 430,
          maxWidth: 'calc(100vw - 48px)',
          padding: 18,
          borderRadius: 20,
          pointerEvents: 'auto',
          color: '#eaf0f8',
          animation: 'fadeUp .35s ease both',
          ...PANEL_BASE,
        }}
      >
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
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginTop: 9,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
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
              <span style={{ fontSize: 11.5, color: '#8b98ac' }}>{seatNote(seat)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
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

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
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
            // resume the AudioContext inside the user gesture so the very first
            // click makes sound (no second interaction needed)
            primeReplayAudio();
            startReplay();
          }}
          disabled={replaying}
          style={{
            marginTop: 10,
            width: '100%',
            padding: 11,
            borderRadius: 12,
            border: `1px solid rgba(215,255,62,${replaying ? '.2' : '.35'})`,
            background: 'rgba(215,255,62,.08)',
            color: ACCENT,
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 13.5,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            cursor: replaying ? 'default' : 'pointer',
            opacity: replaying ? 0.6 : 1,
          }}
        >
          {replaying ? 'Reliving the moment…' : '▶ Relive the moment'}
        </button>

        <button
          onClick={shareSeat}
          style={{
            marginTop: 8,
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
          }}
        >
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
          {inList ? `View your shortlist (${compareList.length})` : `+ Add to compare (${compareList.length})`}
        </button>
      </div>
    </>
  );
}
