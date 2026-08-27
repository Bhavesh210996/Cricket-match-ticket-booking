// Overview-mode top chrome: fixture header + tier chips + camera presets, in a
// single top-anchored flex column so they FLOW instead of each sitting at a
// hard-coded `top:` offset. On a phone the fixture title wraps to 2–3 lines and
// the old fixed offsets (top:96 / top:134) made the chip + camera rows overlap
// it; flowing them fixes that while leaving the desktop stack visually the same.
import { useBookingStore } from '../../store/useBookingStore.js';
import TopBar from './TopBar.jsx';
import TierChips from './TierChips.jsx';
import CameraPresetBar from './CameraPresetBar.jsx';

export default function OverviewTopStack() {
  const mode = useBookingStore((s) => s.mode);
  if (mode !== 'overview') return null;

  return (
    <div
      style={{
        // plain block: children stack and each takes the full viewport width, so
        // TopBar's inner flex row and the chip / camera flex-wrap rows all have a
        // hard width to wrap within (a flex column here left them content-width
        // and the rows overflowed off-screen on a phone)
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <TopBar />
      <TierChips />
      <CameraPresetBar />
    </div>
  );
}
