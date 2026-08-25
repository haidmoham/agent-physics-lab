const WEBMCP_PARAMETER_NAMES = Object.freeze({
  mass_kg: 'massKg',
  ramp_angle_degrees: 'rampAngleDeg',
  friction_coefficient: 'frictionCoefficient',
});

export function createExperimentTools(controller) {
  return [
    {
      name: 'get_experiment_state',
      title: 'Get experiment state',
      description:
        'Read the current ramp parameters, run status, and latest measurements.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true },
      execute: async () => stringify(controller.getState()),
    },
    {
      name: 'set_parameter',
      title: 'Set experiment parameter',
      description:
        'Set one experimental parameter. Use this before each run when testing a hypothesis.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: Object.keys(WEBMCP_PARAMETER_NAMES),
            description: 'The parameter to change.',
          },
          value: {
            type: 'number',
            description: 'Value in the SI-derived unit named by the parameter.',
          },
        },
        required: ['name', 'value'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async ({ name, value }) => {
        const internalName = WEBMCP_PARAMETER_NAMES[name];
        if (!internalName) throw new Error(`Unknown parameter: ${name}`);
        return stringify(controller.setParameter(internalName, value));
      },
    },
    {
      name: 'run_experiment',
      title: 'Run experiment',
      description:
        'Run the current experiment visibly in the webpage and wait for measurements.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: false },
      execute: async () => stringify(await controller.run()),
    },
    {
      name: 'reset_experiment',
      title: 'Reset experiment',
      description:
        'Return the ball to the top while keeping the current parameter values.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: false },
      execute: async () => stringify(controller.reset()),
    },
    {
      name: 'get_measurements',
      title: 'Get measurements',
      description:
        'Read elapsed time, distance, velocity, acceleration, and whether the ball reached the bottom.',
      inputSchema: emptySchema(),
      annotations: { readOnlyHint: true },
      execute: async () => stringify(controller.getState().measurements),
    },
  ];
}

export async function registerWebMCPTools(controller) {
  const tools = createExperimentTools(controller);

  // The fallback makes the exact same tools inspectable in browsers where the
  // experimental WebMCP API is not enabled. It is not a second implementation.
  window.agentPhysicsLabTools = Object.fromEntries(
    tools.map((tool) => [tool.name, tool.execute]),
  );

  if (!document.modelContext?.registerTool) {
    return { supported: false, registered: 0 };
  }

  await Promise.all(tools.map((tool) => document.modelContext.registerTool(tool)));
  return { supported: true, registered: tools.length };
}

function emptySchema() {
  return { type: 'object', properties: {}, additionalProperties: false };
}

function stringify(value) {
  return JSON.stringify(value, null, 2);
}
