// Lightweight confirm step for seat selection. When a seat is previewed
// (store.pendingSeat, stand mode) this chip floats just above that seat in
// screen space showing row/seat + price and a View action. View — or a second
// tap on the seat itself — commits and flies to POV. No camera move on preview.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useBookingStore } from '../../store/useBookingStore.js';
import { seatPos } from '../../stadium/seats.js';
import { projectToScreen } from '../../stadium/flyCamera.js';
import { COND, ACCENT, money } from './tokens.js';

export default function SeatChip() {
  const mode = useBookingStore((s) => s.mode);
  const pendingSeat = useBookingStore((s) => s.pendingSeat);
  const stands = useBookingStore((s) => s.stands);
  const confirmSeat = useBookingStore((s) => s.confirmSeat);

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

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, calc(-100% - 12px))',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
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
        View
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
