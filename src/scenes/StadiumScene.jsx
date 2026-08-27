// R3F rebuild of the <stadium-view> web component's scene graph.
// Geometry/data come from the ported pure functions in src/stadium/*; camera
// and screen flow come from the Zustand store (see src/store/useBookingStore).
import Lights from './parts/Lights.jsx';
import Environment from './parts/Environment.jsx';
import Pitch from './parts/Pitch.jsx';
import Stands from './parts/Stands.jsx';
import Roof from './parts/Roof.jsx';
import RoofLighting from './parts/RoofLighting.jsx';
import Crowd from './parts/Crowd.jsx';
import StandSeats from './parts/StandSeats.jsx';
import CameraRig from './parts/CameraRig.jsx';
import PovController from './parts/PovController.jsx';
import MomentReplay from './parts/MomentReplay.jsx';
import SnapshotRig from './parts/SnapshotRig.jsx';

export default function StadiumScene() {
  return (
    <>
      {/* background + fog now live in <Environment />, driven by match time-of-day */}
      <Lights />
      <Environment />
      <Pitch />
      <Stands />
      <Roof />
      <RoofLighting />
      <Crowd />
      <StandSeats />

      <CameraRig />
      {/* after CameraRig: overrides the (disabled) controls for seat look-around */}
      <PovController />
      {/* after PovController: adds the "Relive the moment" ball + hit shake on
          top of the per-frame seat lock */}
      <MomentReplay />
      {/* offscreen still capture for the compare shortlist */}
      <SnapshotRig />
    </>
  );
}
