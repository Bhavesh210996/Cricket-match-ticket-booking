import { buildStands } from '../../stadium/stands.js';
import { getConfig } from '../../stadium/seats.js';

// getConfig() walks every seat but is deterministic and stands never change,
// so derive the tier summary (label, colour, price range, availability, blocks)
// once at module load. Same values as the store's stands — ids line up.
const TIER_CONFIG = getConfig(buildStands()).tiers;

export function useTierConfig() {
  return TIER_CONFIG;
}
