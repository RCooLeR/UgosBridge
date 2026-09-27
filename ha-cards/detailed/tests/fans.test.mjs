import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

let server;
let live;
before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, ws: false },
    appType: 'custom'
  });
  live = await server.ssrLoadModule('/src/live-model.ts');
});
after(async () => server?.close());

const host = 'DXP6800 Pro';
const prefix = 'sensor.ugos_bridge_host_dxp6800_pro_sensor_ugos_it86_';
const fanId = (name) => `${prefix}${name}_fan_speed_rpm`;
const entity = (state, attributes = {}) => ({ state: String(state), attributes });
const fan = (name, label, state, attributes = {}) => entity(state, {
  name,
  label,
  chip: 'it86',
  source: 'ugos',
  device_type: 'host',
  device_name: '',
  unit_of_measurement: 'rpm',
  ...attributes
});
const statesWith = (extra = {}) => ({
  'sensor.ugos_bridge_host_dxp6800_pro_cpu_usage_percent': entity(5, { host }),
  ...extra
});
const build = (states, history = live.emptyMetricHistoryState()) => {
  const result = live.buildLiveDashboardModel({ states }, { type: 'custom:ugreen-nas-card', host }, history);
  assert.ok(result);
  return result;
};
const summary = (result, kind) => result.model.hardwareSummary.find((card) => card.kind === kind);
const readings = (result, kind) => summary(result, kind)?.fanSpeeds?.map(({ label, rpm }) => ({ label, rpm }));

test('routes published UGOS CPU and system RPM separately and naturally sorts system fans', () => {
  const result = build(statesWith({
    [fanId('sysfan10')]: fan('sysfan10', 'System Fan 10', 2310),
    [fanId('sysfan2')]: fan('sysfan2', 'System Fan 2', 2295),
    [fanId('cpufan')]: fan('cpufan', 'CPU Fan', 3139.4),
    [fanId('sysfan1')]: fan('sysfan1', 'System Fan 1', 2295)
  }));
  assert.deepEqual(readings(result, 'cpu'), [{ label: 'CPU Fan', rpm: 3139.4 }]);
  assert.deepEqual(readings(result, 'system-load'), [
    { label: 'System Fan 1', rpm: 2295 },
    { label: 'System Fan 2', rpm: 2295 },
    { label: 'System Fan 10', rpm: 2310 }
  ]);
  assert.ok(result.model.hardwareDetails.find((card) => card.key === 'cpu')?.detailRows.some(
    (row) => row.label === 'CPU Fan' && row.value === '3139 RPM'
  ));
  assert.ok(result.watchEntityIds.includes(fanId('cpufan')));
});

test('supports HA device-derived names and preserved names using payload and friendly metadata', () => {
  const result = build(statesWith({
    'sensor.dxp6800_pro_health_it86_dxp6800_pro_cpu_fan_fan_speed': entity(3100, {
      friendly_name: 'DXP6800 Pro Health it86 DXP6800 Pro CPU Fan Fan Speed',
      unit_of_measurement: 'rpm'
    }),
    'sensor.dxp6800_pro_health_it86_dxp6800_pro_system_fan_1_fan_speed': entity(2295, {}),
    'sensor.dxp6800_pro_health_it86_dxp6800_pro_system_fan_2_fan_speed': entity(2280, {}),
    'sensor.renamed_chassis_rpm': fan('fan1', 'Chassis Fan 1', 2200, { host, source: 'hwmon' }),
    'sensor.old_cpu_fan_speed_rpm': fan('fan2', 'CPU Fan 2', 3000, {
      friendly_name: 'DXP6800 Pro CPU Fan 2 Fan Speed',
      source: 'hwmon'
    })
  }));
  assert.deepEqual(readings(result, 'cpu'), [
    { label: 'CPU Fan', rpm: 3100 },
    { label: 'CPU Fan 2', rpm: 3000 }
  ]);
  assert.deepEqual(readings(result, 'system-load'), [
    { label: 'Chassis Fan 1', rpm: 2200 },
    { label: 'System Fan 1', rpm: 2295 },
    { label: 'System Fan 2', rpm: 2280 }
  ]);
  assert.ok(result.watchEntityIds.includes('sensor.renamed_chassis_rpm'));
});

