---
name: build-teardown-showroom
description: Build or extend interactive browser-based 3D teardown showrooms for vehicles and mechanical assemblies. Use for procedural modeling, exploded views, cutaways, and mechanical animation where people need to inspect how parts fit or move.
---

# Build a teardown showroom

Identify the subject, the assemblies the viewer should inspect, and the level of mechanical detail the user needs. For an existing showroom, follow its scene conventions, controls, and asset pipeline. For a new build, React, TypeScript, Vite, and Three.js are a practical starting point for a static app.

## Model from the assembled state

- Keep dimensions, pivot locations, subsystem IDs, and camera targets in typed data shared by the geometry, animation, and overlays. Choose consistent units and axes. For a vehicle, block out the wheelbase, track, and silhouette against reference views before detailing panels and trim.
- Build each inspectable assembly as a group with a local origin at its real pivot or mounting point. Keep parts that must move together in the same group. Share geometry and material helpers across subjects, and dispose of replaced scene resources when switching models.
- Derive each exploded pose from the assembled transforms and a normalized progress value. Give assemblies independent paths and stagger separation where paths cross. Check that scrubbing backward restores the exact assembled state and inspect intermediate poses from more than one angle.
- Base mechanical motion on explicit inputs such as crank angle, with known travel limits and phase relationships. If a measurement is uncertain, model it as an approximation and keep the UI’s precision consistent with the source data.

## Make the scene inspectable

- Separate camera and simulation state from the UI. Start with an assembled hero view, then add controls that serve the subject, such as orbit, an explosion slider, relevant camera presets, and subsystem isolation. Preserve the viewer's context when switching modes.
- Use translucent bodywork for an X-ray view when internal parts need to remain legible. Use clipping for a section view when a fixed cut plane makes the assembly easier to understand. Restore the original materials and visibility when the viewer returns to solid mode.
- Verify assembly at the limits and midpoint of the slider. Test important motion relationships, then inspect the actual browser render for silhouette, clipping, overlapping parts, and cramped mobile controls.

## Capture a demo when requested

Use a controls-free capture view with explicit camera, assembly, and mechanical state. Step time by frame index in Chromium when the motion needs to be repeatable. Show the assembled object first, then an exploded view and an internal detail. For video, encode with FFmpeg and play back the opening, transitions, and ending before sharing it.

Read [the Iconic Cars build prompt](references/iconic-cars-build-prompt.md) when recreating this repository's four-car showroom or when an example of vehicle specs, director controls, and a demo storyboard would help.

This skill draws inspiration from [elvarofficial’s teardown skill for Claude Code](https://github.com/elvarofficial/teardown).
