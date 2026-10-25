# Moss — a living experiment

An interactive geological art study built with Next.js, React Three Fiber, Three.js, and GSAP. Geometry, vegetation, and cursor growth are procedural. All audio comes from ten real CC0 recordings bundled locally in public/audio; the application does not synthesize sound. No paid APIs or external models are required.

## Run

```sh
npm install
npm run dev -- --port 3002
```

Open http://localhost:3002. `npm run build` creates a static export in `out/`. `npm run typecheck` checks TypeScript. Development uses `.next-dev/` for its temporary preview files.

## Explore

- Open the **Seed tray**, choose Daisy, Clover, or Bluebell, then tap the upper moss surface to plant. Seedlings unfold over 8–11 seconds, bloom, and respond to brushing and the wind. Dragging still rotates the specimen. Put seeds away or press Escape to finish planting. Reset clears the planted garden. Up to 24 plants fit on the specimen; close placements leave room for existing seedlings.

- Move the cursor to plant binary traces. Two slightly narrower rows of binary cells grow into a dense textured moss bed and leafy fronds with larger, irregularly spaced stems and several generations of recursive branches. Individual moss fronds supply the soft texture without a gradient wash, and the growth still fades behind movement.
- Drag the specimen horizontally to rotate it. Brush or click the ferns and flowers to disturb their springing stems.
- Use the **Layers** icon to open an illustrated geological cross-section. Inspect the middle layer to discover a sculpted ammonite fossil.
- Adjust the **Solar** wind slider to crossfade soft leaf rustle, slow sheltered window wind, and a longer bedroom-window howl recording and vary plant motion. Set master volume from the speaker’s glass panel (zero is silent), pause the scene, or reset the garden using the glass dock.
- Open **Atmosphere** for Solar, Rain, and Nocturn. The existing slider becomes rainfall intensity in Rain (droplets → rain → storm with recorded thunder), and nocturnal intensity in Nocturn (crickets → crickets + fire → crickets + fire + occasional recorded owl call). No extra controls are introduced. In Solar it controls wind strength.
- Open **About** for instructions or **Atmosphere → Solar** for the wind slider. These use translucent, blurred glass panels. Escape closes a panel and restores focus to its dock button.
- Touch devices grow traces while dragging. Reduced motion preferences disable ambient movement and the cursor effect.

## Source

- `src/app/page.tsx`: composition, state, existing controls, and GSAP entrance.
- `src/components/Specimen.tsx`: detailed noise-sculpted gray rock, instanced moss, responsive ferns, flowers, a 3D fossil, and weather lighting.
- `src/components/GrowthTrail.tsx`: bounded canvas trail with staged code, branching growth, leaves, and decay.
- `src/components/Atmosphere.tsx`: animated weather and fireflies.
- `src/components/RecordedAudio.ts`: lazy field-recording playback, equal-power crossfades, measured wind level matching and gentle filtering of wind and storm rain, and occasional recorded owl/thunder layers.
- `public/audio/CREDITS.txt` and `public/audio/credits.json`: creator, original source, CC0 license, download URL, and SHA-256 for every bundled recording.
- `src/components/GeologicalDiagram.tsx`: cross-section callouts and accessible fossil discovery.
- `src/app/globals.css`: full-screen minimal composition, translucent glass dock, warped highlights, and responsive panels.

The supplied transparent moss image is used only as a fallback when WebGL is unavailable. The initial mix selects only the soft breeze. Audio starts on load when the browser allows it, otherwise the first pointer interaction unlocks playback.

## Validation

The production static export builds successfully. Dependencies have zero reported npm audit vulnerabilities after overriding PostCSS with its patched release. Desktop and narrow layouts, the trail, and the view controls were checked in the in-app browser.


Wind calibration is stored in `src/components/windCalibration.ts`: MP3s were decoded and measured after their matching low-pass filters, then brought to approximately −22 dBFS RMS before scene faders. The default breeze mix averages approximately −30 dBFS at 65% master volume. The recordings themselves remain unchanged.
