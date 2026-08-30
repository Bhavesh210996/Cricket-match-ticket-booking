See Your Seat Before You Book

**Live 3D seat preview for cricket stadium ticket booking.** Instead of picking a seat from a flat, abstract map, rotate a fully 3D stadium, zoom into any stand, tap a seat, and see the exact view you'd get on match day — before you pay for it.

> This is a concept/demo project exploring what "seat selection" could look like if you could actually stand in the seat first. It is not a production ticketing system — there's no real payment, inventory, or backend; all match/seat/pricing data is mocked.

## Why this exists

Every major ticketing platform shows you a seat map. None of them show you the *view*. You pick a seat based on a price and a vague tier name, and you find out what you actually got once you're sitting in it on match day.

Pitchside flips that: you fly into the seat's exact eye-level viewpoint before you commit, look around, compare a shortlist of seats side-by-side, and even share a snapshot of the view with friends before deciding together.

## What it does

### Core flow
- **Full 3D stadium** — an oval cricket bowl with tiered stands, roof, and floodlighting, fully orbit-able (rotate, tilt, zoom) from a bird's-eye view down to pitch level.
- **Tier-based navigation** — Premium / Club / General / Berm tiers are shown with live-style pricing and availability; tapping a tier highlights it on the 3D map.
- **Stand drill-down** — zoom into any stand to see individual seats, rendered as real stadium chairs with a stylized seated crowd (not abstract blocks or dots), color-coded Available / Sold / Selected / Shortlisted — consistently across **every** stand, not just the one you've zoomed into.
- **Seat POV** — tap any seat (full seat hit-area, pan + backrest) to fly the camera directly into that seat's exact eye position. Look around with a naturally clamped drag (no seat lets you spin your head 360°), with a touch of zoom to "lean in."
- **Seat info card** — price, distance to pitch centre, eye height, and a computed view-quality rating, in a compact bar that expands upward for full detail without blocking the view.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React + Vite |
| 3D rendering | Three.js via React Three Fiber (`@react-three/fiber`) |
| 3D helpers | `@react-three/drei` (CameraControls, etc.) |
| Animation | GSAP (camera transitions, FOV punches) |
| State management | Zustand |

## Getting started

```bash
npm install
npm run dev
```

Open the local dev URL shown in your terminal. No environment variables or backend setup required — everything runs client-side with mock data.
