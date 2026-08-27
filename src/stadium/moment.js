// "Relive the moment" — STATIC DEMO SETUP, not a real match feed.
//
// One hardcoded highlight, but the trajectory is generated PER SEAT: a quick
// delivery arc into the bat at the striker's crease, then one continuous
// parabola launched toward whichever stand the viewer is sitting in, landing
// near that stand's boundary. Both phases are true constant-gravity projectile
// motion — a single position-over-time formula each, so the path is one smooth
// rise-then-fall arc with no artificial midpoint (the only velocity change is
// the bat itself, which is where the FOV punch fires).
//
// All units are metres / seconds, in the same world frame as the stadium
// geometry (pitch centre = origin, creases at x = ±9).

import * as THREE from 'three';

const GRAVITY = 9.81; // m/s^2, straight down
const RELEASE = new THREE.Vector3(-11, 2.2, 0); // ball out of the bowler's hand
const CONTACT = new THREE.Vector3(9, 0.9, 0); // bat meets ball, striker's crease
const DELIVERY_TIME = 0.75; // s, release -> bat contact (fast, near-flat)
const SHOT_TIME = 4.0; // s, bat contact -> landing (big hang time)
const LANDING_RADIUS = 88; // m from pitch centre — the boundary rope / front rows
const LANDING_HEIGHT = 1.2; // m — roughly front-row catch height

export const MOMENT = {
  id: 'demo-six-to-your-stand',
  title: 'Six, toward your stand',
  subtitle: 'Launched off the middle in your direction',
};

const HALF_G = new THREE.Vector3(0, -0.5 * GRAVITY, 0);

// Initial velocity of a projectile that leaves `from`, falls under constant
// gravity, and passes exactly through `to` after `time`:
//   to = from + v0*time + 0.5*g*time^2   =>   v0 = (to-from)/time - 0.5*g*time
function solveLaunchVelocity(from, to, time) {
  return new THREE.Vector3()
    .subVectors(to, from)
    .divideScalar(time)
    .addScaledVector(HALF_G, -time);
}

// Build a seat-aware replay trajectory. `seatWorldPos` supplies only a
// horizontal direction (pitch centre -> seat); its distance and height are
// ignored — the shot always lands at LANDING_RADIUS in that direction.
export function buildMomentTrajectory(seatWorldPos) {
  const dir = new THREE.Vector3(seatWorldPos.x, 0, seatWorldPos.z);
  if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0); // seat somehow at the centre
  dir.normalize();

  const landing = new THREE.Vector3(
    dir.x * LANDING_RADIUS,
    LANDING_HEIGHT,
    dir.z * LANDING_RADIUS,
  );

  const vDelivery = solveLaunchVelocity(RELEASE, CONTACT, DELIVERY_TIME);
  const vShot = solveLaunchVelocity(CONTACT, landing, SHOT_TIME);

  const batContactTime = DELIVERY_TIME;
  const duration = DELIVERY_TIME + SHOT_TIME;

  // Whole-replay position at `t` seconds. Mutates and returns `target`.
  function sample(t, target = new THREE.Vector3()) {
    const clamped = THREE.MathUtils.clamp(t, 0, duration);
    if (clamped <= batContactTime) {
      return target
        .copy(RELEASE)
        .addScaledVector(vDelivery, clamped)
        .addScaledVector(HALF_G, clamped * clamped);
    }
    const lt = clamped - batContactTime;
    return target
      .copy(CONTACT)
      .addScaledVector(vShot, lt)
      .addScaledVector(HALF_G, lt * lt);
  }

  return {
    sample,
    batContactTime,
    duration,
    contact: CONTACT.clone(),
    landing,
  };
}
