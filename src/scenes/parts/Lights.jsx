// Ported from stadium-view.js `_initScene()` lighting block.
// decay={0} is deliberate — the original SpotLights pass decay=0 so the beams
// don't fall off with distance. SpotLight targets default to the origin, which
// is exactly where the original pointed them, so no explicit target nodes.
import { TAU } from '../../stadium/config.js';

export default function Lights() {
  return (
    <>
      <hemisphereLight args={[0x9a90a8, 0x1a120c, 0.62]} />
      <ambientLight args={[0x4a3f3a, 0.26]} />
      <directionalLight color={0xd8bb96} intensity={0.6} position={[-120, 180, 90]} />

      {/* roof-rim floodlighting — 6 spots ringing the bowl */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * TAU + 0.4;
        return (
          <spotLight
            key={i}
            color={0xffeeca}
            intensity={3.4}
            distance={0}
            angle={0.95}
            penumbra={0.78}
            decay={0}
            position={[Math.cos(a) * 128, 34, Math.sin(a) * 128]}
          />
        );
      })}

      {/* key light — the only shadow caster */}
      <spotLight
        color={0xfff3e0}
        intensity={2.4}
        distance={0}
        angle={0.8}
        penumbra={0.7}
        decay={0}
        position={[90, 150, 90]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={500}
      />
    </>
  );
}
