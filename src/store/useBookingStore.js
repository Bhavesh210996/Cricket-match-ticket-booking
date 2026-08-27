import { create } from 'zustand';
import { buildStands } from '../stadium/stands.js';

// The original wired UI <-> 3D through DOM CustomEvents (`stadium-stand`,
// `stadium-seat`, ...) plus a 250ms setInterval poll for config. That whole
// bus is replaced by this store: components subscribe to state, the scene
// reacts, and <CameraRig> flies the camera on mode changes.

const stands = buildStands();

// screen flow from `Cricket Seat Preview.dc.html` (DCLogic state machine):
//   overview -> stand -> pov -> compare
export const useBookingStore = create((set) => ({
  stands,

  mode: 'overview',        // 'overview' | 'stand' | 'pov' | 'compare'
  activeTier: null,        // highlighted price band while in overview
  focusedStandId: null,    // stand id the camera has flown into
  pendingSeat: null,       // stand-mode: highlighted seat awaiting confirm (chip shown, no camera move)
  selectedSeat: null,      // seatData() object — committed seat, camera has flown to POV
  compareList: [],          // up to 3 seatData() objects

  // overview: toggle a tier highlight (matches DCLogic._selectTier)
  selectTier: (tierId) =>
    set((s) => ({ activeTier: s.activeTier === tierId ? null : tierId })),

  // overview -> stand (matches DCLogic._pickStand)
  selectStand: (standId) =>
    set({
      mode: 'stand',
      focusedStandId: standId,
      selectedSeat: null,
      pendingSeat: null,
      activeTier: null,
    }),

  // stand: first tap on a seat previews it (highlight + chip, no camera move);
  // tapping the same seat again confirms and flies to POV.
  previewSeat: (seat) =>
    set((s) =>
      s.pendingSeat && s.pendingSeat.key === seat.key
        ? { mode: 'pov', selectedSeat: seat, pendingSeat: null }
        : { pendingSeat: seat },
    ),

  // chip "View" action: commit the pending seat -> POV
  confirmSeat: () =>
    set((s) =>
      s.pendingSeat ? { mode: 'pov', selectedSeat: s.pendingSeat, pendingSeat: null } : {},
    ),

  clearPendingSeat: () => set({ pendingSeat: null }),

  // direct stand -> pov (programmatic / deep-link; UI uses preview + confirm)
  selectSeat: (seat) =>
    set({ mode: 'pov', selectedSeat: seat, pendingSeat: null }),

  // pov -> stand (or overview if we somehow have no focused stand)
  deselectSeat: () =>
    set((s) => ({
      mode: s.focusedStandId ? 'stand' : 'overview',
      selectedSeat: null,
      pendingSeat: null,
    })),

  // * -> compare, carrying the current seat into the shortlist (DCLogic._addCompare)
  enterCompare: () =>
    set((s) => {
      const seat = s.selectedSeat;
      const dup = seat && s.compareList.some((c) => c.key === seat.key);
      return {
        mode: 'compare',
        compareList: seat && !dup ? [...s.compareList, seat].slice(-3) : s.compareList,
      };
    }),

  // escape hatch back to the top of the flow
  backToOverview: () =>
    set({
      mode: 'overview',
      focusedStandId: null,
      selectedSeat: null,
      pendingSeat: null,
      activeTier: null,
    }),
}));

// dev-only handle for driving the state machine from the console.
if (import.meta.env.DEV) {
  globalThis.useBookingStore = useBookingStore;
}
