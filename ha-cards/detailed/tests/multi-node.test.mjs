import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

test('cards keep the global bridge by default and pick host-scoped nodes by host', async (context) => {
  const live = await loadLiveModel(context);

  for (const nasWorkloads of [globalWorkloadStates(), haNamedGlobalWorkloadStates()]) {
    const states = toStates([...nasHostStates(), ...nasWorkloads, ...cubieStates()]);

    // The Cubie outscores the NAS and sorts first; an unconfigured card stays on the NAS.
    for (const host of [undefined, 'DXP6800 Pro']) {
      const nas = build(live, states, host);
      assert.equal(nas.model.deviceInfo.hostname, 'DXP6800 Pro');
      assert.deepEqual(dockerSummary(nas), [
        { project: 'ugos_bridge', containers: [{ key: 'ugos_bridge', image: 'rcooler/ugos-bridge:1.0.7' }] }
      ]);
    }

    const cubie = build(live, states, 'cubie-a7a');
    assert.equal(cubie.model.deviceInfo.hostname, 'cubie-a7a');
    assert.deepEqual(dockerSummary(cubie), [
      {
        project: 'ugos_bridge',
        containers: [
          { key: 'homepage', image: 'homepage:latest' },
          { key: 'ugos_bridge', image: 'rcooler/ugos-bridge:1.1.0' }
        ]
      }
    ]);
    assert.ok(cubie.watchPrefixes.includes('sensor.ugos_bridge_host_cubie_a7a_'));
  }
});

test('host-scoped workload CPU entities are not host candidates', async (context) => {
  const live = await loadLiveModel(context);
  // Only a CPU entity for the NAS: a bogus "cubie_a7a_container_ugos_bridge"
  // candidate would tie with it and sort first.
  const states = toStates([nasHostStates()[0], ...cubieStates()]);

  assert.equal(build(live, states, undefined).model.deviceInfo.hostname, 'DXP6800 Pro');
});

test('host-scoped container names stay concise regardless of metric order or metadata', async (context) => {
  const live = await loadLiveModel(context);

  for (const canonicalName of [true, false]) {
    for (const memoryFirst of [true, false]) {
      const entities = cubieStates();
      const cpu = entities.find((entity) => entity.entity_id.endsWith('_container_ugos_bridge_cpu_usage_percent'));
      const memory = entities.find((entity) => entity.entity_id.endsWith('_container_ugos_bridge_memory_usage_bytes'));
      if (canonicalName) {
        // A metric's display label must never override the name from Docker metadata.
        memory.attributes.friendly_name = 'cubie-a7a Docker container UGOS-BRIDGE UGOS-BRIDGE Memory';
      } else {
        delete cpu.attributes.container;
        delete cpu.attributes.container_slug;
      }
      const states = toStates(memoryFirst ? [memory, ...entities.filter((entity) => entity !== memory)] : entities);
      const result = build(live, states, 'cubie-a7a');
      const containers = result.model.dockerProjects.find((project) => project.key === 'ugos_bridge').containers;
      assert.equal(containers.length, 2);
      const container = containers.find((item) => item.key === 'ugos_bridge');
      assert.equal(container.name, 'ugos-bridge');
      assert.equal(container.cpuPercent, 0.5);
      assert.equal(container.memoryBytes, 1024);
      assert.equal(container.running, true);
      assert.equal(container.image, 'rcooler/ugos-bridge:1.1.0');
    }
  }
});

async function loadLiveModel(context) {
  const server = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom'
  });
  context.after(() => server.close());
  return server.ssrLoadModule('/src/live-model.ts');
}

function build(live, states, host) {
  const result = live.buildLiveDashboardModel(
    { states },
    { type: 'custom:ugreen-nas-card', ...(host ? { host } : {}) },
    live.emptyMetricHistoryState()
  );
  assert.ok(result);
  return result;
}

function dockerSummary(result) {
  return result.model.dockerProjects.map((project) => ({
    project: project.key,
    containers: project.containers
      .map((container) => ({ key: container.key, image: container.image }))
      .sort((left, right) => left.key.localeCompare(right.key))
  }));
}

function nasHostStates() {
  return [
    state('sensor.ugos_bridge_host_dxp6800_pro_cpu_usage_percent', 6.5, {
      friendly_name: 'DXP6800 Pro DXP6800 Pro CPU',
      host: 'DXP6800 Pro',
      unit_of_measurement: '%'
    }),
    state('sensor.ugos_bridge_host_dxp6800_pro_filesystem_volume1_used_bytes', 400, {
      friendly_name: 'DXP6800 Pro Filesystem /volume1 DXP6800 Pro /volume1 Used',
      unit_of_measurement: 'B'
    })
  ];
}

// Global scope entity IDs from the bridge's object_id.
function globalWorkloadStates() {
  return [
    ...projectStates('sensor.ugos_bridge_project_ugos_bridge', 'Project ugos-bridge', {}),
    ...containerStates('ugos_bridge_container_ugos_bridge', 'Docker container ugos-bridge', 'rcooler/ugos-bridge:1.0.7', {})
  ];
}

