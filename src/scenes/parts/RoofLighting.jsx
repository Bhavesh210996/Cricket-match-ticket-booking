// Roof-edge LED lighting rig — modelled on Narendra Modi Stadium: there are no
// tall pole towers, the lights sit in a continuous strip along the inner roof
// edge, following the oval curve. Three layers:
//
//   • FixtureRing — ~144 small emissive fixture meshes on the oval inner-roof
//     curve, extending the continuous `led` housing strip in Roof.jsx into the
//     actual visible light source. Angled slightly down toward the pitch.
//   • rig spots   — 4 real SpotLights spaced around the ring, aimed down at the
//     square, for genuine pitch illumination + falloff. Dimmed in daylight via
//     sun.floodFactor, exactly like the other roof-rim floods in Lights.jsx.
//   • BeamCones   — 20 cheap fake light shafts: additive, semi-transparent
//     frustum meshes with a source→tip gradient (bright at the fixture, fading
//     to nothing at the pitch). Purely decorative — no light cost — one shaft
//     roughly every 7 fixtures so it reads as dramatic without clutter.
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { beamTexture } from '../../stadium/textures.js';
import { TAU, EX, EZ } from '../../stadium/config.js';
import { sunLight, SCENE_SUN_HOUR } from '../../stadium/sun.js';

const sun = sunLight(SCENE_SUN_HOUR);

const RING_R = 115.4; // just inboard of the `led` housing strip (R 115.6) in Roof.jsx
const RING_Y = 35.4;
const FIXTURES = 144;
const BEAMS = 20;
const UP = new THREE.Vector3(0, 1, 0);

// Continuous fixture strip: one instanced mesh of small emissive blocks laid
// tangent to the oval, each tilted ~20° down toward the field.
function FixtureRing() {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.34);
    const pos = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < FIXTURES; i++) {
      const a = (i / FIXTURES) * TAU;
      q.setFromAxisAngle(UP, -a + Math.PI / 2).multiply(tilt);
      pos.set(Math.cos(a) * RING_R * EX, RING_Y, Math.sin(a) * RING_R * EZ);
      m.compose(pos, q, one);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FIXTURES]}>
      <boxGeometry args={[1.7, 0.5, 0.8]} />
      <meshStandardMaterial
        color={0xffffff}
        emissive={0xfff0cc}
        emissiveIntensity={3.6}
        roughness={0.3}
        metalness={0.1}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// One real SpotLight on the ring at azimuth `a`, aimed at a point on the turf
// on the same bearing so the four together rake the whole square.
function RigSpot({ a }) {
  const light = useRef();
  const target = useRef();
  useLayoutEffect(() => {
    light.current.target = target.current;
    light.current.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <spotLight
        ref={light}
        position={[Math.cos(a) * 112 * EX, 35, Math.sin(a) * 112 * EZ]}
        color={0xfff4e0}
        intensity={3.2 * sun.floodFactor}
        distance={0}
        angle={0.6}
        penumbra={0.85}
        decay={0}
      />
      <object3D ref={target} position={[Math.cos(a) * 22 * EX, 1, Math.sin(a) * 22 * EZ]} />
    </>
  );
}

// Fake volumetric shafts: narrow frustum cones from the fixture line down to a
// ring ~26u out from centre. Additive + no depth write so they glow against the
// dark sky the way the reference photo's beams do.
//
// Falloff along the length is a vertex-alpha gradient baked into the cone
// (alpha ~1 at the roof-edge source, easing to 0 by the pitch end via a
// pow curve) — not a flat per-mesh opacity. All beams are the same length, so
// one geometry is shared across the ring.
const BEAM_SRC_R = RING_R;
const BEAM_SRC_Y = RING_Y + 0.2;
const BEAM_TIP_R = 26;
const BEAM_TIP_Y = 1;
const BEAM_LEN = Math.hypot(BEAM_SRC_R - BEAM_TIP_R, BEAM_SRC_Y - BEAM_TIP_Y);

function BeamCones() {
  const tex = useMemo(() => beamTexture(), []);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.6, 7.5, BEAM_LEN, 20, 28, true);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 4);
    const half = BEAM_LEN / 2;
    for (let i = 0; i < pos.count; i++) {
      // local +Y end is the source; tLen = 0 at source, 1 at the pitch tip
      const tLen = (half - pos.getY(i)) / BEAM_LEN;
      // ease the hard bright disc right at the fixture: fade the alpha back
      // down over the first ~15% of the length so the beam glows out of the
      // light rather than starting as a solid hot blob.
      const near = Math.min(1, tLen / 0.15);
      const alpha = Math.pow(1 - tLen, 1.7) * (0.35 + 0.65 * near);
      col[i * 4 + 0] = 1;
      col[i * 4 + 1] = 1;
      col[i * 4 + 2] = 1;
      col[i * 4 + 3] = alpha;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g;
  }, []);
  useLayoutEffect(
    () => () => {
      tex.dispose();
      geo.dispose();
    },
    [tex, geo],
  );

  const beams = useMemo(() => {
    const out = [];
    for (let i = 0; i < BEAMS; i++) {
      const a = (i / BEAMS) * TAU + 0.15;
      const s = new THREE.Vector3(Math.cos(a) * BEAM_SRC_R * EX, BEAM_SRC_Y, Math.sin(a) * BEAM_SRC_R * EZ);
      const t = new THREE.Vector3(Math.cos(a) * BEAM_TIP_R * EX, BEAM_TIP_Y, Math.sin(a) * BEAM_TIP_R * EZ);
      const mid = s.clone().add(t).multiplyScalar(0.5);
      // local +Y (cylinder top, narrow end) points back up to the fixture
      const q = new THREE.Quaternion().setFromUnitVectors(UP, s.clone().sub(t).normalize());
      out.push({ position: mid.toArray(), quaternion: [q.x, q.y, q.z, q.w] });
    }
    return out;
  }, []);

  return (
    <>
      {beams.map((b, i) => (
        <mesh key={i} geometry={geo} position={b.position} quaternion={b.quaternion} renderOrder={3}>
          <meshBasicMaterial
            map={tex}
            color={0xfff2d6}
            vertexColors
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </>
  );
}

export default function RoofLighting() {
  return (
    <>
      <FixtureRing />
      {Array.from({ length: 4 }, (_, i) => (
        <RigSpot key={i} a={0.6 + (i / 4) * TAU} />
      ))}
      <BeamCones />
    </>
  );
}
