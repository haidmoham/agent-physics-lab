import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  setSimulationParameter,
  simulate,
} from '../src/simulation.js';
import { ExperimentController } from '../src/experiment.js';

describe('simulation state', () => {
  it('creates a clean initial state', () => {
    const state = createInitialState();
    expect(state.status).toBe('ready');
    expect(state.measurements.distanceM).toBe(0);
    expect(state.measurements.velocityMps).toBe(0);
  });

  it('changes parameters and clears prior measurements', () => {
    const state = createInitialState();
    const changed = setSimulationParameter(state, 'massKg', 3.5);
    expect(changed.parameters.massKg).toBe(3.5);
    expect(changed.measurements.distanceM).toBe(0);
  });

  it('reset restores the initial apparatus state and keeps parameters', () => {
    const controller = new ExperimentController();
    controller.setParameter('massKg', 4);
    const reset = controller.reset();
    expect(reset.status).toBe('ready');
    expect(reset.parameters.massKg).toBe(4);
    expect(reset.measurements.distanceM).toBe(0);
  });
});

describe('deterministic incline model', () => {
  it('reproduces identical runs', () => {
    const parameters = createInitialState().parameters;
    expect(simulate(parameters)).toEqual(simulate(parameters));
  });

  it('does not move when friction exceeds tan(theta)', () => {
    const parameters = createInitialState({
      rampAngleDeg: 25,
      frictionCoefficient: 0.5,
    }).parameters;
    const result = simulate(parameters);
    expect(result.measurements.reachedBottom).toBe(false);
    expect(result.measurements.distanceM).toBe(0);
    expect(result.measurements.accelerationMps2).toBe(0);
  });

  it('reaches the bottom in the frictionless limit', () => {
    const parameters = createInitialState({ frictionCoefficient: 0 }).parameters;
    const result = simulate(parameters);
    expect(result.measurements.reachedBottom).toBe(true);
    expect(result.measurements.distanceM).toBe(parameters.rampLengthM);
  });

  it('produces the same result for different masses', () => {
    const light = simulate(createInitialState({ massKg: 0.5 }).parameters);
    const heavy = simulate(createInitialState({ massKg: 8 }).parameters);
    expect(light.measurements).toEqual(heavy.measurements);
  });
});
