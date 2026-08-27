// Premium / Club / General / Berm toggle chips (overview only).
// Reference: the tier chip row inside the isOverview block.
import { useBookingStore } from '../../store/useBookingStore.js';
import { useTierConfig } from './useTierConfig.js';
import { COND } from './tokens.js';

export default function TierChips() {
  const mode = useBookingStore((s) => s.mode);
  const activeTier = useBookingStore((s) => s.activeTier);
  const selectTier = useBookingStore((s) => s.selectTier);
  const tiers = useTierConfig();

  if (mode !== 'overview') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 96,
        left: 16,
        right: 16,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}
    >
      {tiers.map((t) => {
        const on = activeTier === t.id;
        return (
          <button
            key={t.id}
            onClick={() => selectTier(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 9,
              cursor: 'pointer',
              fontFamily: COND,
              fontSize: 12,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              background: on ? 'rgba(215,255,62,.14)' : 'rgba(14,20,31,.8)',
              border: `1px solid ${on ? 'rgba(215,255,62,.5)' : 'rgba(255,255,255,.1)'}`,
              color: '#e3eaf4',
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                background: t.color,
                display: 'inline-block',
              }}
            />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
