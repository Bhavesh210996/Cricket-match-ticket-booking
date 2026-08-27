import * as THREE from 'three';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import StadiumScene from './scenes/StadiumScene';
import UiLayer from './components/ui/UiLayer';
import SceneLoader from './components/ui/SceneLoader';
import { APP_BG } from './components/ui/tokens.js';

// Signals once the scene tree has mounted (all the heavy useMemo geometry /
// texture / instance construction is done by then) and the render loop has
// drawn its first frame — that's when it's safe to fade the loading overlay.
function FirstFrame({ onReady }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady();
  });
  return null;
}

// Camera defaults roughly match overviewPose() so there's no jump on the first
// CameraRig transition. far is 4000 to clear the 900-unit sky dome (was the
// original renderer's near/far too). preserveDrawingBuffer is on now so the
// later "compare" feature can snapshot POV renders via toDataURL().
export default function App() {
  // Mount the <Canvas> only after the themed loading screen has painted once,
  // so the heavy synchronous scene build (turf texture, ~10k seat instances,
  // per-stand labels…) can't block the first paint and leave a white flash.
  const [mountCanvas, setMountCanvas] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    // two rAFs = "after the browser has painted the loading screen at least once"
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setMountCanvas(true));
    });
    // fallback in case rAF is throttled (e.g. tab loaded in the background)
    const timer = setTimeout(() => setMountCanvas(true), 200);
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        // 100% (not 100vw) so a scrollbar can't create horizontal overflow;
        // 100dvh tracks the mobile browser's collapsing chrome
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: APP_BG,
      }}
    >
      {mountCanvas && (
        <Canvas
          shadows
          dpr={[1, 2]}
          style={{ background: APP_BG }}
          gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
          camera={{ position: [-496, 304, -196], fov: 40, near: 0.12, far: 4000 }}
          onCreated={({ gl }) => {
            // first WebGL clear is the dark theme colour, not black/transparent,
            // until <Environment>'s <color attach="background"> takes over
            gl.setClearColor(APP_BG, 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.04;
          }}
        >
          <Suspense fallback={null}>
            <StadiumScene />
            <FirstFrame onReady={() => setReady(true)} />
          </Suspense>
        </Canvas>
      )}
      <UiLayer />
      <SceneLoader visible={!ready} />
    </div>
  );
}
