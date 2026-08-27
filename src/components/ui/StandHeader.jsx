// Stand-mode header: block name, row/seat counts, Available/Sold/Selected
// legend, "tap a lit seat" hint. Reference: isStand top block.
import { useBookingStore } from '../../store/useBookingStore.js';
import { standPose } from '../../stadium/camera.js';
import { flyTo, viewportAspect, hasCamera } from '../../stadium/flyCamera.js';
import { TIERS } from '../../stadium/config.js';
import { COND, ACCENT, hex, iconBtn } from './tokens.js';

const legendPill = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 9px',
  borderRadius: 8,
  background: 'rgba(14,20,31,.78)',
  border: '1px solid rgba(255,255,255,.08)',
  fontSize: 11,
  color: '#c3cddc',
};
const dot = (bg) => ({ width: 9, height: 9, borderRadius: 2, background: bg });

export default function StandHeader() {
  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);
  const focusedStandId = useBookingStore((s) => s.focusedStandId);
  const backToOverview = useBookingStore((s) => s.backToOverview);

  if (mode !== 'stand') return null;
  const st = stands.find((s) => s.id === focusedStandId);
  if (!st) return null;

  const tier = TIERS[st.tier];
  const resetZoom = () => hasCamera() && flyTo(standPose(st, viewportAspect()));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '14px 16px 22px',
        background: 'linear-gradient(180deg, rgba(5,8,14,.92) 0%, rgba(5,8,14,0) 100%)',
        pointerEvents: 'none',
        color: '#eaf0f8',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ ...iconBtn, fontSize: 15 }} onClick={backToOverview} aria-label="Back">
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 21,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            Block {st.id} · {tier.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 11.5, color: '#93a1b6' }}>
            {st.rows} rows · {st.cols} seats per row · {st.deck === 'lower' ? 'Lower tier' : 'Upper tier'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <span style={legendPill}>
          <span style={dot(hex(tier.color))} />
          Available
        </span>
        <span style={legendPill}>
          <span style={dot('#2a303c')} />
          Sold
        </span>
        <span style={legendPill}>
          <span style={dot(ACCENT)} />
          Selected
        </span>
        <button
          onClick={resetZoom}
          style={{ ...legendPill, color: '#93a1b6', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Reset zoom
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#8b98ac', marginTop: 10 }}>
        Tap a seat to preview it — tap again or hit “See the view” to drop in, or “+ Compare” to shortlist it.
      </div>
    </div>
  );
}
