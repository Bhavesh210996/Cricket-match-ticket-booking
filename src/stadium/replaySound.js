// Audio for the "Relive the moment" replay.
//
// The two clips are currently PLACEHOLDERS synthesized with the Web Audio API —
// there are no asset files yet. Swapping in real licensed audio later is a
// one-line change per clip: set BAT_HIT_SRC / CROWD_ROAR_SRC to a URL (drop the
// file in src/assets/ and use `new URL('../assets/bat-hit.mp3', import.meta.url).href`,
// or put it in public/ and use '/audio/bat-hit.mp3'). Everything downstream —
// the decode-to-AudioBuffer cache and the buffer-source playback/scheduling —
// stays exactly the same, because a decoded file and a synthesized buffer are
// both just AudioBuffers.
//
// Playback is Web Audio (BufferSource -> Gain -> destination) so the bat-hit is
// scheduled sample-accurately against the crowd roar and both stay tied to the
// animation's bat-contact event rather than to wall-clock timers.

// --- asset config: set to a URL to replace the synthesized placeholder ---
const BAT_HIT_SRC = null; // e.g. new URL('../assets/bat-hit.mp3', import.meta.url).href
const CROWD_ROAR_SRC = null; // e.g. new URL('../assets/crowd-roar.mp3', import.meta.url).href

const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
const OAC =
  typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext);

let _ctx = null;
function ctx() {
  if (!_ctx && AC) _ctx = new AC();
  return _ctx;
}

let _batHit = null; // Promise<AudioBuffer>
let _crowd = null; // Promise<AudioBuffer>

function decodeUrl(src) {
  return fetch(src)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx().decodeAudioData(buf));
}

// Call from a user gesture (the "Relive the moment" click). Resumes the context
// so the first replay makes sound with no second interaction, and kicks off the
// buffer builds early so they're ready by the bat-contact frame.
export function primeReplayAudio() {
  const c = ctx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (!_batHit) _batHit = BAT_HIT_SRC ? decodeUrl(BAT_HIT_SRC) : renderBatHit();
  if (!_crowd) _crowd = CROWD_ROAR_SRC ? decodeUrl(CROWD_ROAR_SRC) : renderCrowdRoar();
}

// Play a buffer through its own gain node. Returns a handle the caller can fade.
// `delay` is scheduled on the audio clock, so it's exact relative to other
// sounds started in the same call frame.
function playBuffer(bufferPromise, { gain = 1, delay = 0 } = {}) {
  const c = ctx();
  if (!c || !bufferPromise) return null;
  const g = c.createGain();
  g.gain.value = gain;
  g.connect(c.destination);
  const startAt = c.currentTime + delay;
  const handle = { ctx: c, gain: g, src: null, cancelled: false };
  bufferPromise.then((buf) => {
    if (handle.cancelled) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(Math.max(startAt, c.currentTime));
    handle.src = src;
  });
  return handle;
}

// Sharp bat "crack": fires at the exact bat-contact event (same trigger as the
// camera FOV punch).
export function playBatHit() {
  primeReplayAudio();
  return playBuffer(_batHit, { gain: 0.9 });
}

// Swelling crowd roar: started a short beat after the hit. The buffer already
// carries its own rise-and-settle envelope; fadeOutCrowd() tails it off as the
// replay ends.
export function playCrowdRoar(delay = 0.15) {
  primeReplayAudio();
  return playBuffer(_crowd, { gain: 0.85, delay });
}

export function fadeOutCrowd(handle, seconds = 1.2) {
  if (!handle) return;
  const { ctx: c, gain: g, src } = handle;
  const now = c.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  if (src) {
    try {
      src.stop(now + seconds + 0.05);
    } catch {
      /* already stopped */
    }
  }
}

// Immediate kill (replay cancelled / restarted).
export function stopCrowd(handle) {
  if (!handle) return;
  handle.cancelled = true;
  fadeOutCrowd(handle, 0.12);
}

// ---------------------------------------------------------------------------
// Synthesized placeholders. Rendered once offline into an AudioBuffer, then
// cached and played like any decoded file. Delete this section when real assets
// land — nothing else references it.

function renderBatHit() {
  const sr = 44100;
  const dur = 0.2;
  const oac = new OAC(1, Math.ceil(sr * dur), sr);

  // short bandpassed noise burst — the "crack"
  const noiseBuf = oac.createBuffer(1, oac.length, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = oac.createBufferSource();
  noise.buffer = noiseBuf;
  const bp = oac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600;
  bp.Q.value = 0.9;
  const nGain = oac.createGain();
  nGain.gain.setValueAtTime(0.0001, 0);
  nGain.gain.exponentialRampToValueAtTime(1, 0.002);
  nGain.gain.exponentialRampToValueAtTime(0.0006, 0.13);
  noise.connect(bp).connect(nGain).connect(oac.destination);

  // low thud under it — willow/leather weight
  const osc = oac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(230, 0);
  osc.frequency.exponentialRampToValueAtTime(90, 0.08);
  const oGain = oac.createGain();
  oGain.gain.setValueAtTime(0.0001, 0);
  oGain.gain.exponentialRampToValueAtTime(0.6, 0.004);
  oGain.gain.exponentialRampToValueAtTime(0.0006, 0.1);
  osc.connect(oGain).connect(oac.destination);

  noise.start(0);
  osc.start(0);
  osc.stop(dur);
  return oac.startRendering();
}

function renderCrowdRoar() {
  const sr = 44100;
  const dur = 4.5;
  const oac = new OAC(2, Math.ceil(sr * dur), sr);

  // rumbling noise bed (crude integrated noise ~= low-frequency-weighted)
  const noiseBuf = oac.createBuffer(2, oac.length, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = noiseBuf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5 + w * 0.15;
    }
  }
  const noise = oac.createBufferSource();
  noise.buffer = noiseBuf;
  const hp = oac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 180;
  const lp = oac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1100;

  // swell: rise ~0.9s, hold, settle toward the end
  const env = oac.createGain();
  env.gain.setValueAtTime(0.0001, 0);
  env.gain.exponentialRampToValueAtTime(0.9, 0.9);
  env.gain.setValueAtTime(0.9, dur - 1.4);
  env.gain.exponentialRampToValueAtTime(0.06, dur - 0.05);
  noise.connect(hp).connect(lp).connect(env).connect(oac.destination);

  // a few detuned saws with slow tremolo — a hint of "voices" over the noise
  [180, 240, 320].forEach((f, i) => {
    const o = oac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const og = oac.createGain();
    og.gain.value = 0.015;
    const lfo = oac.createOscillator();
    lfo.frequency.value = 4 + i;
    const lfoG = oac.createGain();
    lfoG.gain.value = 0.01;
    lfo.connect(lfoG).connect(og.gain);
    o.connect(og).connect(env);
    o.start(0);
    lfo.start(0);
    o.stop(dur);
    lfo.stop(dur);
  });

  noise.start(0);
  return oac.startRendering();
}
