# Moss — a living experiment

An interactive geological art study built with Next.js, React Three Fiber, Three.js, and GSAP. All 3D geometry, vegetation, rock textures, cursor growth, and ambient sound are generated locally in the browser. No paid APIs or external models are required.

## Run

```sh
npm install
npm run dev -- --port 3002
```

Open http://localhost:3002. `npm run build` creates a static export in `out/`. `npm run typecheck` checks TypeScript. Development uses `.next-dev/` for its temporary preview files.

## Explore

- Move the cursor to plant binary traces. A continuous ribbon of binary cells gradually fills with overlapping, softly textured moss, subtle color patches, and branching edges. It fades after nineteen seconds.
- Drag the specimen horizontally to rotate it. Brush or click the ferns and flowers to disturb their springing stems.
- Use the **Layers** icon in the floating glass dock to separate the rock layers.
- Adjust **Breeze** to vary plant motion. Toggle ambient sound, pause the scene, or reset the garden using the glass dock.
- Open **About** for instructions or **Breeze** for the wind slider. Both use translucent, blurred glass panels. Escape closes the panel and restores focus to its dock button.
- Touch devices grow traces while dragging. Reduced motion preferences disable ambient movement and the cursor effect.

## Source

- `src/app/page.tsx`: composition, state, controls, GSAP entrance, and synthesized wind audio.
- `src/components/Specimen.tsx`: procedural rock, instanced moss and grass, articulated ferns, flowers, and lighting.
- `src/components/GrowthTrail.tsx`: bounded canvas trail with staged code, branching growth, leaves, and decay.
- `src/app/globals.css`: full-screen minimal composition, translucent glass dock, warped highlights, and responsive panels.

The supplied transparent moss image is used only as a fallback when WebGL is unavailable. Sound starts only after an explicit click.

## Validation

The production static export builds successfully. Dependencies have zero reported npm audit vulnerabilities after overriding PostCSS with its patched release. Desktop and narrow layouts, the trail, and the view controls were checked in the in-app browser.

