# UGREEN NAS Detailed Card

`custom:ugreen-nas-card` displays hardware metrics, fan RPM, storage pools and
drives, network traffic, Docker projects and virtual machines. Select a hardware
metric, storage pool or project to inspect its details.

Follow the shared [installation guide](../docs/installation.md), then add:

```yaml
type: custom:ugreen-nas-card
title: UGREEN NAS
host: DXP6800 Pro
deviceModel: DXP6800 Pro
storageFilesystems:
  - /volume1
  - /volume2
networkInterfaces:
  - bond0
```

Use your bridge's host name and your NAS's filesystem and interface names. See
[configuration and data behavior](../docs/configuration.md) for all options,
preview behavior and legacy entity support.

## Development

After `npm ci` in `ha-cards/`, run these commands from that same directory:

```sh
npm run check --workspace ugreen-nas-card
npm test --workspace ugreen-nas-card
npm run build --workspace ugreen-nas-card
```

Output relative to `ha-cards/`: `detailed/dist/ugreen-nas-card.js`.
The component is in `src/ugreen-nas-card.ts`; `src/live-model.ts` maps entities for
both cards, with shared types, formatting, theme and fallback models alongside it.
Regression tests live in `tests/`.