// Global scope entity IDs that Home Assistant derived from device names.
function haNamedGlobalWorkloadStates() {
  return [
    state('sensor.project_ugos_bridge_ugos_bridge_cpu', 0.5, {
      friendly_name: 'Project ugos-bridge ugos-bridge CPU',
      project: 'ugos-bridge',
      project_slug: 'ugos_bridge',
      unit_of_measurement: '%'
    }),
    state('sensor.project_ugos_bridge_ugos_bridge_memory', 2048, {
      friendly_name: 'Project ugos-bridge ugos-bridge Memory',
      unit_of_measurement: 'B'
    }),
    state('sensor.project_ugos_bridge_ugos_bridge_running_containers', 1, { friendly_name: 'Project ugos-bridge ugos-bridge Running Containers' }),
    state('sensor.project_ugos_bridge_ugos_bridge_total_containers', 1, { friendly_name: 'Project ugos-bridge ugos-bridge Total Containers' }),
    state('sensor.docker_container_ugos_bridge_ugos_bridge_cpu', 0.5, {
      friendly_name: 'Docker container ugos-bridge ugos-bridge CPU',
      container: 'ugos-bridge',
      container_slug: 'ugos_bridge',
      project_slug: 'ugos_bridge',
      image: 'rcooler/ugos-bridge:1.0.7',
      status: 'Up 2 hours',
      unit_of_measurement: '%'
    }),
    state('sensor.docker_container_ugos_bridge_ugos_bridge_memory', 2048, {
      friendly_name: 'Docker container ugos-bridge ugos-bridge Memory',
      unit_of_measurement: 'B'
    }),
    state('sensor.docker_container_ugos_bridge_ugos_bridge_running', 1, { friendly_name: 'Docker container ugos-bridge ugos-bridge Running' })
  ];
}

// Host scope entity IDs from default_entity_id.
function cubieStates() {
  const host = { host: 'cubie-a7a' };
  return [
    state('sensor.ugos_bridge_host_cubie_a7a_cpu_usage_percent', 21, {
      friendly_name: 'cubie-a7a cubie-a7a CPU',
      host: 'cubie-a7a',
      identity_scope: 'host',
      unit_of_measurement: '%'
    }),
    ...projectStates('sensor.ugos_bridge_host_cubie_a7a_project_ugos_bridge', 'cubie-a7a Project ugos-bridge', host, 2),
    ...containerStates('ugos_bridge_host_cubie_a7a_container_ugos_bridge', 'cubie-a7a Docker container ugos-bridge', 'rcooler/ugos-bridge:1.1.0', host),
    ...containerStates('ugos_bridge_host_cubie_a7a_container_homepage', 'cubie-a7a Docker container homepage', 'homepage:latest', host, 'homepage')
  ];
}

function projectStates(prefix, deviceName, extraAttributes, containers = 1) {
  return [
    state(`${prefix}_cpu_usage_percent`, 0.5, {
      friendly_name: `${deviceName} ugos-bridge CPU`,
      project: 'ugos-bridge',
      project_slug: 'ugos_bridge',
      unit_of_measurement: '%',
      ...extraAttributes
    }),
    state(`${prefix}_memory_usage_bytes`, 2048, { friendly_name: `${deviceName} ugos-bridge Memory`, unit_of_measurement: 'B' }),
    state(`${prefix}_running_containers`, containers, { friendly_name: `${deviceName} ugos-bridge Running Containers` }),
    state(`${prefix}_total_containers`, containers, { friendly_name: `${deviceName} ugos-bridge Total Containers` })
  ];
}

function containerStates(objectBase, deviceName, image, extraAttributes, name = 'ugos-bridge') {
  return [
    state(`sensor.${objectBase}_cpu_usage_percent`, 0.5, {
      friendly_name: `${deviceName} ${name} CPU`,
      container: name,
      container_slug: name.replaceAll('-', '_'),
      project: 'ugos-bridge',
      project_slug: 'ugos_bridge',
      image,
      status: 'Up 2 hours',
      state: 'running',
      unit_of_measurement: '%',
      ...extraAttributes
    }),
    state(`sensor.${objectBase}_memory_usage_bytes`, 1024, { friendly_name: `${deviceName} ${name} Memory`, unit_of_measurement: 'B' }),
    state(`binary_sensor.${objectBase}_running`, 'on', { friendly_name: `${deviceName} ${name} Running` })
  ];
}

function toStates(entities) {
  return Object.fromEntries(entities.map((entity) => [entity.entity_id, entity]));
}

function state(entity_id, value, attributes = {}) {
  return {
    entity_id,
    state: String(value),
    attributes,
    last_changed: '2026-11-07T12:00:00+00:00',
    last_updated: '2026-11-07T12:00:00+00:00'
  };
}
