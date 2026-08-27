// Full-bleed overlay above the <Canvas>. Nothing here holds app state — every
// child reads/dispatches through useBookingStore (or the camera bridge for the
// camera-only presets) and self-gates on `mode`.
import TopBar from './TopBar.jsx';
import TierChips from './TierChips.jsx';
import CameraPresetBar from './CameraPresetBar.jsx';
import TierPanel from './TierPanel.jsx';
import StandHeader from './StandHeader.jsx';
import SeatChip from './SeatChip.jsx';
import SeatInfoCard from './SeatInfoCard.jsx';
import CompassIndicator from './CompassIndicator.jsx';
import { BODY } from './tokens.js';

export default function UiLayer() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: BODY,
        color: '#eaf0f8',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <TopBar />
      <TierChips />
      <CameraPresetBar />
      <TierPanel />
      <StandHeader />
      <SeatChip />
      <SeatInfoCard />
      <CompassIndicator />
    </div>
  );
}
