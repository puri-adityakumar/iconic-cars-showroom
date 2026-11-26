# Build prompt for Iconic Cars 3D Showroom

Build a static, browser-based 3D showroom with React, TypeScript, Vite, Three.js, Tailwind CSS, and Lucide icons. Use Bun to install dependencies and commit its lockfile. Keep vehicle geometry, materials, textures, and environments procedural so the app runs without remote model downloads, a backend, or an API key.

## Vehicles

Use meters in the scene and millimeters for engine dimensions. Keep the car’s front on the positive Z axis, Y up, and mirror left and right geometry across X. Drive the UI and simulation from the same typed specification data.

| Vehicle ID | Vehicle and identifying details | Engine layout, displacement and firing order |
| --- | --- | --- |
| `porsche-911-rs` | 1973 Porsche 911 Carrera RS 2.7 with round headlamps, ducktail, Carrera side script, and Fuchs wheels | Rear-mounted flat-six, 2,687 cc, 1–6–2–4–3–5 |
| `bmw-e30-m3` | 1990 BMW M3 Sport Evolution with box flares, four round headlamps, red bumper piping, rear wing, and BBS wheels | S14 inline-four, 2,467 cc, 1–3–4–2 |
| `bmw-e39-m5` | 2002 BMW M5 with kidney grilles, halo headlamps, four doors, a trunk lip, and quad exhaust tips | S62 V8, 4,941 cc, 1–5–4–8–6–3–7–2 |
| `nissan-r35-gtr` | 2020 Nissan GT-R with a V-motion grille, swept headlamps, round taillights, and a rear transaxle | VR38DETT V6, 3,799 cc, 1–2–3–4–5–6 |

Model each shell, hood or engine lid, doors, wheels and brakes, suspension, engine, transmission, and exhaust as identifiable groups. Shape body panels with sampled curves and surfaces, smooth their normals, and use bevels, panel gaps, and material changes to define edges. Generate cabin details, trim, markings, and tire textures on canvas. Keep badges and other vehicle markings confined to their models.

## Scene and controls

Keep rendering and vehicle state in a Three.js scene manager. Share wheel, brake, material, and geometry helpers across the vehicle builders. Store dimensions, liveries, camera presets, and subsystem labels in `src/sim/specs.ts`. Keep React responsible for controls and readouts.

Start with the Porsche in the Sakura pavilion. Offer four backdrops named Sakura, Canada, India, and Studio. Use a dark or neutral turntable floor and studio lighting. Put the landscape outside the pavilion windows for the themed backdrops. Give each vehicle at least five paint choices.

Provide orbit and zoom, Hero, Engine, Chassis, Front, and Side views, and a teardown slider from assembled to fully separated. Interpolate each assembly along its own path and keep it attached to its correct pivot during the motion. Provide Solid, X-Ray, and Section modes, subsystem isolation, optional labels, a guided tour, RPM control, pause, and ±15° crank stepping. Use slider-crank geometry and a 720° combustion cycle to animate the crank, rods, and pistons. Keep the controls compact on desktop and mobile. Support `?car=<vehicle-id>`, `?hide=1`, **H** to toggle the controls, and **Space** to toggle engine playback.

## Screenshots and demo

Make a clean capture view at `?director=1` with no control panels. Expose `window.__SHOWROOM_DIRECTOR__.renderFrame(state)` with explicit vehicle, paint, backdrop, cutaway, subsystem, teardown progress, crank angle, wheel angle, camera position, camera target, FOV, and environmental time. This allows a Playwright Chromium page to render frames at fixed times. Save public screenshots of the four assembled cars plus teardown and X-ray in `docs/screenshots/`.

For the silent demo, render a 1920 × 1080 canvas at 60 fps and encode an H.264 MP4 with FFmpeg. Use the following sequence.

1. Spend the opening 13 seconds above the Porsche’s front, easing the camera down and in, then continuing into a perpendicular side view.
2. Continue the same camera movement across paint and backdrop changes. Show the Porsche in the studio, M3 in Canada, M5 in India, and GT-R in Sakura.
3. Show teardowns from different angles. Use the GT-R from the front, the M3 from the rear, and the Porsche from the engine side.
4. Show the M5 V8 in X-Ray, the isolated Porsche flat-six in motion, and a GT-R section cutaway.
5. Reassemble the car on camera, then finish with all four cars in a synchronized 2×2 grid and fade out. Aim for about 58 seconds overall.

## Verification

Expose `dev`, `build`, `preview`, `lint`, and `test` package scripts. Run `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, and `bun run build`. Verify all four engines’ displacement and firing order, piston extrema, and monotonic assembly separation. In Chromium, verify that each vehicle loads, the teardown and cutaway controls work, the 390 px layout fits, and the director view contains only the showroom canvas. Decode the final MP4 end to end before sharing it.
