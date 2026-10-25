# Moss — a living experiment

An interactive geological art study built with Next.js, React Three Fiber, Three.js, and GSAP. All 3D geometry, vegetation, rock textures, cursor growth, and ambient sound are generated locally in the browser. No paid APIs or external models are required.

## Run

```sh
npm install
npm run dev -- --port 3002
```

Open http://localhost:3002. `npm run build` creates a static export in `out/`. `npm run typecheck` checks TypeScript. Development uses `.next-dev/` so it can run alongside a production build.

## Explore

- Move the cursor to plant binary traces. They branch into fronds over a few seconds and fade after fourteen seconds.
- Drag the specimen horizontally to rotate it. Brush or click the ferns and flowers to disturb their springing stems.
- Choose **Beneath the surface** to separate the rock layers.
- Adjust **Breeze** to vary plant motion. Toggle ambient sound, pause the scene, or reset the garden using the bottom controls.
- Open **Field notes** for context and instructions. Escape closes the dialog; keyboard focus stays inside it while open.
- Touch devices grow traces while dragging. Reduced motion preferences disable ambient movement and the cursor effect.

## Source

- `src/app/page.tsx`: composition, state, controls, GSAP entrance, and synthesized wind audio.
- `src/components/Specimen.tsx`: procedural rock, instanced moss and grass, articulated ferns, flowers, and lighting.
- `src/components/GrowthTrail.tsx`: bounded canvas trail with staged code, branching growth, leaves, and decay.
- `src/app/globals.css`: responsive editorial diagram layout.

The supplied transparent moss image is used only as a fallback when WebGL is unavailable. Coordinates and botanical labels are illustrative art direction. Sound starts only after an explicit click.

## Validation

The production static export builds successfully. Dependencies have zero reported npm audit vulnerabilities after overriding PostCSS with its patched release. Desktop and narrow layouts, the trail, and the view controls were checked in the in-app browser.
