// Bridge so UI components (outside <Canvas>) can grab a one-off still of a
// seat's POV. <SnapshotRig> (inside the scene) registers the real implementation
// on mount; the compare feature calls captureSeatPov() when a seat is
// shortlisted and stores the returned data URL on that seat.
//
// The still is rendered with an offscreen camera placed at the seat-eye pose
// from povPose() and read back via the canvas (preserveDrawingBuffer is on in
// App.jsx). It is captured ONCE, at add time — the compare screen only ever
// shows these static images, it never live-renders.

let _impl = null;

export function registerSnapshot(fn) {
  _impl = fn;
}

// st: stand object, seat: seatData() object. Returns a JPEG data URL, or null
// if the rig isn't mounted yet / capture failed.
export function captureSeatPov(st, seat) {
  if (!_impl || !st || !seat) return null;
  try {
    return _impl(st, seat);
  } catch {
    return null;
  }
}
