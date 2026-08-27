// Ported verbatim from stadium-view.js (Claude Design export).
// Only change: bundled `three` import. These build canvas-backed textures at
// call time, so call them inside useMemo and dispose on unmount.

import * as THREE from 'three';

// `stops` is an optional array of [offset, '#hex'] pairs (top → bottom). The
// default is the original night gradient; src/stadium/sun.js passes a
// time-of-day blend so the dome shifts warm at sunset / neutral at midday.
export function skyTexture(stops) {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  (stops || [
    [0, '#080b12'], [0.42, '#131a26'], [0.72, '#2b2b30'], [0.88, '#4a3c31'], [1, '#6b503a'],
  ]).forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function turfTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2c7538';
  ctx.fillRect(0, 0, 512, 512);
  for (let r = 256; r > 0; r -= 24) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.round(r / 24) % 2 ? '#2f7c3b' : '#296e34';
    ctx.fill();
  }
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#0b2410';
    ctx.fillRect((i * 512) / 22, 0, 512 / 22, 512);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  return t;
}

export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,252,235,1)');
  g.addColorStop(0.18, 'rgba(255,246,205,0.55)');
  g.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Soft length-wise softener for the fake roof-edge light shafts (RoofLighting).
// The hard source→tip falloff is baked into the cone as a vertex-alpha
// gradient; this texture just adds a gentle extra taper on top. Mapped down a
// cylinder: v=1 (top / roof end) samples the bright stop.
export function beamTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,247,224,0.90)');
  g.addColorStop(0.5, 'rgba(255,240,201,0.50)');
  g.addColorStop(1, 'rgba(255,236,186,0.16)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
  return new THREE.CanvasTexture(c);
}

// Small round order badge (1 / 2 / 3) floated above a shortlisted seat in the
// stand view. Cyan ring to match the "in compare" seat state.
export function badgeTexture(n) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.arc(32, 32, 27, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(9,18,28,0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#2ee6ff';
  ctx.stroke();
  ctx.fillStyle = '#e4fbff';
  ctx.font = 'bold 40px Barlow Condensed, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 32, 36);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function labelSprite(text) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = 'bold 88px Barlow Condensed, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(9, 9, 1);
  return s;
}
