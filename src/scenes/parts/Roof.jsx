// Continuous membrane roof ring + ribs + oculus + LED ring + facade + apron
// + corporate-box ring (shell, glazing, mullions) + ribbon board.
// Ported from stadium-view.js `_initScene()` (roof / box-ring / ribbon blocks).
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { loft } from '../../stadium/geometry.js';
import { TAU, EX, EZ, hash } from '../../stadium/config.js';

function GlassRing() {
  const glass = useRef();
  const mullion = useRef();

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3(1, 1, 1);
    const c = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 76; i++) {
      const a = (i / 76) * TAU;
      q.setFromAxisAngle(up, -a + Math.PI / 2);
      m.compose(new THREE.Vector3(Math.cos(a) * 110.3, 13.4, Math.sin(a) * 110.3), q, v);
      glass.current.setMatrixAt(i, m);
      c.setHex(0xffe6b4).multiplyScalar(0.55 + hash(i, 9, 4) * 0.75);
      glass.current.setColorAt(i, c);

      const am = ((i + 0.5) / 76) * TAU;
      q.setFromAxisAngle(up, -am + Math.PI / 2);
      m.compose(new THREE.Vector3(Math.cos(am) * 110.3, 13.4, Math.sin(am) * 110.3), q, v);
      mullion.current.setMatrixAt(i, m);
    }
    glass.current.instanceMatrix.needsUpdate = true;
    if (glass.current.instanceColor) glass.current.instanceColor.needsUpdate = true;
    mullion.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <instancedMesh ref={glass} args={[undefined, undefined, 76]}>
        <boxGeometry args={[8.2, 3, 0.3]} />
        <meshStandardMaterial
          color={0xffe6b4}
          emissive={0xffd88f}
          emissiveIntensity={1.1}
          roughness={0.25}
          metalness={0.3}
        />
      </instancedMesh>
      <instancedMesh ref={mullion} args={[undefined, undefined, 76]}>
        <boxGeometry args={[0.32, 3.3, 0.5]} />
        <meshStandardMaterial color={0x1d1a17} roughness={0.6} />
      </instancedMesh>
    </>
  );
}

export default function Roof() {
  const geos = useMemo(
    () => ({
      roof: loft(0, TAU, [[118, 37.6], [152, 45.4], [182, 37.2], [182, 35.4], [152, 43.6], [118, 36.1], [118, 37.6]], 160),
      oculus: loft(0, TAU, [[116, 36], [118.4, 38.4]], 160),
      led: loft(0, TAU, [[115.6, 34.6], [115.6, 36.6]], 160),
      facade: loft(0, TAU, [[182, 36.2], [184, 18], [176, 0]], 160),
      boxShell: loft(0, TAU, [[110.6, 11.2], [110.6, 15.6], [114.4, 15.6]], 150),
      ribbon: loft(0, TAU, [[114.6, 15.9], [114.6, 18.2]], 150),
    }),
    [],
  );
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  return (
    <>
      <mesh geometry={geos.roof}>
        <meshStandardMaterial color={0xc9c7c0} roughness={0.72} metalness={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* 60 radial ribs */}
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * TAU;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 150 * EX, 43, Math.sin(a) * 150 * EZ]}
            rotation-y={-a}
          >
            <boxGeometry args={[64, 0.5, 1.1]} />
            <meshStandardMaterial color={0x9aa0a8} roughness={0.45} metalness={0.65} />
          </mesh>
        );
      })}

      <mesh geometry={geos.oculus}>
        <meshStandardMaterial color={0x9aa0a8} roughness={0.45} metalness={0.65} />
      </mesh>

      <mesh geometry={geos.led}>
        <meshStandardMaterial
          color={0xfff4dc}
          emissive={0xfff0cd}
          emissiveIntensity={2.6}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={geos.facade}>
        <meshStandardMaterial color={0x241f1b} roughness={0.9} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position-y={-0.4} scale={[EX, EZ, 1]}>
        <ringGeometry args={[174, 270, 96]} />
        <meshStandardMaterial color={0x14120f} roughness={1} />
      </mesh>

      <mesh geometry={geos.boxShell}>
        <meshStandardMaterial color={0x2b2723} roughness={0.72} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>

      <GlassRing />

      <mesh geometry={geos.ribbon}>
        <meshStandardMaterial
          color={0x101418}
          emissive={0x2c3f6b}
          emissiveIntensity={1.5}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
