const PARAMETER_FIELDS = [
  {
    key: 'rampAngleDeg',
    label: 'Ramp angle',
    unit: '°',
    min: 5,
    max: 60,
    step: 1,
  },
  {
    key: 'frictionCoefficient',
    label: 'Friction coefficient',
    unit: 'μ',
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  {
    key: 'massKg',
    label: 'Ball mass',
    unit: 'kg',
    min: 0.1,
    max: 10,
    step: 0.1,
  },
];

export function mountUI(root, controller) {
  root.innerHTML = `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">WebMCP Challenge · experiment 01</p>
          <h1>Can an AI agent do physics experiments through a webpage?</h1>
          <p class="lede">A deterministic incline lab with one shared control surface for humans and agents.</p>
        </div>
        <div class="protocol-card">
          <span class="protocol-dot" aria-hidden="true"></span>
          <div>
            <strong id="webmcp-status">Checking WebMCP…</strong>
            <span>5 semantic experiment tools</span>
          </div>
        </div>
      </header>

      <section class="workspace">
        <div class="stage-card">
          <div class="stage-topline">
            <span>Live apparatus</span>
            <span class="status-pill" id="run-status">Ready</span>
          </div>
          <div class="stage" id="stage">
            <div class="grid" aria-hidden="true"></div>
            <div class="ramp" id="ramp">
              <div class="ramp-mark ramp-mark-start">0 m</div>
              <div class="ramp-mark ramp-mark-end">4 m</div>
              <div class="ball" id="ball" aria-label="Ball on ramp"></div>
            </div>
            <div class="ground"></div>
          </div>
          <p class="model-note">Sliding sphere model · Coulomb friction · rotational dynamics omitted</p>
        </div>

        <aside class="control-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Parameters</p>
              <h2>Experiment setup</h2>
            </div>
            <span>SI units</span>
          </div>
          <div id="parameter-controls" class="parameter-controls"></div>
          <div class="button-row">
            <button class="primary" id="run-button">Run experiment</button>
            <button class="secondary" id="reset-button">Reset</button>
          </div>
        </aside>
      </section>

      <section class="measurements" aria-live="polite">
        <article><span>Distance</span><strong id="distance">0.000 m</strong></article>
        <article><span>Velocity</span><strong id="velocity">0.000 m/s</strong></article>
        <article><span>Elapsed time</span><strong id="time">0.000 s</strong></article>
        <article><span>Reached bottom</span><strong id="reached">No</strong></article>
      </section>

      <footer>
        <span>Early experiment, not a scientific platform.</span>
        <span>Deterministic state · visible execution · inspectable tools</span>
      </footer>
    </main>
  `;

  const controls = new Map();
  const controlsRoot = root.querySelector('#parameter-controls');

  for (const field of PARAMETER_FIELDS) {
    const wrapper = document.createElement('label');
    wrapper.className = 'parameter';
    wrapper.innerHTML = `
      <span>${field.label}</span>
      <span class="parameter-value"><output></output> ${field.unit}</span>
      <input type="range" min="${field.min}" max="${field.max}" step="${field.step}" />
    `;
    const input = wrapper.querySelector('input');
    const output = wrapper.querySelector('output');
    input.addEventListener('input', () => {
      output.value = input.value;
      controller.setParameter(field.key, Number(input.value));
    });
    controls.set(field.key, { input, output });
    controlsRoot.append(wrapper);
  }

  root.querySelector('#run-button').addEventListener('click', () => controller.run());
  root.querySelector('#reset-button').addEventListener('click', () => controller.reset());
  controller.addEventListener('change', (event) => render(event.detail));

  function render(state) {
    for (const [key, control] of controls) {
      control.input.value = state.parameters[key];
      control.output.value = formatParameter(key, state.parameters[key]);
      control.input.disabled = state.status === 'running';
    }

    const fraction = state.measurements.distanceM / state.parameters.rampLengthM;
    root.querySelector('#stage').style.setProperty('--angle', `${state.parameters.rampAngleDeg}deg`);
    root.querySelector('#ball').style.setProperty('--progress', fraction);
    root.querySelector('#run-status').textContent = capitalize(state.status);
    root.querySelector('#run-button').disabled = state.status === 'running';
    root.querySelector('#distance').textContent = `${state.measurements.distanceM.toFixed(3)} m`;
    root.querySelector('#velocity').textContent = `${state.measurements.velocityMps.toFixed(3)} m/s`;
    root.querySelector('#time').textContent = `${state.measurements.timeS.toFixed(3)} s`;
    root.querySelector('#reached').textContent = state.measurements.reachedBottom ? 'Yes' : 'No';
  }

  render(controller.getState());

  return {
    setWebMCPStatus({ supported, registered }) {
      const element = root.querySelector('#webmcp-status');
      const card = element.closest('.protocol-card');
      element.textContent = supported
        ? `WebMCP ready · ${registered} tools`
        : 'WebMCP preview unavailable';
      card.classList.toggle('unsupported', !supported);
    },
  };
}

function formatParameter(key, value) {
  if (key === 'frictionCoefficient') return value.toFixed(2);
  if (key === 'massKg') return value.toFixed(1);
  return value.toFixed(0);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