test('does not borrow fans from other hosts, disks, or unlabeled generic hwmon channels', () => {
  const result = build(statesWith({
    [fanId('cpufan')]: fan('cpufan', 'CPU Fan', 3139),
    [fanId('sysfan1')]: fan('sysfan1', 'System Fan 1', 7777, { host: 'Other NAS' }),
    'sensor.ugos_bridge_host_dxp2800_sensor_ugos_it86_cpufan_fan_speed_rpm': fan('cpufan', 'CPU Fan', 7777),
    'sensor.dxp6800_pro_backup_health_it86_system_fan_1_fan_speed': fan('sysfan1', 'System Fan 1', 7777),
    'sensor.renamed_other_host_rpm': fan('sysfan1', 'System Fan 1', 7777, {
      friendly_name: 'Other NAS Health it86 System Fan 1 Fan Speed'
    }),
    [fanId('diskfan')]: fan('sysfan1', 'System Fan 1', 7777, { device_type: 'disk' }),
    [fanId('fan1')]: fan('fan1', 'fan1', 7777, { source: 'hwmon' }),
    [fanId('no_host')]: fan('sysfan1', 'System Fan 1', 7777, { device_type: 'gpu' }),
    'sensor.unscoped_rpm': fan('sysfan1', 'System Fan 1', 7777)
  }));
  assert.deepEqual(readings(result, 'cpu'), [{ label: 'CPU Fan', rpm: 3139 }]);
  assert.equal(readings(result, 'system-load'), undefined);
  assert.ok(!result.watchEntityIds.includes('sensor.renamed_other_host_rpm'));
});

test('keeps real zero RPM but omits missing or invalid scalar states and stale attributes', () => {
  const result = build(statesWith({
    [fanId('cpufan')]: fan('cpufan', 'CPU Fan', 0, { fan_speed_rpm: 4000 }),
    [fanId('sysfan1')]: fan('sysfan1', 'System Fan 1', 'unavailable', { fan_speed_rpm: 2200 }),
    [fanId('sysfan2')]: fan('sysfan2', 'System Fan 2', 'unknown'),
    [fanId('sysfan3')]: fan('sysfan3', 'System Fan 3', ' '),
    [fanId('sysfan4')]: fan('sysfan4', 'System Fan 4', -1),
    [fanId('sysfan5')]: fan('sysfan5', 'System Fan 5', 'Infinity'),
    [fanId('sysfan6')]: fan('sysfan6', 'System Fan 6', 'NaN'),
    [fanId('sysfan7')]: fan('sysfan7', 'System Fan 7', 50, { unit_of_measurement: '%' }),
    [fanId('sysfan8')]: fan('sysfan8', 'System Fan 8', 2210, { fan_speed_rpm: 9000 })
  }));
  assert.deepEqual(readings(result, 'cpu'), [{ label: 'CPU Fan', rpm: 0 }]);
  assert.deepEqual(readings(result, 'system-load'), [{ label: 'System Fan 8', rpm: 2210 }]);
  assert.ok(result.model.hardwareDetails.find((card) => card.key === 'cpu')?.detailRows.some(
    (row) => row.label === 'CPU Fan' && row.value === '0 RPM'
  ));
});

test('omits fan decorations when no fan readings exist', () => {
  const result = build(statesWith());
  assert.equal(readings(result, 'cpu'), undefined);
  assert.equal(readings(result, 'system-load'), undefined);
  assert.ok(!result.model.hardwareDetails.find((card) => card.key === 'cpu')?.detailRows.some(
    (row) => row.label.includes('Fan')
  ));
});

test('refreshes fan-only changes, late arrivals, and recovery using the same HA states object', () => {
  const renamedId = 'sensor.renamed_cpu_rpm';
  const states = statesWith({ [renamedId]: fan('cpufan', 'CPU Fan', 'unavailable', { host }) });
  const initial = build(states);
  assert.equal(readings(initial, 'cpu'), undefined);
  assert.ok(initial.watchEntityIds.includes(renamedId));
  assert.equal(live.isFanSpeedEntity(renamedId, states[renamedId]), true);

  states[renamedId] = fan('cpufan', 'CPU Fan', 3200, { host });
  states[fanId('sysfan1')] = fan('sysfan1', 'System Fan 1', 2200);
  const recovered = build(states, initial.history);
  assert.deepEqual(readings(recovered, 'cpu'), [{ label: 'CPU Fan', rpm: 3200 }]);
  assert.deepEqual(readings(recovered, 'system-load'), [{ label: 'System Fan 1', rpm: 2200 }]);
  assert.ok(initial.watchPrefixes.some((prefix) => fanId('sysfan1').startsWith(prefix)));
  assert.ok(recovered.watchEntityIds.includes(fanId('sysfan1')));

  states[renamedId].state = '3300';
  const updated = build(states, recovered.history);
  assert.deepEqual(readings(updated, 'cpu'), [{ label: 'CPU Fan', rpm: 3300 }]);
  delete states[renamedId];
  assert.equal(readings(build(states, updated.history), 'cpu'), undefined);
});
