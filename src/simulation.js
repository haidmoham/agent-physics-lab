export const DEFAULT_PARAMETERS = Object.freeze({
  massKg: 1,
  rampAngleDeg: 25,
  frictionCoefficient: 0.2,
  rampLengthM: 4,
  gravityMps2: 9.81,
});

export const PARAMETER_LIMITS = Object.freeze({
  massKg: [0.1, 10],
  rampAngleDeg: [5, 60],
  frictionCoefficient: [0, 1.5],
});

export function createInitialState(overrides = {}) {
  const parameters = validateParameters({ ...DEFAULT_PARAMETERS, ...overrides });

  return {
    status: 'ready',
    parameters,
    measurements: emptyMeasurements(),
  };
}

export function setSimulationParameter(state, name, value) {
  if (!(name in PARAMETER_LIMITS)) {
    throw new Error(`Unknown parameter: ${name}`);
  }

  const parameters = validateParameters({
    ...state.parameters,
    [name]: Number(value),
  });

  return {
    status: 'ready',
    parameters,
    measurements: emptyMeasurements(),
  };
}

export function simulate(parameters, options = {}) {
  const validated = validateParameters(parameters);
  const timeStepS = options.timeStepS ?? 1 / 120;
  const maxTimeS = options.maxTimeS ?? Number.POSITIVE_INFINITY;
  const angleRad = (validated.rampAngleDeg * Math.PI) / 180;
  const gravityAlongRamp = validated.gravityMps2 * Math.sin(angleRad);
  const frictionAcceleration =
    validated.frictionCoefficient * validated.gravityMps2 * Math.cos(angleRad);
  const accelerationMps2 = Math.max(0, gravityAlongRamp - frictionAcceleration);
  const frames = [{ timeS: 0, distanceM: 0, velocityMps: 0 }];

  if (accelerationMps2 === 0) {
    return makeResult(validated, frames, accelerationMps2, false);
  }

  const bottomTimeS = Math.sqrt((2 * validated.rampLengthM) / accelerationMps2);
  const endTimeS = Math.min(bottomTimeS, maxTimeS);

  for (let timeS = timeStepS; timeS < endTimeS; timeS += timeStepS) {
    frames.push(frameAt(timeS, accelerationMps2, validated.rampLengthM));
  }

  const reachedBottom = bottomTimeS <= maxTimeS;
  frames.push(frameAt(endTimeS, accelerationMps2, validated.rampLengthM));
  if (reachedBottom) frames.at(-1).distanceM = validated.rampLengthM;

  return makeResult(validated, frames, accelerationMps2, reachedBottom);
}

function frameAt(timeS, accelerationMps2, rampLengthM) {
  return {
    timeS,
    distanceM: Math.min(0.5 * accelerationMps2 * timeS ** 2, rampLengthM),
    velocityMps: accelerationMps2 * timeS,
  };
}

function makeResult(parameters, frames, accelerationMps2, reachedBottom) {
  const finalFrame = frames.at(-1);
  return {
    parameters,
    frames,
    measurements: {
      timeS: finalFrame.timeS,
      distanceM: finalFrame.distanceM,
      velocityMps: finalFrame.velocityMps,
      accelerationMps2,
      reachedBottom,
    },
  };
}

function emptyMeasurements() {
  return {
    timeS: 0,
    distanceM: 0,
    velocityMps: 0,
    accelerationMps2: 0,
    reachedBottom: false,
  };
}

function validateParameters(parameters) {
  const validated = { ...parameters };

  for (const [name, [minimum, maximum]] of Object.entries(PARAMETER_LIMITS)) {
    const value = Number(validated[name]);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new RangeError(`${name} must be between ${minimum} and ${maximum}`);
    }
    validated[name] = value;
  }

  if (validated.rampLengthM <= 0 || validated.gravityMps2 <= 0) {
    throw new RangeError('Ramp length and gravity must be positive');
  }

  return validated;
}
