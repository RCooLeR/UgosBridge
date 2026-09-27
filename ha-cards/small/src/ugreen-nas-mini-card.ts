import { LitElement, html, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { buildLiveDashboardModel, emptyMetricHistoryState, isFanSpeedEntity, type MetricHistoryState } from '../../detailed/src/live-model';
import { createEmptyDashboardModel } from '../../detailed/src/model';
import type { HassEntityLike } from '../../detailed/src/types';
import { styles } from './styles';
import { buildMiniDashboardModel, previewMiniModel } from './model';
import type { HomeAssistantLike, MetricTile, NasMiniDashboardModel, UgreenNasMiniCardConfig } from './types';

declare global {
  interface HTMLElementTagNameMap {
    'ugreen-nas-mini-card': UgreenNasMiniCard;
  }
}

@customElement('ugreen-nas-mini-card')
export class UgreenNasMiniCard extends LitElement {
  static styles = styles;

  @state()
  private config: UgreenNasMiniCardConfig = { type: 'custom:ugreen-nas-mini-card' };

  @state()
  private model: NasMiniDashboardModel = previewMiniModel();

  @state()
  private history: MetricHistoryState = emptyMetricHistoryState();

  @state()
  private dataMode: 'preview' | 'missing' | 'live' = 'preview';

  private _hass?: HomeAssistantLike;
  private watchEntityIds: string[] = [];
  private watchPrefixes: string[] = [];

  @property({ attribute: false })
  public set hass(value: HomeAssistantLike | undefined) {
    const previousValue = this._hass;
    if (!this.shouldRefreshForHassUpdate(previousValue, value)) {
      this._hass = value;
      return;
    }

    this._hass = value;
    this.requestUpdate('hass', previousValue);
    this.refreshModel();
  }

  public get hass(): HomeAssistantLike | undefined {
    return this._hass;
  }

  public setConfig(config: UgreenNasMiniCardConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration');
    }

    this.config = {
      title: 'UGREEN NAS',
      ...config
    };

    this.refreshModel();
  }

  public getCardSize(): number {
    return 2;
  }

  protected render() {
    return html`
      <ha-card>
        <div class="card-shell">
          <section class="metrics">
            ${this.renderIdentityTile()}
            ${this.model.metricTiles.map((tile) => this.renderMetricTile(tile))}
          </section>
        </div>
      </ha-card>
    `;
  }

  private renderIdentityTile() {
    return html`
      <article class="tile tile-identity">
        <div class="tile-body tile-body-identity">
          <div class="tile-top">
            ${this.renderIcon('device', 'icon icon-device accent')}
            <div class="tile-label">System</div>
          </div>
          <div class="tile-value tile-title">${this.model.title}</div>
          <div class="tile-status" style=${`color:${this.model.statusColor}`}>
            <span class="status-dot"></span>
            <span>${this.model.statusLabel}</span>
          </div>
        </div>
        ${this.renderProgress(
          this.model.statusLabel === 'Online' ? 1 : this.model.statusLabel === 'No Data' ? 0.45 : 0.7,
          this.model.statusColor
        )}
      </article>
    `;
  }

  private renderMetricTile(tile: MetricTile) {
    const secondaryClass = tile.id === 'cpu' || tile.id === 'gpu' || tile.id === 'systemLoad'
      ? 'tile-secondary success'
      : 'tile-secondary';

    return html`
      <article class="tile">
        <div class=${tile.fanSpeeds?.length ? 'tile-body tile-body-with-fans' : 'tile-body'}>
          <div class="tile-top">
            ${this.renderIcon(tile.icon, `icon icon-${tile.icon} accent`)}
            <div class="tile-label">${tile.label}</div>
          </div>

          ${tile.value ? html`<div class="tile-value">${tile.value}</div>` : nothing}
          ${tile.secondary ? html`<div class=${secondaryClass}>${tile.secondary}</div>` : nothing}

          ${typeof tile.progress === 'number' ? this.renderProgress(tile.progress, tile.accent) : nothing}
          ${tile.down || tile.up ? this.renderNetworkRows(tile.down, tile.up) : nothing}
          ${tile.fanSpeeds?.length ? html`
            <div class="fan-speeds">
              ${tile.fanSpeeds.map((fan) => html`
                <div class="fan-speed-row">
                  <span class="fan-label">${fan.label}</span>
                  <span class="fan-rpm">${Math.round(fan.rpm)} RPM</span>
                </div>
              `)}
            </div>
          ` : nothing}
        </div>
      </article>
    `;
  }

  private renderProgress(value: number, color: string) {
    const clamped = Math.max(0, Math.min(1, value));
    return html`
      <div class="progress-bar" aria-hidden="true">
        <div
          class="progress-fill"
          style=${`width:${clamped * 100}%; --progress-color:${color}; box-shadow:0 0 10px ${color}55;`}
        ></div>
      </div>
    `;
  }

  private renderNetworkRows(down?: string, up?: string) {
    return html`
      <div class="network-lines">
        ${down ? html`
          <div class="traffic-row down">
            ${this.renderArrowDown()}
            <span>${down}</span>
          </div>
        ` : nothing}
        ${up ? html`
          <div class="traffic-row up">
            ${this.renderArrowUp()}
            <span>${up}</span>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private refreshModel(): void {
    const liveModel = buildLiveDashboardModel(this._hass, this.config, this.history);
    if (!liveModel) {
      this.history = emptyMetricHistoryState();
      this.watchEntityIds = [];
      this.watchPrefixes = [];
      if (this._hass?.states) {
        const emptyModel = createEmptyDashboardModel();
        emptyModel.deviceInfo = {
          ...emptyModel.deviceInfo,
          model: this.config.deviceModel ?? emptyModel.deviceInfo.model,
          hostname: this.config.host ?? emptyModel.deviceInfo.hostname
        };
        this.model = buildMiniDashboardModel(emptyModel, 'missing', this.config);
        this.dataMode = 'missing';
      } else {
        this.model = previewMiniModel(this.config);
        this.dataMode = 'preview';
      }
      return;
    }

    this.history = liveModel.history;
    this.watchEntityIds = liveModel.watchEntityIds;
    this.watchPrefixes = liveModel.watchPrefixes;
    this.model = buildMiniDashboardModel(liveModel.model, 'live', this.config);
    this.dataMode = 'live';
  }

  private shouldRefreshForHassUpdate(
    previousHass: HomeAssistantLike | undefined,
    nextHass: HomeAssistantLike | undefined
  ): boolean {
    const previousStates = previousHass?.states;
    const nextStates = nextHass?.states;

    if (!previousStates || !nextStates) {
      return true;
    }

    if (this.watchEntityIds.length === 0 && this.watchPrefixes.length === 0) {
      return true;
    }

    if (this.countWatchedEntities(previousStates) !== this.countWatchedEntities(nextStates)) {
      return true;
    }

    return this.watchEntityIds.some((entityId) => previousStates[entityId] !== nextStates[entityId]);
  }

  private countWatchedEntities(states: Record<string, HassEntityLike>): number {
    let count = 0;
    for (const entityId of Object.keys(states)) {
      if (this.watchPrefixes.some((prefix) => entityId.startsWith(prefix)) || isFanSpeedEntity(entityId, states[entityId])) {
        count += 1;
      }
    }
    return count;
  }

  private renderArrowDown() {
    return svg`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 11.5 10 16l5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private renderArrowUp() {
    return svg`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 17V6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 8.5 10 4l5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private renderIcon(kind: string, className: string) {
    switch (kind) {
      case 'chip':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3M4 4l2 2M18 18l2 2M20 4l-2 2M4 20l2-2"></path></svg>`;
      case 'memory':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"></rect><path d="M7 10v4M11 10v4M15 10v4M19 10v4M5 19v2M9 19v2M13 19v2M17 19v2"></path></svg>`;
      case 'gpu':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="9" cy="11" r="2.2"></circle><path d="M16 9.5h2M16 12.5h2M8 18h8"></path></svg>`;
      case 'pulse':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.2-6 4 12 2.2-8H22"></path></svg>`;
      case 'database':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></svg>`;
      case 'network':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="3" width="4" height="4" rx="1"></rect><rect x="3" y="16" width="4" height="4" rx="1"></rect><rect x="17" y="16" width="4" height="4" rx="1"></rect><path d="M12 7v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path></svg>`;
      case 'device':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M9 2h6"></path></svg>`;
      case 'clock':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path></svg>`;
      case 'monitor':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 17v3"></path></svg>`;
      case 'calendar':
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 9h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01"></path></svg>`;
      default:
        return svg`<svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle></svg>`;
    }
  }
}
