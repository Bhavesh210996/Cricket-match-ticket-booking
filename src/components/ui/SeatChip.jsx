// Lightweight confirm step for seat selection. When a seat is previewed
// (store.pendingSeat, stand mode) this chip floats just above that seat in
// screen space showing row/seat + price and a View action. View — or a second
// tap on the seat itself — commits and flies to POV. No camera move on preview.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { seatPos } from '../../stadium/seats.js';
import { projectToScreen } from '../../stadium/flyCamera.js';
import { captureSeatPov } from '../../stadium/snapshot.js';
import { useViewport } from './useViewport.js';
import { COND, ACCENT, money } from './tokens.js';

export default function SeatChip() {
  const mode = useBookingStore((s) => s.mode);
  const pendingSeat = useBookingStore((s) => s.pendingSeat);
  const stands = useBookingStore((s) => s.stands);
  const confirmSeat = useBookingStore((s) => s.confirmSeat);
  const compareList = useBookingStore((s) => s.compareList);
  const addToCompare = useBookingStore((s) => s.addToCompare);
  const vp = useViewport();

  const inList = !!pendingSeat && compareList.some((c) => c.key === pendingSeat.key);
  const listFull = compareList.length >= 3 && !inList;

  // shortlist without flying to POV: snapshot the seat's view now, keep browsing
  const shortlist = () => {
    if (!pendingSeat || inList || listFull) return;
    const st = stands.find((s) => s.id === pendingSeat.standId);
    addToCompare(pendingSeat, st ? captureSeatPov(st, pendingSeat) : null);
  };

  // world point to anchor to: seat position, lifted to about backrest-top height
  const anchor = useMemo(() => {
    if (!pendingSeat) return null;
    const st = stands.find((s) => s.id === pendingSeat.standId);
    if (!st) return null;
    const p = seatPos(st, pendingSeat.row - 1, pendingSeat.num - 1);
    return new THREE.Vector3(p.x, p.y + 1.1, p.z);
  }, [pendingSeat, stands]);

  const [pos, setPos] = useState(null);
  const lastRef = useRef(null);

  useEffect(() => {
    if (!anchor) return undefined;
    lastRef.current = null; // don't suppress the first update against a prior seat
    let raf;
    const tick = () => {
      const next = projectToScreen(anchor);
      const prev = lastRef.current;
      const moved =
        (next && !prev) ||
        (!next && prev) ||
        (next && prev && (Math.abs(next.x - prev.x) > 0.5 || Math.abs(next.y - prev.y) > 0.5));
      if (moved) {
        lastRef.current = next;
        setPos(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  if (mode !== 'stand' || !pendingSeat || !anchor || !pos) return null;

  // keep the chip (and its action buttons) on-screen when the seat projects
  // near a viewport edge — critical on phones where it would otherwise be
  // half-clipped with unreachable buttons.
  const half = vp.isPhone ? 150 : 78;
  const cx = Math.min(Math.max(pos.x, half + 8), vp.w - half - 8);
  const cy = Math.max(pos.y, vp.isShort ? 64 : 96);

  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transform: 'translate(-50%, calc(-100% - 12px))',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 'calc(100vw - 20px)',
        padding: '8px 10px',
        borderRadius: 12,
        background: 'rgba(6,8,13,.92)',
        border: '1px solid rgba(215,255,62,.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0,0,0,.45)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            color: '#eaf0f8',
          }}
        >
          Row {pendingSeat.rowLabel} · Seat {pendingSeat.num}
        </span>
        <span style={{ fontSize: 11.5, color: '#93a1b6', fontVariantNumeric: 'tabular-nums' }}>
          {money(pendingSeat.price)}
        </span>
      </div>

      <button
        onClick={shortlist}
        disabled={inList || listFull}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: `1px solid rgba(215,255,62,${inList || listFull ? '.2' : '.45'})`,
          background: 'rgba(215,255,62,.08)',
          color: ACCENT,
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          cursor: inList || listFull ? 'default' : 'pointer',
          opacity: inList || listFull ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {inList ? '✓ Shortlisted' : listFull ? 'List full' : '+ Compare'}
      </button>

      <button
        onClick={confirmSeat}
        style={{
          padding: '6px 12px',
          border: 'none',
          borderRadius: 8,
          background: ACCENT,
          color: '#06080d',
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        See the view
      </button>

      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '7px solid rgba(215,255,62,.4)',
        }}
      />
    </div>
  );
}
