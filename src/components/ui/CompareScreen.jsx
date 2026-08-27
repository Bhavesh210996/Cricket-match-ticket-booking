// "Compare Your Shortlist" screen (mode === 'compare'). Full-bleed overlay with
// up to three cards, each showing the STATIC POV snapshot captured when the seat
// was shortlisted (never live-rendered here), the seat label, distance-out,
// tier, price, a view-quality badge, and Revisit / Book actions, plus an X to
// drop the seat. Reference: the compare block in `Cricket Seat Preview.dc.html`.
import { useBookingStore } from '../../store/useBookingStore.js';
import { captureSeatPov } from '../../stadium/snapshot.js';
import { shareSeatCard } from './shareCard.js';
import { COND, ACCENT, PANEL_BASE, money, qualityStyle, iconBtn } from './tokens.js';

const EYE_HEIGHT_M = 1.18;

export default function CompareScreen() {
  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);
  const compareList = useBookingStore((s) => s.compareList);
  const exitCompare = useBookingStore((s) => s.exitCompare);
  const removeFromCompare = useBookingStore((s) => s.removeFromCompare);
  const revisitSeat = useBookingStore((s) => s.revisitSeat);

  if (mode !== 'compare') return null;

  const book = (seat) => {
    const label = `${seat.block} · Row ${seat.rowLabel} · Seat ${seat.num}`;
    window.alert(`Booking ${label}\n${money(seat.price)} incl. fees`);
  };

  // use the snapshot captured at add time; re-grab only if it's somehow missing
  const share = (seat) => {
    let img = seat.povImage;
    if (!img) {
      const st = stands.find((s) => s.id === seat.standId);
      img = st ? captureSeatPov(st, seat) : null;
    }
    shareSeatCard(seat, img);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'auto',
        background: 'radial-gradient(130% 120% at 50% 0%, #0b1018 0%, #05070c 72%)',
        color: '#eaf0f8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
        <button style={iconBtn} onClick={exitCompare} aria-label="Back">
          ‹
        </button>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: COND,
              fontSize: 11,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            Your shortlist
          </div>
          <div
            style={{
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: '.03em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            Compare Your Shortlist
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#93a1b6', whiteSpace: 'nowrap' }}>
          {compareList.length} of 3 seats
        </div>
      </div>

      {compareList.length === 0 ? (
        <div style={{ margin: 'auto', textAlign: 'center', padding: 40 }}>
          <div
            style={{
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 20,
              textTransform: 'uppercase',
            }}
          >
            No seats shortlisted yet
          </div>
          <div style={{ fontSize: 13, marginTop: 6, color: '#93a1b6' }}>
            Tap “+ Compare” on a seat while browsing to add it here.
          </div>
          <button
            onClick={exitCompare}
            style={{
              marginTop: 18,
              padding: '11px 18px',
              border: 'none',
              borderRadius: 12,
              background: ACCENT,
              color: '#06080d',
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Back to the map
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
            padding: '8px 20px 32px',
          }}
        >
          {compareList.map((seat) => {
            const q = qualityStyle(seat.quality);
            const label = `${seat.block} · Row ${seat.rowLabel} · Seat ${seat.num}`;
            return (
              <div
                key={seat.key}
                style={{
                  width: 320,
                  maxWidth: 'calc(100vw - 40px)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeUp .3s ease both',
                  ...PANEL_BASE,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 10',
                    background: '#0a0e16',
                  }}
                >
                  {seat.povImage ? (
                    <img
                      src={seat.povImage}
                      alt={`View from ${label}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: COND,
                        fontSize: 12,
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                        color: '#5b6779',
                      }}
                    >
                      Preview unavailable
                    </div>
                  )}
                  <button
                    onClick={() => removeFromCompare(seat.key)}
                    aria-label="Remove from shortlist"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,.18)',
                      background: 'rgba(6,8,13,.72)',
                      color: '#eaf0f8',
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                  <span
                    style={{
                      position: 'absolute',
                      left: 8,
                      bottom: 8,
                      padding: '4px 8px',
                      borderRadius: 7,
                      fontFamily: COND,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      ...q,
                    }}
                  >
                    {seat.quality} view
                  </span>
                </div>

                <div
                  style={{
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontFamily: COND,
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: '#93a1b6' }}>
                    {seat.distance}m from the pitch centre · {seat.tierLabel} tier · eye height{' '}
                    {EYE_HEIGHT_M}m
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: COND,
                        fontWeight: 700,
                        fontSize: 22,
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

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                      onClick={() => revisitSeat(seat)}
                      style={{
                        flex: 1,
                        padding: 11,
                        borderRadius: 11,
                        border: '1px solid rgba(255,255,255,.16)',
                        background: 'rgba(255,255,255,.04)',
                        color: '#eaf0f8',
                        fontFamily: COND,
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Revisit
                    </button>
                    <button
                      onClick={() => book(seat)}
                      style={{
                        flex: 1,
                        padding: 11,
                        border: 'none',
                        borderRadius: 11,
                        background: ACCENT,
                        color: '#06080d',
                        fontFamily: COND,
                        fontWeight: 700,
                        fontSize: 13.5,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Book
                    </button>
                  </div>

                  <button
                    onClick={() => share(seat)}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 11,
                      border: '1px solid rgba(255,255,255,.14)',
                      background: 'transparent',
                      color: '#c3cddc',
                      fontFamily: COND,
                      fontWeight: 600,
                      fontSize: 12.5,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    ⤴ Share this seat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
