# Install the Home Assistant cards

First enable the bridge's [MQTT discovery](../../bridge/docs/home-assistant.md)
and confirm its entities appear in Home Assistant. The cards read these entities,
not Prometheus or the bridge's JSON endpoints.

## Install bundles

Download either or both JavaScript bundles from a
[release](https://github.com/RCooLeR/UgosBridge/releases), or build them using the
[workspace instructions](../README.md#development).

| Repository bundle | Home Assistant destination | Resource URL |
| --- | --- | --- |
| `ha-cards/detailed/dist/ugreen-nas-card.js` | `config/www/nas/ugreen-nas-card.js` | `/local/nas/ugreen-nas-card.js` |
| `ha-cards/small/dist/ugreen-nas-mini-card.js` | `config/www/nas/ugreen-nas-mini-card.js` | `/local/nas/ugreen-nas-mini-card.js` |

Here `config/` means your Home Assistant configuration directory. Create its
`www/nas/` directory if needed. Only the built JavaScript files are required;
do not copy sources or `node_modules` into Home Assistant.

Register each installed bundle as a dashboard resource of type **JavaScript
module**. For YAML-managed resources, use:

```yaml
resources:
  - url: /local/nas/ugreen-nas-card.js?v=1.0.7
    type: module
  - url: /local/nas/ugreen-nas-mini-card.js?v=1.0.7
    type: module
```

The version query is an example: use the version or content hash of your copied
bundle. Register each card bundle once. The detailed and mini cards have different
element names and can be installed together.

Add a card using the [detailed](../detailed/README.md) or
[mini](../small/README.md) YAML example. Both share the
[configuration reference](configuration.md).

## Update and troubleshoot

Replace the installed bundle, change the resource's version query, and reload the
dashboard. If the browser still uses the old card, perform a hard refresh.

- **Custom element does not exist:** check the resource URL, module type and copied
  filename. The `/local/nas/` URL must match the file under `config/www/nas/`.
- **No live data:** check Home Assistant's bridge entities and configured `host`;
  a working Prometheus endpoint alone does not supply card data.
- **Missing fan readings:** check the MQTT fan entities and their scalar states.
  See [fan RPM behavior](configuration.md#fan-rpm); no extra card option is needed.
