// Ported from stadium-view.js `_initScene()` lighting block, then wired to the
// simplified sun model in src/stadium/sun.js.
//
// The directional light is the "sun": its position, colour and intensity come
// from ONE fixed hour (SCENE_SUN_HOUR — a dusk default). There is no user time
// control and no live relighting; the per-seat sun-exposure timeline in
// SeatInfoCard is a separate background calculation. It is the single shadow
// caster. The roof-rim floods + warm key dim in daylight and come up at dusk.
import { TAU } from '../../stadium/config.js';
import { sunLight, SCENE_SUN_HOUR } from '../../stadium/sun.js';

const sun = sunLight(SCENE_SUN_HOUR);

export default function Lights() {
  return (
    <>
      <hemisphereLight args={[0x9a90a8, 0x1a120c, sun.hemiIntensity]} />
      <ambientLight args={[0x4a3f3a, sun.ambientIntensity]} />

      {/* the sun — primary light + the only shadow caster */}
      <directionalLight
        color={sun.color}
        intensity={sun.intensity}
        position={sun.position}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={800}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0004}
      />

      {/* roof-rim floodlighting — 6 spots ringing the bowl, dimmed in daylight */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * TAU + 0.4;
        return (
          <spotLight
            key={i}
            color={0xffeeca}
            intensity={3.4 * sun.floodFactor}
            distance={0}
            angle={0.95}
            penumbra={0.78}
            decay={0}
            position={[Math.cos(a) * 128, 34, Math.sin(a) * 128]}
          />
        );
      })}

      {/* warm key fill (shadow casting handed to the sun above) */}
      <spotLight
        color={0xfff3e0}
        intensity={2.4 * sun.floodFactor}
        distance={0}
        angle={0.8}
        penumbra={0.7}
        decay={0}
        position={[90, 150, 90]}
      />
    </>
  );
}
