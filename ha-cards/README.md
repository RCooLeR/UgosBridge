# Home Assistant Cards

Two optional Lovelace cards for the Home Assistant MQTT entities published by
`ugos-bridge`. Both read Home Assistant state; neither calls the bridge directly.

| Card | Purpose | Bundle |
| --- | --- | --- |
| [Detailed](detailed/README.md) | NAS dashboard with hardware, storage, network, containers and VMs | `detailed/dist/ugreen-nas-card.js` |
| [Mini](small/README.md) | Compact hardware, storage and network overview | `small/dist/ugreen-nas-mini-card.js` |

- [Installation and updates](docs/installation.md)
- [Configuration, entity compatibility and fan RPM](docs/configuration.md)
- [Bridge MQTT setup](../bridge/docs/home-assistant.md)

## Development

From the repository root, install both workspaces from the shared lockfile:

```sh
cd ha-cards
npm ci
npm run verify
```

`verify` runs TypeScript checks, tests, both bundle builds and the dependency audit.
CI uses Node.js 24 and checks that the committed bundles match a fresh build.
Keep source changes and regenerated bundles together. The per-card READMEs list
workspace commands for working on one card.
