import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

test('builds Docker projects from compact scalar states with preserved HA entity ids', async (context) => {
  const server = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom'
  });
  context.after(() => server.close());

  const live = await server.ssrLoadModule('/src/live-model.ts');
  const states = Object.fromEntries([
    state('sensor.ugos_bridge_host_dxp6800_pro_cpu_usage_percent', 6.72, {
      friendly_name: 'DXP6800 Pro DXP6800 Pro CPU',
      host: 'DXP6800 Pro',
      unit_of_measurement: '%',
      top_processes: [
        {
          name: 'Search Serv',
          process_count: 2,
          cpu_usage_percent: 9.5,
          memory_usage_bytes: 4096,
          cpu_time_seconds: 120
        },
        {
          name: 'Docker',
          process_count: 6,
          cpu_usage_percent: 2.25,
          memory_usage_bytes: 8192,
          cpu_time_seconds: 80
        }
      ]
    }),
    ...projectStates('apps', 1.5, 2000, 1, 1),
    ...projectStates('db', 2.5, 3000, 1, 1),
    ...containerStates('go-back-db', 'apps', 0.5, 1200, true),
    ...containerStates('redis', 'db', 0.25, 800, true)
  ].map((entity) => [entity.entity_id, entity]));

  const result = live.buildLiveDashboardModel(
    { states },
    { type: 'custom:ugreen-nas-card', host: 'DXP6800 Pro' },
    live.emptyMetricHistoryState()
  );

  assert.ok(result);
  assert.equal(result.model.deviceInfo.hostname, 'DXP6800 Pro');
  assert.deepEqual(result.model.topProcesses, [
    {
      key: 'search_serv',
      name: 'Search Serv',
      processCount: 2,
      cpuPercent: 9.5,
      memoryBytes: 4096,
      cpuTimeSeconds: 120
    },
    {
      key: 'docker',
      name: 'Docker',
      processCount: 6,
      cpuPercent: 2.25,
      memoryBytes: 8192,
      cpuTimeSeconds: 80
    }
  ]);
  assert.deepEqual(result.model.dockerProjects.map((project) => project.key).sort(), ['apps', 'db']);

  const apps = result.model.dockerProjects.find((project) => project.key === 'apps');
  const db = result.model.dockerProjects.find((project) => project.key === 'db');
  assert.deepEqual(apps?.containers.map((container) => container.key), ['go_back_db']);
  assert.deepEqual(db?.containers.map((container) => container.key), ['redis']);
  assert.equal(apps?.containers[0]?.cpuPercent, 0.5);
  assert.equal(apps?.containers[0]?.memoryBytes, 1200);
  assert.equal(apps?.containers[0]?.running, true);
  assert.equal(apps?.containers[0]?.image, 'go-back-db:latest');
  assert.equal(apps?.containers[0]?.status, 'Up 1 hour');
});

function projectStates(project, cpu, memory, running, total) {
  const prefix = `sensor.project_${project}_${project}`;
  const friendly = `Project ${project} ${project}`;
  return [
    state(`${prefix}_cpu`, cpu, {
      friendly_name: `${friendly} CPU`,
      project,
      project_slug: project,
      unit_of_measurement: '%'
    }),
    state(`${prefix}_memory`, memory, {
      friendly_name: `${friendly} Memory`,
      unit_of_measurement: 'B'
    }),
    state(`${prefix}_running_containers`, running, { friendly_name: `${friendly} Running Containers` }),
    state(`${prefix}_total_containers`, total, { friendly_name: `${friendly} Total Containers` })
  ];
}

function containerStates(name, project, cpu, memory, running) {
  const slug = name.replaceAll('-', '_');
  const prefix = `sensor.docker_container_${slug}_${slug}`;
  const friendly = `Docker container ${name} ${name}`;
  return [
    state(`${prefix}_memory`, memory, {
      friendly_name: `${friendly} Memory`,
      unit_of_measurement: 'B'
    }),
    state(`${prefix}_running`, running ? 1 : 0, { friendly_name: `${friendly} Running` }),
    state(`${prefix}_cpu`, cpu, {
      friendly_name: `${friendly} CPU`,
      container: name,
      container_slug: slug,
      project_slug: project,
      image: `${name}:latest`,
      status: 'Up 1 hour',
      unit_of_measurement: '%'
    })
  ];
}

function state(entity_id, value, attributes = {}) {
  return {
    entity_id,
    state: String(value),
    attributes,
    last_changed: '2026-08-01T20:00:00+00:00',
    last_updated: '2026-08-01T20:00:00+00:00'
  };
}
