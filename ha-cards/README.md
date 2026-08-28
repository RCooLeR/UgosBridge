# Home Assistant Cards

This repository now keeps both Home Assistant cards under `ha-cards/`.

## Packages

- `detailed/` - full NAS dashboard card
- `small/` - compact overview card

## Build

Install both workspaces from the shared lockfile and run the complete check, test,
and build pipeline:

```bash
cd ha-cards
npm ci
npm run verify
```

You can still target one card while working locally:

```bash
npm run check --workspace ugreen-nas-card
npm test --workspace ugreen-nas-card
npm run build --workspace ugreen-nas-card

npm run check --workspace ugreen-nas-mini-card
npm run build --workspace ugreen-nas-mini-card
```

## Production Bundles

- `ha-cards/detailed/dist/ugreen-nas-card.js`
- `ha-cards/small/dist/ugreen-nas-mini-card.js`

## Home Assistant Resources

Detailed card:

```yaml
url: /local/nas/ugreen-nas-card.js
type: module
```

Mini card:

```yaml
url: /local/nas/ugreen-nas-mini-card.js
type: module
```

## Entity Compatibility

Both cards consume the compact scalar MQTT entities published by `ugos-bridge`.
Home Assistant can preserve an entity's older `entity_id` after MQTT discovery
changes its `unique_id`, so the cards also resolve the legacy project, container,
and virtual-machine namespaces. Container metadata is taken from the scalar entity
that provides it and explicit `project` metadata always takes precedence over name
matching.
