# Iconic Cars 3D Showroom

Take apart four cars in your browser. Orbit a car, move the teardown slider to separate its assemblies, or isolate the engine and step through its firing cycle. The models, studio environments, and textures are built procedurally in Three.js.

[![White Porsche 911 Carrera RS 2.7 on the showroom turntable](docs/screenshots/porsche-911-rs.jpg)](docs/screenshots/README.md)

## Cars

| Car | Engine |
| --- | --- |
| 1973 Porsche 911 Carrera RS 2.7 | 2.7 L air-cooled flat-six |
| 1990 BMW M3 Sport Evolution (E30) | 2.5 L S14 inline-four |
| 2002 BMW M5 (E39) | 4.9 L S62 V8 |
| 2020 Nissan GT-R (R35) | 3.8 L VR38DETT twin-turbo V6 |

## Run locally

Use Node.js 22.12 or newer, Bun 1.4, and a browser with WebGL 2. The showroom runs entirely in the browser and requires no API key.

```sh
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000`. Drag to orbit and scroll or pinch to zoom. Press **H** to toggle the controls and **Space** to pause or resume engine playback. Add `?hide=1` to open with the controls hidden.

## Build and test

```sh
bun run lint
bun run test
bun run build
bun run preview
```

The build writes the static site to `dist/`. `lint` runs the TypeScript check. The tests cover displacement, crank and piston movement, firing order, teardown motion, and vehicle data.

## Media and source

- [Screenshot gallery](docs/screenshots/README.md) shows every car and the exploded and X-ray views.
- [Showroom demo MP4](iconic-cars-showroom-demo.mp4) is a 58-second, silent 1080p60 walkthrough. If the MP4 appears as a small pointer file, install Git LFS and run `git lfs pull --include="iconic-cars-showroom-demo.mp4"`. The app builds without downloading the video.
- [Build prompt](docs/BUILD_PROMPT.md) describes the project for a coding agent, including the simulator architecture, controls, and demo storyboard.

The React controls live in `src/components/TeardownHUD.tsx`. The vehicle specs, procedural models, and render loop live in `src/sim/`.

## License and credits

The project source is available under the [Apache License 2.0](LICENSE). The teardown concept was inspired by [elvarofficial/teardown](https://github.com/elvarofficial/teardown). Vehicle names and marks belong to their respective owners. This project is independent of the vehicle manufacturers.
