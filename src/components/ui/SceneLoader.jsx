// Full-screen themed loading overlay shown until the 3D scene has built its
// geometry/textures/instances and drawn its first frame. Sits on top of the
// (deferred) <Canvas> so the user sees the dark theme + a spinner instead of a
// white flash. Stays mounted after `visible` goes false and fades out via CSS,
// then becomes click-through.
import { COND, ACCENT, APP_BG } from './tokens.js';

export default function SceneLoader({ visible }) {
  return (
    <div
      aria-hidden={!visible}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        background: APP_BG,
        color: '#eaf0f8',
        zIndex: 50,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity .5s ease',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,.12)',
          borderTopColor: ACCENT,
          animation: 'spin .9s linear infinite',
        }}
      />
      <div
        style={{
          fontFamily: COND,
          fontSize: 12,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: '#93a1b6',
        }}
      >
        Building the stadium
      </div>
    </div>
  );
}
