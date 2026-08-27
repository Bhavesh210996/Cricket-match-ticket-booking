// "Relive the moment" — a short animated replay of one hardcoded highlight,
// triggered on demand from the seat POV card and replayable any number of
// times. The trajectory (src/stadium/moment.js) is regenerated per replay from
// the seat currently in view, so the six is always launched toward the viewer's
// own stand. It is built in world space and the camera only changes viewing
// angle, so the impact + FOV punch line up from any seat.
//
// Mounted AFTER <PovController> in <StadiumScene> so this useFrame runs last:
// PovController hard-locks the camera to the seat-eye point every frame, and we
// add the "bat contact" shake on top of that lock (it resets cleanly next
// frame). The FOV punch is a gsap tween on camera.fov, which PovController
// leaves alone except on scroll.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useBookingStore } from '../../store/useBookingStore.js';
import { buildMomentTrajectory } from '../../stadium/moment.js';
import { seatPos } from '../../stadium/seats.js';
import { playBatHit, playCrowdRoar, fadeOutCrowd, stopCrowd } from '../../stadium/replaySound.js';

const SHAKE_DURATION = 0.35; // s, decaying jitter after bat contact
const SHAKE_AMP = 0.05; // m, initial positional jitter

const _shake = new THREE.Vector3();

export default function MomentReplay() {
  const camera = useThree((s) => s.camera);
  const mode = useBookingStore((s) => s.mode);
  const stands = useBookingStore((s) => s.stands);
  const selectedSeat = useBookingStore((s) => s.selectedSeat);
  const replayToken = useBookingStore((s) => s.replayToken);
  const endReplay = useBookingStore((s) => s.endReplay);

  const ball = useRef();
  const play = useRef(null); // { t, contactDone, shakeUntil, traj, crowdFading } while playing
  const crowd = useRef(null); // handle for the in-flight crowd-roar voice
  const lastToken = useRef(replayToken);

  // (re)start whenever the token is bumped — but only from a seat POV, and not
  // for a stale token when POV is (re)entered. The trajectory is generated here
  // from the seat in view, so the shot always flies toward the viewer's stand.
  useEffect(() => {
    if (mode !== 'pov' || replayToken === lastToken.current) return;
    lastToken.current = replayToken;
    if (!selectedSeat) return;
    const st = stands.find((s) => s.id === selectedSeat.standId);
    if (!st) return;
    const seatWorld = seatPos(st, selectedSeat.row - 1, selectedSeat.num - 1);
    stopCrowd(crowd.current); // kill a roar still tailing from a previous replay
    crowd.current = null;
    play.current = {
      t: 0,
      contactDone: false,
      shakeUntil: 0,
      crowdFading: false,
      traj: buildMomentTrajectory(seatWorld),
    };
    if (ball.current) ball.current.visible = true;
  }, [replayToken, mode, selectedSeat, stands]);

  // leaving POV cancels any in-flight replay
  useEffect(() => {
    if (mode === 'pov') return;
    play.current = null;
    stopCrowd(crowd.current);
    crowd.current = null;
    if (ball.current) ball.current.visible = false;
  }, [mode]);

  // brief FOV punch-in (~15% tighter) that eases back — emphasises the hit
  const punchFov = () => {
    const startFov = camera.fov;
    gsap.killTweensOf(camera, 'fov');
    gsap
      .timeline()
      .to(camera, {
        fov: startFov * 0.85,
        duration: 0.1,
        ease: 'power2.out',
        onUpdate: () => camera.updateProjectionMatrix(),
      })
      .to(camera, {
        fov: startFov,
        duration: 0.32,
        ease: 'power2.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
      });
  };

  useFrame((_, delta) => {
    const p = play.current;
    if (!p || !ball.current) return;

    p.t += delta;
    p.traj.sample(p.t, ball.current.position);

    // bat contact — one event drives the FOV punch, the shake window, the
    // bat-hit crack, and (a beat later, scheduled on the audio clock) the roar
    if (!p.contactDone && p.t >= p.traj.batContactTime) {
      p.contactDone = true;
      p.shakeUntil = p.t + SHAKE_DURATION;
      punchFov();
      playBatHit();
      stopCrowd(crowd.current);
      crowd.current = playCrowdRoar(0.15);
    }

    // subtle positional shake, applied after PovController re-locked the camera
    // to the seat this frame so it actually shows; decays to zero.
    if (p.t < p.shakeUntil) {
      const k = (p.shakeUntil - p.t) / SHAKE_DURATION; // 1 -> 0
      const amp = SHAKE_AMP * k * k;
      _shake.set(
        (Math.random() - 0.5) * amp,
        (Math.random() - 0.5) * amp,
        (Math.random() - 0.5) * amp,
      );
      camera.position.add(_shake);
    }

    // tail the roar off over the last stretch so it fades as the replay ends
    if (!p.crowdFading && p.t >= p.traj.duration - 1.4) {
      p.crowdFading = true;
      fadeOutCrowd(crowd.current, 1.4);
    }

    if (p.t >= p.traj.duration) {
      play.current = null;
      crowd.current = null; // fade already scheduled; drop our handle
      ball.current.visible = false;
      endReplay();
    }
  });

  return (
    <mesh ref={ball} visible={false} castShadow>
      <sphereGeometry args={[0.2, 16, 12]} />
      <meshStandardMaterial
        color={0xf2e6c9}
        roughness={0.55}
        emissive={0x552200}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}
