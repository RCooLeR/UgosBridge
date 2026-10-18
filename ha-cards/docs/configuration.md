# Card configuration and data behavior

Both cards accept the shared configuration below. Only `type` is required; use
`custom:ugreen-nas-card` for the [detailed card](../detailed/README.md) or
`custom:ugreen-nas-mini-card` for the [mini card](../small/README.md).

## Options

| Key | Type | Behavior |
| --- | --- | --- |
| `title` | string | Detailed-card heading; defaults to `UGREEN DXP6800 Pro`. The mini card uses `deviceModel` for its heading instead. |
| `host` | string | Preferred bridge host name or slug, such as `DXP6800 Pro` or `dxp6800_pro`. Otherwise the mapper chooses a discovered host. |
| `deviceModel` | string | Model label, including the mini-card heading. Defaults to `UGREEN NAS` in live mode. |
| `memoryTotalBytes` | number | Positive RAM-total override in bytes. Otherwise total RAM is inferred from used bytes and percentage, falling back to used bytes. |
| `storageFilesystems` | string[] | Preferred filesystem names or slugs for storage pools and totals, for example `[/volume1, /volume2]`. By default, non-root filesystems are preferred. |
| `networkInterfaces` | string[] | Preferred interface names, for example `[bond0]`. Defaults favor numbered `bond`/`eth` interfaces, falling back to other discovered interfaces except `lo`. |
| `ugosVersion` | string | Compatibility field stored in the model; not displayed by the current layouts. |
| `ipEntity` | string | Compatibility field selecting an entity's usable state for the model's IP value; not displayed by the current layouts. |
| `ipAddress` | string | Compatibility fallback when `ipEntity` has no usable state; not displayed by the current layouts. |
| `accentGlow` | boolean | Accepted for compatibility, but currently has no rendering effect. |

Selections are preferences, not strict filters: if a configured host, filesystem
list or interface list has no match, the mapper falls back to discovered data.
Check the displayed host and selections when several NAS devices are present.
These options affect the card only; they do not change what the bridge collects.

## Live, preview and missing data

- With matching Home Assistant entities, both cards build a live model. The mini
  card labels this `Online`; this is not an independent bridge health check.
- Before Home Assistant provides `hass.states`, both cards use sample preview data.
  The mini card labels it `Preview`.
- When `hass.states` exists but no host can be resolved, the detailed card uses an
  empty model and the mini card labels it `No Data`. Sample preview data is not
  used in this state. Some numeric tiles contain zero placeholders; those values
  are not measurements of the NAS.

Individual metrics can still be missing while the host is resolved. Missing GPU
utilization is omitted by the detailed card and shown as `N/A` by the mini card;
some other numeric fields fall back to zero. Check the source entities when a
reading is unexpected rather than treating the card as an availability monitor.

Charts use a short in-memory history of state updates, not Home Assistant Recorder
history. Reloading the card resets that history.

## Fan RPM

No additional option is needed for UGOS `cpufan` and `sysfan*` entities:

- CPU fans appear with CPU, including the detailed CPU view.
- System/chassis/case fans appear with **System Load** (**Load** in the mini card),
  one reading per fan.
- Fans are matched using host identity and sensor metadata, labels or entity names.
  Unlabelled generic hwmon channels are not guessed to be CPU or system fans.
- Unavailable, unknown, invalid and negative states are omitted. A real `0` remains
  visible as `0 RPM`; values are rounded to whole RPM for display.

The cards use the MQTT sensor's scalar state, not Prometheus or stale RPM values
in attributes. Missing fan telemetry does not hide the rest of the card.

## Entity compatibility

Both cards share the mapper in `detailed/src/live-model.ts`. It recognizes current
compact scalar entities and supported older project, container and VM namespaces,
including entity IDs retained by Home Assistant after discovery updates.
Container metadata comes from the entity providing it; explicit `project` metadata
takes precedence over project-name inference.

Keep the bridge's host name, MQTT client ID and topic prefix stable when updating
an existing installation. Do not rename entities merely to match an example in
these docs. For discovery settings and identity behavior, see
[Home Assistant MQTT integration](../../bridge/docs/home-assistant.md).
