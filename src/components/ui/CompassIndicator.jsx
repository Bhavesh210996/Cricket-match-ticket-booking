// Bottom-right orientation dial (overview + stand modes). Reads live azimuth /
// polar off the shared CameraControls each frame. Reference: the compass dial
// in the isOverview block (repositioned bottom-right per spec).
import { useEffect, useRef, useState } from 'react';
import { useBookingStore } from '../../store/useBookingStore.js';
import { getCameraAngles } from '../../stadium/flyCamera.js';
import { COND, ACCENT } from './tokens.js';

const DEG = 180 / Math.PI;

export default function CompassIndicator() {
  const mode = useBookingStore((s) => s.mode);
  const [angles, setAngles] = useState({ azimuth: 0, polar: Math.PI / 4 });
  const last = useRef(angles);

  const visible = mode === 'overview' || mode === 'stand';

  useEffect(() => {
    if (!visible) return;
    let raf;
    const tick = () => {
      const a = getCameraAngles();
      if (
        Math.abs(a.azimuth - last.current.azimuth) > 0.004 ||
        Math.abs(a.polar - last.current.polar) > 0.004
      ) {
        last.current = a;
        setAngles(a);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  if (!visible) return null;

  const tiltDeg = Math.max(0, Math.round(90 - angles.polar * DEG)); // elevation above horizon

  return (
    <div
      style={{
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 94,
        height: 94,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${(angles.azimuth * DEG).toFixed(1)}deg)`,
          transition: 'transform .06s linear',
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="rgba(6,8,13,.78)"
            stroke="rgba(255,255,255,.16)"
            strokeWidth="1"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="34"
            ry="26"
            fill="rgba(47,163,92,.16)"
            stroke="rgba(255,255,255,.1)"
            strokeWidth="1"
          />
          <rect x="38" y="47" width="24" height="6" rx="1.5" fill="#c8ae83" />
          <text
            x="76"
            y="53"
            textAnchor="middle"
            fontSize="13"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="700"
            fill={ACCENT}
          >
            A
          </text>
          <text
            x="24"
            y="53"
            textAnchor="middle"
            fontSize="13"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="700"
            fill="#8fb8ff"
          >
            B
          </text>
        </svg>
      </div>

      <span
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -1,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `9px solid ${ACCENT}`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(100% + 7px)',
          transform: 'translateX(-50%)',
          fontFamily: COND,
          fontSize: 10,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: '#8b98ac',
          whiteSpace: 'nowrap',
        }}
      >
        tilt {tiltDeg}°
      </span>
    </div>
  );
}
