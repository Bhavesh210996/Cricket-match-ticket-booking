// Ported verbatim from stadium-view.js (Claude Design export).
// Only change: bundled `three` import. These build canvas-backed textures at
// call time, so call them inside useMemo and dispose on unmount.

import * as THREE from 'three';

export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d').createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#080b12');
  g.addColorStop(0.42, '#131a26');
  g.addColorStop(0.72, '#2b2b30');
  g.addColorStop(0.88, '#4a3c31');
  g.addColorStop(1, '#6b503a');
  const ctx = c.getContext('2d');
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
