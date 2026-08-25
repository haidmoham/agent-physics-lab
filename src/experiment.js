import {
  createInitialState,
  setSimulationParameter,
  simulate,
} from './simulation.js';

export class ExperimentController extends EventTarget {
  #state;
  #runId = 0;

  constructor(parameters = {}) {
    super();
    this.#state = createInitialState(parameters);
  }

  getState() {
    return structuredClone(this.#state);
  }

  setParameter(name, value) {
    if (this.#state.status === 'running') {
      throw new Error('Wait for the current experiment to finish');
    }
    this.#state = setSimulationParameter(this.#state, name, value);
    this.#emit();
    return this.getState();
  }

  reset() {
    this.#runId += 1;
    this.#state = createInitialState(this.#state.parameters);
    this.#emit();
    return this.getState();
  }

  async run() {
    if (this.#state.status === 'running') {
      throw new Error('An experiment is already running');
    }

    const runId = ++this.#runId;
    const result = simulate(this.#state.parameters);
    this.#state = {
      ...this.#state,
      status: 'running',
      measurements: {
        ...result.frames[0],
        accelerationMps2: result.measurements.accelerationMps2,
        reachedBottom: false,
      },
    };
    this.#emit();

    const simulationDurationMs = result.measurements.reachedBottom
      ? Math.min(Math.max(result.measurements.timeS * 350, 600), 1800)
      : 500;

    await this.#playFrames(result.frames, simulationDurationMs, runId);

    if (runId !== this.#runId) {
      return this.getState();
    }

    this.#state = {
      ...this.#state,
      status: 'complete',
      measurements: result.measurements,
    };
    this.#emit();
    return this.getState();
  }

  #playFrames(frames, durationMs, runId) {
    return new Promise((resolve) => {
      const start = performance.now();

      const step = (now) => {
        if (runId !== this.#runId) {
          resolve();
          return;
        }

        const progress = Math.min((now - start) / durationMs, 1);
        const index = Math.min(
          Math.floor(progress * (frames.length - 1)),
          frames.length - 1,
        );
        this.#state = { ...this.#state, measurements: frames[index] };
        this.#emit();

        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      };

      requestAnimationFrame(step);
    });
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('change', { detail: this.getState() }));
  }
}
