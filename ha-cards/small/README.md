# UGREEN NAS Mini Card

`custom:ugreen-nas-mini-card` displays compact CPU, RAM, GPU, load, storage and
network tiles. CPU fan RPM appears under CPU; system/chassis fan RPM appears under
Load. It uses the same entity mapper as the detailed card.

Follow the shared [installation guide](../docs/installation.md), then add:

```yaml
type: custom:ugreen-nas-mini-card
host: DXP6800 Pro
deviceModel: DXP6800 Pro
storageFilesystems:
  - /volume1
  - /volume2
networkInterfaces:
  - bond0
```

Use your bridge's host name and your NAS's filesystem and interface names. See
[configuration and data behavior](../docs/configuration.md) for options and the
meaning of `Preview`, `No Data` and `Online`.

## Development

After `npm ci` in `ha-cards/`, run these commands from that same directory:

```sh
npm run check --workspace ugreen-nas-mini-card
npm run build --workspace ugreen-nas-mini-card
```

Output relative to `ha-cards/`: `small/dist/ugreen-nas-mini-card.js`.
The component and compact view model are in `src/`; shared entity mapping and its
tests live in `../detailed/`. Run `npm test` from `ha-cards/` for those tests.
