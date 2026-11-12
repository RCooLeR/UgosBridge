import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const host = 'NanoPi R76S';
const hostSlug = 'nanopi_r76s';

test('nested filesystem paths produce one storage pool across supported entity names', async (context) => {
  const live = await loadLiveModel(context);
  const prefixes = [
    `ugos_bridge_host_${hostSlug}_filesystem`,
    'ugos_bridge_filesystem',
    `${hostSlug}_filesystem`
  ];

  for (const prefix of prefixes) {
    for (const suffix of ['', '_2']) {
      const model = build(live, filesystemStates(`${prefix}_mnt_userdata`, suffix));
      assert.deepEqual(storageSummary(model), [{ name: '/mnt/userdata', usedBytes: 17, totalBytes: 57 }], `${prefix}${suffix}`);
    }
  }
});

test('HA-generated filesystem entity names use the full mount path', async (context) => {
  const live = await loadLiveModel(context);
  const prefix = `${hostSlug}_filesystem_mnt_userdata_${hostSlug}_mnt_userdata`;
  const friendly = `${host} Filesystem /mnt/userdata ${host} /mnt/userdata`;
  const model = build(live, [
    state(`sensor.${prefix}_used`, 17, { friendly_name: `${friendly} Used`, unit_of_measurement: 'B' }),
    state(`sensor.${prefix}_free`, 40, { friendly_name: `${friendly} Free`, unit_of_measurement: 'B' })
  ]);

  assert.deepEqual(storageSummary(model), [{ name: '/mnt/userdata', usedBytes: 17, totalBytes: 57 }]);
});

test('real parent and nested filesystems remain separate even with equal readings', async (context) => {
  const live = await loadLiveModel(context);
  const prefix = `ugos_bridge_host_${hostSlug}_filesystem`;
  const model = build(live, [...filesystemStates(`${prefix}_mnt`), ...filesystemStates(`${prefix}_mnt_userdata`)]);

  assert.deepEqual(storageSummary(model), [
    { name: '/mnt', usedBytes: 17, totalBytes: 57 },
    { name: '/mnt/userdata', usedBytes: 17, totalBytes: 57 }
  ]);
});

async function loadLiveModel(context) {
  const server = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  context.after(() => server.close());
  return server.ssrLoadModule('/src/live-model.ts');
}

function filesystemStates(prefix, suffix = '') {
  const path = `/${prefix.split('_filesystem_')[1].replaceAll('_', '/')}`;
  const friendly = `${host} Filesystem ${path} ${host} ${path}`;
  return [
    state(`sensor.${prefix}_used_bytes${suffix}`, 17, { friendly_name: `${friendly} Used`, unit_of_measurement: 'B' }),
    state(`sensor.${prefix}_free_bytes${suffix}`, 40, { friendly_name: `${friendly} Free`, unit_of_measurement: 'B' })
  ];
}

function build(live, filesystemEntities) {
  const entities = [
    state(`sensor.ugos_bridge_host_${hostSlug}_cpu_usage_percent`, 5, { host, identity_scope: 'host', unit_of_measurement: '%' }),
    ...filesystemEntities
  ];
  const states = Object.fromEntries(entities.map((entity) => [entity.entity_id, entity]));
  const result = live.buildLiveDashboardModel({ states }, { type: 'custom:ugreen-nas-card', host }, live.emptyMetricHistoryState());
  assert.ok(result);
  return result.model;
}

function storageSummary(model) {
  return model.storagePools.map(({ name, usedBytes, totalBytes }) => ({ name, usedBytes, totalBytes }));
}

function state(entity_id, value, attributes) {
  return { entity_id, state: String(value), attributes, last_updated: '2026-11-13T10:00:00+00:00' };
}
