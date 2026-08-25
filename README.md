# Can an AI agent do physics experiments through a webpage?

`agent-physics-lab` is an early WebMCP Challenge experiment. It asks whether a browser agent can manipulate a visible physics apparatus, collect measurements, and answer a question from repeated experiments rather than prior knowledge.

The first apparatus is intentionally small: one ball, one inclined ramp, gravity, Coulomb friction, adjustable mass and ramp angle, and a few measurements. The ball is modeled as a sliding point mass; rotational dynamics are deliberately omitted and the limitation is visible in the interface.

## Target interaction

> **Human:** At what coefficient of friction does the ball stop reaching the bottom?

An agent changes friction, runs the experiment, reads the result, and narrows the transition region. Every run animates in the same page the human sees.

The second target asks whether mass changes the result. The agent must test multiple masses and compare the measurements.

## WebMCP interface

The page registers five tools through the current imperative API at `document.modelContext`:

- `get_experiment_state()`
- `set_parameter(name, value)`
- `run_experiment()`
- `reset_experiment()`
- `get_measurements()`

The human controls and WebMCP tools call the same `ExperimentController`, which calls the same deterministic simulation.

WebMCP is an experimental browser API. In a browser without it, the demo still works manually and exposes the same callbacks at `window.agentPhysicsLabTools` for inspection. See the [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) for current browser setup and inspection tools.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

```bash
npm test
npm run build
```

## Architecture

- `src/simulation.js`: deterministic state and physics
- `src/experiment.js`: shared experiment operations and visible playback
- `src/ui.js`: human controls and rendering
- `src/webmcp.js`: semantic tool schemas mapped to shared operations

SI units are used internally. The physics model uses constant acceleration along the ramp:

```text
a = max(0, g(sin(theta) - mu cos(theta)))
```

Mass therefore cancels from this idealized model. That is a hypothesis the agent can verify experimentally through the page.

## Status

Initial vertical slice:

- deterministic incline simulation
- visible runs with live measurements
- shared human and agent control path
- five WebMCP tools
- focused state and limiting-case tests

This is a small prototype, not a finished scientific platform. The next milestone is to validate the full natural-language agent loop in a WebMCP-enabled browser before improving graphics or adding capabilities.
