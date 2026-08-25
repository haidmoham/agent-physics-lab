# Agent instructions

## Project scope

- This repository is a browser-based Vite experiment for agent-controlled physics.
- Keep project-specific truth here. Keep cross-project guidance in the appropriate private knowledge repository.
- Read the relevant source before changing it. Prefer the smallest reversible change.

## Run and verify

- Use Node.js 20 or newer.
- Install dependencies with `npm install`.
- Start the browser app with `npm run dev`. Do not run `src/main.js` directly with Node; it needs the browser DOM.
- Run focused checks with `npm test` and `npm run build`.
- Do not add tests by default. Add them when they protect meaningful or risky behavior.

## Architecture

- `src/main.js` is the browser entry point and wires the application together.
- `src/simulation.js` owns deterministic physics calculations and state transitions.
- `src/experiment.js` owns shared experiment operations and visible playback.
- `src/ui.js` owns human controls and rendering.
- `src/webmcp.js` exposes agent tools through the same experiment controller as the UI.
- Keep human and agent paths on the shared `ExperimentController`. Do not duplicate physics or create a second state owner.

## Learning and scientific scope

- Preserve the user's ownership of hypotheses, model design, experiments, and interpretation. Provide plumbing and explanations at the next useful implementation step.
- State whether a result is measured, inferred, or unknown when that distinction matters.
- Preserve visible model limitations. The current apparatus uses a sliding point-mass model with Coulomb friction and omits rotational dynamics.
- Do not turn a successful demo run into a broader physical claim without an experiment or supporting evidence.

## Safety and hygiene

- Never expose secrets or credentials.
- Keep public-facing documentation project-facing and current.
- Stage only files that belong to the current task. Avoid unrelated cleanup.
