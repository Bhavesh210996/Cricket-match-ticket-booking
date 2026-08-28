// Left-side tier list (overview only): name, price range, availability, tap to
// highlight (same action as TierChips). Reference: the "Choose your tier"
// sheet (desktop sheetStyle: left:20px).
import { useBookingStore } from '../../store/useBookingStore.js';
import { useTierConfig } from './useTierConfig.js';
import { useViewport } from './useViewport.js';
import { COND, ACCENT, PANEL_BASE, money } from './tokens.js';

export default function TierPanel() {
  const mode = useBookingStore((s) => s.mode);
  const activeTier = useBookingStore((s) => s.activeTier);
  const selectTier = useBookingStore((s) => s.selectTier);
  const selectStand = useBookingStore((s) => s.selectStand);
  const tiers = useTierConfig();
  const vp = useViewport();

  if (mode !== 'overview') return null;

  const active = tiers.find((t) => t.id === activeTier);
  const bestBlock = active ? active.blocks[Math.floor(active.blocks.length / 2)] : null;

  // sits below the overview top chrome; that stack is taller on a phone (wrapped
  // title) and the whole screen is shorter, so drop the top offset and let the
  // panel scroll internally instead of running off the bottom edge
  const top = vp.isShort ? 84 : vp.isPhone ? 176 : 238;

  return (
    <div
      style={{
        position: 'absolute',
        left: vp.isPhone ? 12 : 20,
        top,
        width: 372,
        maxWidth: `calc(100vw - ${vp.isPhone ? 24 : 40}px)`,
        maxHeight: `calc(100dvh - ${top + 20}px)`,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: 18,
        borderRadius: 20,
        pointerEvents: 'auto',
        color: '#eaf0f8',
        ...PANEL_BASE,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}
        >
          Choose your tier
        </div>
        <div style={{ fontSize: 11, color: '#7d8ba1' }}>
          {activeTier ? 'Highlighted on the model' : 'Tap to highlight on the 3D map'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tiers.map((t) => {
          const on = activeTier === t.id;
          return (
            <div
              key={t.id}
              onClick={() => selectTier(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '10px 12px',
                borderRadius: 14,
                cursor: 'pointer',
                background: on ? 'rgba(215,255,62,.08)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${on ? 'rgba(215,255,62,.45)' : 'rgba(255,255,255,.07)'}`,
              }}
            >
              <span
                style={{ width: 5, height: 34, borderRadius: 3, background: t.color, flex: '0 0 5px' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: COND,
                    fontWeight: 600,
                    fontSize: 16,
                    letterSpacing: '.07em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.label}
                </div>
                <div style={{ fontSize: 11.5, color: '#8b98ac' }}>
                  {t.avail.toLocaleString('en-IN')} of {t.seats.toLocaleString('en-IN')} left ·{' '}
                  {t.blocks.length} blocks
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                  {money(t.from)}–{money(t.to)}
                </div>
                <div style={{ fontSize: 11, color: '#7d8ba1' }}>per seat</div>
              </div>
              <span style={{ color: '#59657a', fontSize: 16 }}>›</span>
            </div>
          );
        })}
      </div>

      {bestBlock && (
        <button
          onClick={() => selectStand(bestBlock)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 13,
            border: 'none',
            borderRadius: 13,
            background: ACCENT,
            color: '#06080d',
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Zoom into Block {bestBlock}
        </button>
      )}
    </div>
  );
}
