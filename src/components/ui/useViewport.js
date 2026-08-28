// Small viewport hook for the responsive pass. The UI here is all inline-style
// objects (no CSS framework / media queries), so components read this and branch
// their style values. Breakpoints:
//   isPhone   — width  < 600  (portrait phone / very narrow)
//   isShort   — height < 480  (landscape phone, split-screen)
//   isTablet  — 600..1023
//   isDesktop — >= 1024  (this is the pre-pass layout; keep it unchanged)
import { useEffect, useState } from 'react';

function read() {
  const w = typeof window === 'undefined' ? 1280 : window.innerWidth || 1280;
  const h = typeof window === 'undefined' ? 800 : window.innerHeight || 800;
  return {
    w,
    h,
    isPhone: w < 600,
    isShort: h < 480,
    isTablet: w >= 600 && w < 1024,
    isDesktop: w >= 1024,
  };
}

export function useViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return vp;
}
