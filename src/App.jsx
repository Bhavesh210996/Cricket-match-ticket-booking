import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import StadiumScene from './scenes/StadiumScene';
import UiLayer from './components/ui/UiLayer';

// Camera defaults roughly match overviewPose() so there's no jump on the first
// CameraRig transition. far is 4000 to clear the 900-unit sky dome (was the
// original renderer's near/far too). preserveDrawingBuffer is on now so the
// later "compare" feature can snapshot POV renders via toDataURL().
export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        camera={{ position: [-496, 304, -196], fov: 40, near: 0.12, far: 4000 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
        }}
      >
        <StadiumScene />
      </Canvas>
      <UiLayer />
    </div>
  );
}
