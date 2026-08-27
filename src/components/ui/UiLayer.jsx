// Full-bleed overlay above the <Canvas>. Nothing here holds app state — every
// child reads/dispatches through useBookingStore (or the camera bridge for the
// camera-only presets) and self-gates on `mode`.
import OverviewTopStack from './OverviewTopStack.jsx';
// import TierPanel from './TierPanel.jsx'; // "Choose your tier" card — hidden for now (component kept, just not rendered)
import StandHeader from './StandHeader.jsx';
import SeatChip from './SeatChip.jsx';
import SeatInfoCard from './SeatInfoCard.jsx';
import CompassIndicator from './CompassIndicator.jsx';
import CompareTray from './CompareTray.jsx';
import CompareScreen from './CompareScreen.jsx';
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
      <OverviewTopStack />
      {/* <TierPanel /> — "Choose your tier" card hidden for now */}
      <StandHeader />
      <SeatChip />
      <SeatInfoCard />
      <CompassIndicator />
      <CompareTray />
      <CompareScreen />
    </div>
  );
}
