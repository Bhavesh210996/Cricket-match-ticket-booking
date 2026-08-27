// "Share this seat" — purely local image generation, no backend / no links.
//
// composeSeatCard() takes the seat's captured POV snapshot (the same data URL
// the compare feature produces via captureSeatPov / seat.povImage) and paints
// it onto a fresh canvas with a legibility scrim, the seat label / price /
// tier, and a "PITCHSIDE" watermark, then exports a PNG data URL.
//
// shareSeatCard() runs that, then offers it through the native share sheet
// (navigator.share with the PNG as a File — good on mobile) and, where that
// isn't available, falls back to a normal browser download.

import { money } from './tokens.js';

const ACCENT = '#d7ff3e';
const OUT_W = 1200; // export width; height follows the snapshot's aspect
const COND = "'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif";
const BODY = "'Barlow', system-ui, sans-serif";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// seat: seatData() object. imageDataUrl: POV snapshot, or null/undefined.
// Returns a PNG data URL.
export async function composeSeatCard(seat, imageDataUrl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let img = null;
  if (imageDataUrl) {
    try {
      img = await loadImage(imageDataUrl);
    } catch {
      img = null;
    }
  }

  const outH = img ? Math.round(OUT_W * (img.height / img.width)) : Math.round(OUT_W * 0.625);
  canvas.width = OUT_W;
  canvas.height = outH;

  if (img) {
    ctx.drawImage(img, 0, 0, OUT_W, outH);
  } else {
    const g = ctx.createLinearGradient(0, 0, OUT_W, outH);
    g.addColorStop(0, '#0b1018');
    g.addColorStop(1, '#05070c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, OUT_W, outH);
  }

  // bottom scrim so the text reads over any snapshot
  const scrim = ctx.createLinearGradient(0, outH * 0.4, 0, outH);
  scrim.addColorStop(0, 'rgba(5,7,12,0)');
  scrim.addColorStop(0.55, 'rgba(5,7,12,0.55)');
  scrim.addColorStop(1, 'rgba(5,7,12,0.94)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, OUT_W, outH);

  // make sure the web fonts are ready before measuring/drawing text
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fall back to system fonts */
    }
  }

  const padX = 56;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // sub-line (bottom-most), then work upward
  let y = outH - 52;
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#c3cddc';
  ctx.font = `500 27px ${BODY}`;
  ctx.fillText(
    `${money(seat.price)} per seat  ·  ${seat.distance}m from the pitch centre`,
    padX,
    y,
  );

  // seat label
  y -= 48;
  ctx.letterSpacing = '1px';
  ctx.fillStyle = '#f4f7fb';
  ctx.font = `700 58px ${COND}`;
  ctx.fillText(`${seat.block} · ROW ${seat.rowLabel} · SEAT ${seat.num}`.toUpperCase(), padX, y);

  // eyebrow: tier + view quality
  y -= 42;
  ctx.letterSpacing = '3px';
  ctx.fillStyle = ACCENT;
  ctx.font = `600 23px ${COND}`;
  ctx.fillText(`${seat.tierLabel} TIER · ${seat.quality} VIEW`.toUpperCase(), padX, y);

  // watermark, bottom-right
  ctx.letterSpacing = '5px';
  ctx.font = `700 25px ${COND}`;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.textAlign = 'right';
  ctx.fillText('PITCHSIDE', OUT_W - padX, outH - 52);

  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

function fileNameFor(seat) {
  return `pitchside-${seat.block}-${seat.rowLabel}${seat.num}.png`.replace(/\s+/g, '');
}

function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Compose the card, then share it. Native share sheet with the PNG as a file
// where supported; plain download otherwise (or if the user's browser rejects
// the share for anything other than them dismissing it).
export async function shareSeatCard(seat, imageDataUrl) {
  const png = await composeSeatCard(seat, imageDataUrl);
  const fileName = fileNameFor(seat);
  const label = `${seat.block} · Row ${seat.rowLabel} · Seat ${seat.num}`;

  let file = null;
  try {
    const blob = await (await fetch(png)).blob();
    file = new File([blob], fileName, { type: 'image/png' });
  } catch {
    file = null;
  }

  if (
    file &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `My seat — ${label}`,
        text: `${label} · ${money(seat.price)} — PITCHSIDE seat preview`,
      });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user closed the sheet
      // any other failure: fall through to a download
    }
  }

  downloadDataUrl(png, fileName);
}
