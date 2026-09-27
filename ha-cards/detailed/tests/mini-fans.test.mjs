import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = fileURLToPath(new URL('../..', import.meta.url));

test('mini card places named fan readings with CPU and system load', async (context) => {
  const server = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true, ws: false },
    appType: 'custom'
  });
  context.after(() => server.close());

  const { buildMiniDashboardModel } = await server.ssrLoadModule('/small/src/model.ts');
  const { createEmptyDashboardModel } = await server.ssrLoadModule('/detailed/src/model.ts');
  const { UgreenNasMiniCard } = await server.ssrLoadModule('/small/src/ugreen-nas-mini-card.ts');
  const card = UgreenNasMiniCard.prototype;

  const dashboard = createEmptyDashboardModel();
  const cpu = dashboard.hardwareSummary.find((summary) => summary.kind === 'cpu');
  const load = dashboard.hardwareSummary.find((summary) => summary.kind === 'system-load');
  assert.ok(cpu);
  assert.ok(load);

  const baseline = buildMiniDashboardModel(dashboard, 'live');
  const tileFor = (model, id) => model.metricTiles.find((tile) => tile.id === id);
  cpu.fanSpeeds = [{ key: 'cpufan', label: 'CPU Fan', rpm: 3139 }];
  load.fanSpeeds = [
    { key: 'sysfan1', label: 'System Fan 1', rpm: 2295 },
    { key: 'sysfan2', label: 'System Fan 2', rpm: 0 },
    { key: 'sysfan10', label: 'System Fan 10', rpm: 2310 }
  ];
  const result = buildMiniDashboardModel(dashboard, 'live');

  await context.test('preserves CPU temperature, load status, progress and fan order', () => {
    for (const [id, fans] of [['cpu', cpu.fanSpeeds], ['systemLoad', load.fanSpeeds]]) {
      const tile = tileFor(result, id);
      assert.deepEqual(tile.fanSpeeds, fans);
      for (const field of ['value', 'secondary', 'progress']) {
        assert.equal(tile[field], tileFor(baseline, id)[field]);
      }
    }
    for (const tile of result.metricTiles.filter((tile) => !['cpu', 'systemLoad'].includes(tile.id))) {
      assert.equal(tile.fanSpeeds, undefined);
    }
  });

  await context.test('renders each named RPM, including a stopped fan at zero', () => {
    const cpuMarkup = flattenTemplate(card.renderMetricTile(tileFor(result, 'cpu')));
    assert.match(cpuMarkup, /CPU Fan/);
    assert.match(cpuMarkup, /3139 RPM/);
    assert.doesNotMatch(cpuMarkup, /System Fan/);

    const loadMarkup = flattenTemplate(card.renderMetricTile(tileFor(result, 'systemLoad')));
    assert.match(loadMarkup, /System Fan 1[\s\S]*2295 RPM/);
    assert.match(loadMarkup, /System Fan 2[\s\S]*0 RPM/);
    assert.ok(loadMarkup.indexOf('System Fan 1') < loadMarkup.indexOf('System Fan 2'));
    assert.ok(loadMarkup.indexOf('System Fan 2') < loadMarkup.indexOf('System Fan 10'));
    assert.doesNotMatch(loadMarkup, /CPU Fan/);
  });

  await context.test('adds no fan rows when no readings are available', () => {
    for (const id of ['cpu', 'systemLoad']) {
      const tile = tileFor(baseline, id);
      assert.equal(tile.fanSpeeds, undefined);
      assert.doesNotMatch(flattenTemplate(card.renderMetricTile(tile)), /fan-speeds|fan-speed-row/);
      assert.doesNotMatch(flattenTemplate(card.renderMetricTile({ ...tile, fanSpeeds: [] })), /fan-speeds|fan-speed-row/);
    }
  });

  await context.test('refreshes when a renamed fan entity arrives after the initial host metrics', () => {
    const cpuId = 'sensor.ugos_bridge_host_dxp6800_pro_cpu_usage_percent';
    const watcher = Object.assign(Object.create(card), {
      watchPrefixes: ['sensor.ugos_bridge_host_dxp6800_pro_'],
      watchEntityIds: [cpuId]
    });
    const states = { [cpuId]: { state: '10', attributes: {} } };
    const nextStates = {
      ...states,
      'sensor.renamed_cpu_fan': {
        state: '3139',
        attributes: { host: 'DXP6800 Pro', unit_of_measurement: 'rpm', sensor: 'cpufan', chip: 'it86' }
      }
    };
    assert.equal(watcher.shouldRefreshForHassUpdate({ states }, { states: nextStates }), true);
  });
});

function flattenTemplate(value) {
  if (Array.isArray(value)) {
    return value.map(flattenTemplate).join('');
  }
  if (value && Array.isArray(value.strings) && Array.isArray(value.values)) {
    return value.strings.reduce((text, part, index) => text + part + flattenTemplate(value.values[index]), '');
  }
  return value === undefined || value === null || typeof value === 'symbol' ? '' : String(value);
}
