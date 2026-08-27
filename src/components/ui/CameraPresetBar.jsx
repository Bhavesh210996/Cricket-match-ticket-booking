// Bird's-eye / Side on / Block D / Pitch level / Reset (overview only).
// These are camera-only framings (like the original applyPreset), so they act
// through the shared camera bridge rather than the store.
import { useBookingStore } from '../../store/useBookingStore.js';
import { presetPose, overviewPose } from '../../stadium/camera.js';
import { flyTo, viewportAspect, hasCamera } from '../../stadium/flyCamera.js';
import { COND } from './tokens.js';

const PRESETS = [
  ["Bird’s-eye", 'top'],
  ['Side on', 'side'],
  ['Block D', 'block'],
  ['Pitch level', 'pitch'],
];

const presetBtn = {
  flexShrink: 0,
  padding: '5px 9px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'rgba(14,20,31,.82)',
  border: '1px solid rgba(255,255,255,.1)',
  color: '#c3cddc',
  fontFamily: COND,
  fontSize: 12,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

export default function CameraPresetBar() {
  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);

  if (mode !== 'overview') return null;

  const go = (id) => {
    if (!hasCamera()) return;
    flyTo(presetPose(id, viewportAspect(), stands));
  };
  const reset = () => hasCamera() && flyTo(overviewPose(viewportAspect()));

  return (
    <div
      className="hscroll"
      style={{
        // flows under <TierChips> inside <OverviewTopStack> (was position:
        // absolute top:134, which collided once the chips wrapped on phones).
        // Scrolls horizontally on narrow screens instead of overflowing.
        padding: '8px 16px 0',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontFamily: COND,
          fontSize: 11,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: '#66738a',
        }}
      >
        Camera
      </span>
      {PRESETS.map(([label, id]) => (
        <button key={id} onClick={() => go(id)} style={presetBtn}>
          {label}
        </button>
      ))}
      <button
        onClick={reset}
        style={{
          ...presetBtn,
          background: 'transparent',
          borderColor: 'rgba(255,255,255,.1)',
          color: '#7d8ba1',
        }}
      >
        Reset
      </button>
    </div>
  );
}
