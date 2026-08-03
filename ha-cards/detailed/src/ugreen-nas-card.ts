import {
  mdiArrowDownThin,
  mdiArrowUpThin,
  mdiChip,
  mdiClockOutline,
  mdiDatabase,
  mdiEthernet,
  mdiHarddisk,
  mdiHomeOutline,
  mdiLan,
  mdiMemory,
  mdiNetworkStrength4,
  mdiServerNetwork,
  mdiSineWave,
  mdiVideo,
  mdiViewGridOutline
} from '@mdi/js';
import { html, LitElement, svg, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { buildLiveDashboardModel, emptyMetricHistoryState, type MetricHistoryState } from './live-model';
import { createEmptyDashboardModel, fakeDashboardModel } from './model';
import {
  clamp,
  formatBitsPerSecond,
  formatBytes,
  formatBytesPerSecond,
  formatPercent,
  formatProjectPercent,
  formatStorage,
  formatTemperature,
  formatUptime,
  formatUsageOfTotal,
  toPercent
} from './formatters';
import { fallbackProjectLogo, projectLogos, type ProjectLogo } from './project-logos';
import { cardStyles } from './styles';
import { THEME_COLORS } from './theme';
import type {
  CardConfig,
  DockerProject,
  DriveInfo,
  HardwareMetricCard,
  HardwareSummaryCard,
  HomeAssistantLike,
  NasDashboardModel,
  StoragePool,
  TotalStorageSummaryCard
} from './types';

const CUSTOM_CARD_TYPE = 'ugreen-nas-card';
type DetailMetricKey = HardwareMetricCard['key'] | 'system-load';
type DetailSelection =
  | { kind: 'default' }
  | { kind: 'pool'; key: string }
  | { kind: 'project'; key: string }
  | { kind: 'metric'; key: DetailMetricKey };

const svgIcon = (path: string, color = 'currentColor', viewBox = '0 0 24 24') => svg`
  <svg viewBox=${viewBox} width="1em" height="1em" aria-hidden="true" focusable="false">
    <path d=${path} fill=${color}></path>
  </svg>
`;

export class UgreenNasCard extends LitElement {
  public static styles = cardStyles;

  @state() private _config?: CardConfig;
  @state() private _model: NasDashboardModel = fakeDashboardModel;
  @state() private _history: MetricHistoryState = emptyMetricHistoryState();
  @state() private _dataMode: 'preview' | 'missing' | 'live' = 'preview';
  @state() private _detailSelection: DetailSelection = { kind: 'default' };

  private _hass?: HomeAssistantLike;
  private _watchEntityIds: string[] = [];
  private _watchPrefixes: string[] = [];

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

  public setConfig(config: CardConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration');
    }

    this._config = {
      title: 'UGREEN DXP6800 Pro',
      accentGlow: true,
      ...config
    };

    this.refreshModel();
  }

  public getCardSize(): number {
    return 12;
  }

  public getGridOptions(): { columns: number; min_rows: number; rows: number } {
    return { columns: 12, min_rows: 8, rows: 8 };
  }

  protected render(): TemplateResult {
    return html`
      <ha-card>
        <div class="shell">
          <section class="sidebar">
            ${this.renderDeviceInfo()} ${this.renderSummaryCards()} ${this.renderSidebarNetworkInterfaces()}
          </section>
          <div class="main-column">
            ${this.renderHardwareSection()} ${this.renderStorageSection()}
          </div>
          ${this.renderDockerProjects()}
        </div>
      </ha-card>
    `;
  }

  private renderDeviceInfo(): TemplateResult {
    const { deviceInfo } = this._model;
    const deviceTitle = this._config?.title ?? 'UGREEN DXP6800 Pro';
    const identityRows = this.buildDeviceIdentityRows(deviceTitle, deviceInfo.model, deviceInfo.hostname);

    return html`
      <div class="panel">
        <div class="device-head">
          <div class="device-title">${deviceTitle}</div>
          <div class="info-list">
            ${identityRows}
            ${this.renderInfoRow(mdiClockOutline, 'Uptime', formatUptime(deviceInfo.uptimeSeconds))}
            ${this.renderInfoRow(mdiClockOutline, 'Time', deviceInfo.lastUpdated)}
          </div>
        </div>
      </div>
    `;
  }

  private renderSummaryCards(): TemplateResult {
    const summaries = this._model.hardwareSummary.filter((summary) => summary.kind === 'system-load');
    if (summaries.length === 0) {
      return html``;
    }

    return html`
      <div class="sidebar-grid">
        ${summaries.map((summary) => this.renderSummaryCard(summary))}
      </div>
    `;
  }

  private renderSummaryCard(summary: HardwareSummaryCard): TemplateResult {
    const cardClass = summary.kind === 'total-storage' || summary.kind === 'network' ? 'mini-card full' : 'mini-card';

    switch (summary.kind) {
      case 'cpu':
      case 'gpu':
        return html`
          <div class=${cardClass}>
            <div class="mini-top">
              ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
              <span>${summary.title}</span>
            </div>
            <div class="mini-value">${formatPercent(summary.valuePercent)}</div>
            ${this.renderLineIndicator(summary.valuePercent, summary.accent)}
            <div class="mini-footer positive">${formatTemperature(summary.temperatureCelsius)}</div>
          </div>
        `;
      case 'ram':
        return html`
          <div class=${cardClass}>
            <div class="mini-top">
              ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
              <span>${summary.title}</span>
            </div>
            <div class="mini-value">${formatPercent(summary.valuePercent)}</div>
            ${this.renderLineIndicator(summary.valuePercent, summary.accent)}
            <div class="mini-footer">${formatUsageOfTotal(summary.usedBytes, summary.totalBytes)}</div>
          </div>
        `;
      case 'system-load':
        if (this._model.topProcesses.length > 0) {
          const isActive = this._detailSelection.kind === 'metric' && this._detailSelection.key === 'system-load';
          return html`
            <div
              class=${isActive ? `${cardClass} interactive active` : `${cardClass} interactive`}
              role="button"
              tabindex="0"
              @click=${() => this.toggleMetricDetail('system-load')}
              @keydown=${(event: KeyboardEvent) =>
                this.handleInteractiveCardKeydown(event, () => this.toggleMetricDetail('system-load'))}
            >
              <div class="mini-top">
                ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
                <span>${summary.title}</span>
              </div>
              <div class="mini-value">${summary.valueText}</div>
              ${this.renderLineIndicator(summary.valuePercent, summary.accent)}
              <div class="mini-footer positive">${summary.statusText}</div>
            </div>
          `;
        }
        return html`
          <div class=${cardClass}>
            <div class="mini-top">
              ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
              <span>${summary.title}</span>
            </div>
            <div class="mini-value">${summary.valueText}</div>
            ${this.renderLineIndicator(summary.valuePercent, summary.accent)}
            <div class="mini-footer positive">${summary.statusText}</div>
          </div>
        `;
      case 'total-storage':
        return html`
          <div class=${cardClass}>
            <div class="mini-top">
              ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
              <span>${summary.title}</span>
            </div>
            <div class="mini-value">${formatStorage(summary.totalBytes)}</div>
            ${this.renderStorageSummaryMeta(summary)}
          </div>
        `;
      case 'network': {
        const primaryInterface = this._model.networkInterfaces[0];
        return html`
          <div class=${cardClass}>
            <div class="mini-top">
              ${svgIcon(this.summaryIcon(summary.kind), summary.accent)}
              <span>${primaryInterface?.name ?? summary.title}</span>
            </div>
            <div class="mini-network-meta">
              <div class="mini-network-stat down">
                ${svgIcon(mdiArrowDownThin, THEME_COLORS.good)}
                <strong>${formatBitsPerSecond(primaryInterface?.downloadBps ?? summary.downloadBps)}</strong>
              </div>
              <div class="mini-network-stat up">
                ${svgIcon(mdiArrowUpThin, THEME_COLORS.purple)}
                <strong>${formatBitsPerSecond(primaryInterface?.uploadBps ?? summary.uploadBps)}</strong>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  private renderStorageSummaryMeta(summary: TotalStorageSummaryCard): TemplateResult {
    const usagePercent = toPercent(summary.usedBytes, summary.totalBytes);

    return html`
      <div class="mini-storage-meta">
        <div class="mini-footer">
          Used: ${formatStorage(summary.usedBytes)} (${formatPercent(usagePercent)})
        </div>
        <div class="mini-storage-bar">
          <span style=${`width:${usagePercent}%;`}></span>
        </div>
      </div>
    `;
  }

  private renderHardwareSection(): TemplateResult {
    return html`
      <section class="panel hardware">
        <div class="panel-title">${svgIcon(mdiChip, '#8fc1ff')} <span>Hardware</span></div>
        <div class="hardware-grid">
          ${this._model.hardwareDetails.map((metric) => this.renderHardwareCard(metric))}
        </div>
      </section>
    `;
  }

  private renderHardwareCard(metric: HardwareMetricCard): TemplateResult {
    const isActive = this._detailSelection.kind === 'metric' && this._detailSelection.key === metric.key;
    return html`
      <div
        class=${isActive ? 'hardware-card interactive active' : 'hardware-card interactive'}
        role="button"
        tabindex="0"
        @click=${() => this.toggleMetricDetail(metric.key)}
        @keydown=${(event: KeyboardEvent) =>
          this.handleInteractiveCardKeydown(event, () => this.toggleMetricDetail(metric.key))}
      >
        <div class="card-head">
          <div>
            <div class="metric-title" style=${`color:${metric.accent}`}>${metric.title}</div>
            <div class="metric-subtitle">${metric.subtitle}</div>
          </div>
          <div class="metric-value">${formatPercent(metric.utilizationPercent)}</div>
        </div>
        ${this.renderLineIndicator(metric.utilizationPercent, metric.accent)}
        <div class="detail-grid">
          ${metric.detailRows.map(
            (row) => html`<div class="detail-row"><span>${row.label}</span><strong>${row.value}</strong></div>`
          )}
        </div>
      </div>
    `;
  }

  private renderStorageSection(): TemplateResult {
    return html`
      <section class="storage">
        ${this.renderStoragePoolsSection()} ${this.renderDrivesSection()}
      </section>
    `;
  }

  private renderDrivesSection(): TemplateResult {
    const detailTitle = this.resolveDetailPanelTitle();

    return html`
      <div class="panel table-card">
        <div class="panel-title">
          ${svgIcon(detailTitle.icon, '#8fc1ff')}
          <span>${detailTitle.label}</span>
        </div>
        <div class="table-wrap">${this.renderDetailPanel()}</div>
      </div>
    `;
  }

  private renderDriveRow(drive: DriveInfo): TemplateResult {
    return html`
      <tr>
        <td>${drive.name}</td>
        <td>${formatStorage(drive.capacityBytes)}</td>
        <td>${formatBytesPerSecond((drive.readBytesPerSecond ?? 0) + (drive.writeBytesPerSecond ?? 0))}</td>
        <td>${drive.temperatureCelsius !== undefined ? formatTemperature(drive.temperatureCelsius) : 'N/A'}</td>
        <td>${this.renderHealthChip(drive.status)}</td>
      </tr>
    `;
  }

  private renderStoragePoolsSection(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-title">${svgIcon(mdiDatabase, '#8fc1ff')} <span>Storage Pools</span></div>
        <div class="pool-list">
          ${this._model.storagePools.length === 0
            ? html`<div class="storage-card empty-state">No live filesystem entities matched this host.</div>`
            : html`${this._model.storagePools.map((pool) => this.renderStoragePool(pool))}`}
        </div>
      </div>
    `;
  }

  private renderStoragePool(pool: StoragePool): TemplateResult {
    const usagePercent = toPercent(pool.usedBytes, pool.totalBytes);
    const statusClass = pool.status === 'healthy' ? 'health' : `health ${pool.status}`;
    const isActive = this._detailSelection.kind === 'pool' && this._detailSelection.key === (pool.key ?? pool.name);

    return html`
      <div
        class=${isActive ? 'storage-card interactive active' : 'storage-card interactive'}
        role="button"
        tabindex="0"
        @click=${() => this.togglePoolDetail(pool)}
        @keydown=${(event: KeyboardEvent) =>
          this.handleInteractiveCardKeydown(event, () => this.togglePoolDetail(pool))}
      >
        <div class="pool-head">
          <div>
            <div class="pool-title">${pool.name}</div>
            <div class="pool-subtitle">${pool.layout}</div>
          </div>
          <div class=${statusClass}><span class="dot"></span>${this.statusLabel(pool.status)}</div>
        </div>
        <div class="bar">
          <span
            style=${`width:${usagePercent}%; background: linear-gradient(90deg, ${pool.accent}, ${usagePercent > 60 ? THEME_COLORS.purple : THEME_COLORS.green});`}
          ></span>
        </div>
        <div class="pool-stats">
          <div>
            <span class="label">Drives</span>
            <strong class="pool-drives-value"
              ><span class="pool-drives-dot"></span>${this.renderDriveCountValue(pool.driveCountText)}</strong
            >
          </div>
          <div><span class="label">Total</span><strong>${formatStorage(pool.totalBytes)}</strong></div>
          <div><span class="label">Free</span><strong>${formatStorage(pool.totalBytes - pool.usedBytes)}</strong></div>
          <div><span class="label">Used</span><strong>${formatStorage(pool.usedBytes)}</strong></div>
          <div><span class="label">Usage</span><strong>${formatPercent(usagePercent)}</strong></div>
        </div>
      </div>
    `;
  }

  private renderDockerProjects(): TemplateResult {
    const memoryMax = Math.max(...this._model.dockerProjects.map((item) => item.memoryBytes), 0);

    return html`
      <section class="panel docker">
        <div class="panel-title">${svgIcon(mdiViewGridOutline, '#8fc1ff')} <span>Projects</span></div>
        <div class="docker-list">
          ${this._model.dockerProjects.length === 0
            ? html`<div class="empty-state">No live project entities were found.</div>`
            : this._model.dockerProjects.map((project) => this.renderDockerProject(project, memoryMax))}
        </div>
      </section>
    `;
  }

  private renderDockerProject(project: DockerProject, memoryMax: number): TemplateResult {
    const cpuBarWidth = clamp(project.cpuPercent * 14, 6, 100);
    const memoryBarWidth = clamp((project.memoryBytes / Math.max(memoryMax, 1)) * 100, 8, 100);
    const statusClass = `docker-status status ${project.status}`;
    const logo = this.resolveProjectLogo(project.key);
    const isActive = this._detailSelection.kind === 'project' && this._detailSelection.key === String(project.key);

    return html`
      <div
        class=${isActive ? 'docker-item interactive active' : 'docker-item interactive'}
        role="button"
        tabindex="0"
        @click=${() => this.toggleProjectDetail(project)}
        @keydown=${(event: KeyboardEvent) =>
          this.handleInteractiveCardKeydown(event, () => this.toggleProjectDetail(project))}
      >
        <div class="logo-chip" style=${`background:${logo.background ?? 'rgba(255, 255, 255, 0.04)'};`}>
          ${this.renderLogo(logo)}
        </div>
          <div>
            <div class="docker-name">${project.title}</div>
          <div class=${statusClass}>
            <span class="dot"></span>
            <span>${this.statusLabel(project.status)} ${project.runningContainers}/${project.totalContainers}</span>
          </div>
        </div>
        <div class="docker-metrics">
          <div class="metric-line">
            <span>CPU</span>
            <strong>${formatProjectPercent(project.cpuPercent)}</strong>
            <span class="metric-bar"><span style=${`width:${cpuBarWidth}%;`}></span></span>
          </div>
          <div class="metric-line">
            <span>RAM</span>
            <strong>${formatBytes(project.memoryBytes, 0)}</strong>
            <span class="metric-bar"><span style=${`width:${memoryBarWidth}%;`}></span></span>
          </div>
        </div>
      </div>
    `;
  }

  private renderDetailPanel(): TemplateResult {
    switch (this._detailSelection.kind) {
      case 'pool':
        return this.renderFilteredDrives();
      case 'project':
        return this.renderDockerProjectDetails();
      case 'metric':
        if (this._detailSelection.key === 'cpu') {
          return this.renderCpuCoreDetails();
        }
        if (this._detailSelection.key === 'ram') {
          return this.renderRamDetails();
        }
        if (this._detailSelection.key === 'gpu') {
          return this.renderGpuEngineDetails();
        }
        if (this._detailSelection.key === 'system-load') {
          return this.renderTopProcessesDetails();
        }
        return this.renderDefaultDrives();
      default:
        return this.renderDefaultDrives();
    }
  }

  private renderDefaultDrives(): TemplateResult {
    if (this._model.drives.length === 0) {
      return html`<div class="empty-state">No live disk entities matched this host.</div>`;
    }

    return this.renderDriveTable(this._model.drives);
  }

  private renderFilteredDrives(): TemplateResult {
    const activePool = this.activeStoragePool();
    if (!activePool) {
      return this.renderDefaultDrives();
    }

    const driveSlugs = new Set(activePool.driveSlugs ?? []);
    const drives = this._model.drives.filter((drive) => drive.diskSlug && driveSlugs.has(drive.diskSlug));
    if (drives.length === 0) {
      return html`<div class="empty-state">Drive membership is not available for this storage pool yet.</div>`;
    }

    return this.renderDriveTable(drives);
  }

  private renderDriveTable(drives: DriveInfo[]): TemplateResult {
    return html`<table>
      <thead>
        <tr>
          <th>Drive</th>
          <th>Capacity</th>
          <th>I/O</th>
          <th>Temp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${drives.map((drive) => this.renderDriveRow(drive))}
      </tbody>
    </table>`;
  }

  private renderDockerProjectDetails(): TemplateResult {
    const activeProject = this.activeDockerProject();
    if (!activeProject) {
      return this.renderDefaultDrives();
    }

    if (activeProject.containers.length === 0) {
      return activeProject.key === 'virtual_machines'
        ? html`<div class="empty-state">No live virtual machines were linked to this project.</div>`
        : html`<div class="empty-state">No live containers were linked to this project.</div>`;
    }

    return html`
      <div class="detail-card-stack">
        ${activeProject.containers.map((container) => {
          const logo = this.resolveProjectLogo(activeProject.key);
          const isVM = activeProject.key === 'virtual_machines';
          const vmAssignedMemoryBytes =
            container.memoryCurrentBytes !== undefined && container.memoryCurrentBytes > 0 ? container.memoryCurrentBytes : undefined;
          const memoryCapacityBytes = isVM ? vmAssignedMemoryBytes ?? container.memoryLimitBytes : container.memoryLimitBytes;
          const memoryBarWidth = clamp(
            ((container.memoryBytes ?? 0) / Math.max(memoryCapacityBytes ?? container.memoryBytes ?? 1, 1)) * 100,
            4,
            100
          );

          return html`
            <div class="detail-card">
              <div class="detail-card-head">
                <div class="detail-card-title">
                  <span class="detail-card-logo" style=${`background:${logo.background ?? 'rgba(255,255,255,0.04)'};`}>
                    ${this.renderLogo(logo)}
                  </span>
                  <div>
                    <div class="detail-name">${container.name}</div>
                    <div class="detail-subtitle">${isVM ? `Source: ${container.image}` : container.image}</div>
                  </div>
                </div>
                <span class=${container.running ? 'health' : 'health degraded'}>
                  <span class="dot"></span>${container.running ? 'Running' : container.state}
                </span>
              </div>
              <div class="detail-metric-grid container-metrics">
                <div class="detail-metric-card">
                  <span>CPU</span>
                  <strong>${formatProjectPercent(container.cpuPercent)}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>${isVM ? 'Used RAM' : 'RAM'}</span>
                  <strong>${formatBytes(container.memoryBytes, 0)}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>${isVM && vmAssignedMemoryBytes !== undefined ? 'Assigned RAM' : isVM ? 'Max RAM' : 'Limit'}</span>
                  <strong>${memoryCapacityBytes ? formatBytes(memoryCapacityBytes, 0) : 'N/A'}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>Status</span>
                  <strong>${container.status}</strong>
                </div>
              </div>
              <div class="detail-inline-bar">
                <span style=${`width:${memoryBarWidth}%;`}></span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderTopProcessesDetails(): TemplateResult {
    if (this._model.topProcesses.length === 0) {
      return html`<div class="empty-state">Top process data is not available from current Home Assistant entities.</div>`;
    }

    return html`
      <div class="detail-card-stack">
        ${this._model.topProcesses.map(
          (process) => html`
            <div class="detail-card">
              <div class="detail-card-head">
                <div class="detail-card-title">
                  <div>
                    <div class="detail-name">${process.name}</div>
                    <div class="detail-subtitle">${this.formatProcessCount(process.processCount)}</div>
                  </div>
                </div>
                <span class="health"><span class="dot"></span>${formatProjectPercent(process.cpuPercent)} CPU</span>
              </div>
              <div class="detail-metric-grid">
                <div class="detail-metric-card">
                  <span>CPU</span>
                  <strong>${formatProjectPercent(process.cpuPercent)}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>RAM</span>
                  <strong>${formatBytes(process.memoryBytes, 0)}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>CPU Time</span>
                  <strong>${process.cpuTimeSeconds !== undefined ? formatUptime(process.cpuTimeSeconds) : 'N/A'}</strong>
                </div>
                <div class="detail-metric-card">
                  <span>Count</span>
                  <strong>${process.processCount}</strong>
                </div>
              </div>
              <div class="detail-inline-bar">
                <span style=${`width:${clamp(process.cpuPercent, 0, 100)}%;`}></span>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private renderCpuCoreDetails(): TemplateResult {
    if (this._model.cpuCores.length === 0) {
      return html`<div class="empty-state">Per-core CPU data is not available from current Home Assistant entities.</div>`;
    }

    return html`
      <div class="detail-grid-cards">
        ${this._model.cpuCores.map(
          (core) => html`
            <div class="detail-stat-card">
              <div class="detail-name">${core.name}</div>
              <div class="detail-stat-value">${formatPercent(core.usagePercent)}</div>
              <div class="detail-inline-bar"><span style=${`width:${clamp(core.usagePercent, 0, 100)}%;`}></span></div>
              <div class="detail-meta-list">
                <div><span>Current</span><strong>${core.currentMHz ? `${Math.round(core.currentMHz)} MHz` : 'N/A'}</strong></div>
                <div><span>Range</span><strong>${this.formatCpuCoreRange(core.minMHz, core.maxMHz)}</strong></div>
                <div><span>Governor</span><strong>${core.governor ?? 'N/A'}</strong></div>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private renderRamDetails(): TemplateResult {
    if (this._model.ramBreakdown.length === 0) {
      return html`<div class="empty-state">RAM breakdown data is not available from current Home Assistant entities.</div>`;
    }

    return html`
      <div class="detail-grid-cards">
        ${this._model.ramBreakdown.map(
          (item) => html`
            <div class="detail-stat-card">
              <div class="detail-name">${item.label}</div>
              <div class="detail-stat-value">${formatBytes(item.valueBytes, 1)}</div>
              ${item.totalBytes
                ? html`
                    <div class="detail-inline-bar">
                      <span style=${`width:${clamp(toPercent(item.valueBytes, item.totalBytes), 0, 100)}%;`}></span>
                    </div>
                    <div class="detail-meta-list">
                      <div><span>Usage</span><strong>${formatPercent(toPercent(item.valueBytes, item.totalBytes))}</strong></div>
                      <div><span>Total</span><strong>${formatBytes(item.totalBytes, 1)}</strong></div>
                    </div>
                  `
                : html`
                    <div class="detail-meta-list">
                      <div><span>Value</span><strong>${formatBytes(item.valueBytes, 1)}</strong></div>
                    </div>
                  `}
            </div>
          `
        )}
      </div>
    `;
  }

  private renderGpuEngineDetails(): TemplateResult {
    if (this._model.gpuEngines.length === 0 && this._model.gpuStats.length === 0) {
      return html`<div class="empty-state">GPU detail metrics are not available from current Home Assistant entities.</div>`;
    }

    return html`
      <div class="detail-card-stack">
        ${this._model.gpuStats.length > 0
          ? html`
              <div class="detail-card">
                <div class="detail-name">GPU Stats</div>
                <div class="detail-metric-grid">
                  ${this._model.gpuStats.map(
                    (stat) => html`
                      <div class="detail-metric-card">
                        <span>${stat.label}</span>
                        <strong>${this.formatGpuStatValue(stat.value, stat.unit)}</strong>
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          : html``}
        ${this._model.gpuEngines.length > 0
          ? html`
              <div class="detail-grid-cards">
                ${this._model.gpuEngines.map(
                  (engine) => html`
                    <div class="detail-stat-card">
                      <div class="detail-name">${engine.label}</div>
                      <div class="detail-stat-value">${formatPercent(engine.busyPercent)}</div>
                      <div class="detail-inline-bar"><span style=${`width:${clamp(engine.busyPercent, 0, 100)}%;`}></span></div>
                      <div class="detail-meta-list">
                        <div><span>Busy</span><strong>${formatPercent(engine.busyPercent)}</strong></div>
                        <div><span>Sema</span><strong>${engine.semaPercent !== undefined ? formatPercent(engine.semaPercent) : 'N/A'}</strong></div>
                        <div><span>Wait</span><strong>${engine.waitPercent !== undefined ? formatPercent(engine.waitPercent) : 'N/A'}</strong></div>
                      </div>
                    </div>
                  `
                )}
              </div>
            `
          : html``}
      </div>
    `;
  }

  private renderSidebarNetworkInterfaces(): TemplateResult {
    return html`
      <section class="panel">
        <div class="panel-title">${svgIcon(mdiLan, '#8fc1ff')} <span>Network Interfaces</span></div>
        <div class="network-panel-body network-panel-scroll">
          ${this._model.networkInterfaces.length === 0
            ? html`<div class="empty-state">No live network interface entities were found.</div>`
            : this._model.networkInterfaces.map(
                (iface) => this.renderInterfaceCard(iface)
              )}
        </div>
      </section>
    `;
  }

  private renderInterfaceIdentity(name: string): TemplateResult {
    return html`
      <span class="health"><span class="dot"></span>${name}</span>
    `;
  }

  private renderInterfaceCard(iface: NasDashboardModel['networkInterfaces'][number]): TemplateResult {
    return html`
      <div class="iface-card">
        <div class="iface-main">
          <div class="iface-meta-block">
            <div class="iface-heading">
              <div class="iface-name">${this.renderInterfaceIdentity(iface.name)}</div>
              <strong class=${`iface-status ${iface.status}`}>${this.statusLabel(iface.status)}</strong>
            </div>
          </div>
          ${this.renderInterfaceStat('Link', this.formatLinkSpeed(iface.linkSpeedMbps))}
          ${this.renderInterfaceStat(
            'Temp',
            iface.temperatureCelsius !== undefined ? formatTemperature(iface.temperatureCelsius) : 'N/A'
          )}
          ${this.renderInterfaceStat('RX', formatBitsPerSecond(iface.downloadBps), 'down')}
          ${this.renderInterfaceStat('TX', formatBitsPerSecond(iface.uploadBps), 'up')}
        </div>
      </div>
    `;
  }

  private renderInterfaceStat(label: string, value: string, tone?: 'down' | 'up'): TemplateResult {
    return html`
      <div class=${tone ? `iface-stat ${tone}` : 'iface-stat'}>
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  private formatLinkSpeed(linkSpeedMbps: number | undefined): string {
    return linkSpeedMbps !== undefined ? formatBitsPerSecond(linkSpeedMbps * 1_000_000, 1) : 'N/A';
  }

  private renderLineIndicator(percent: number, accent: string): TemplateResult {
    const width = clamp(percent, 0, 100);
    return html`
      <div class="metric-indicator" aria-hidden="true">
        <span style=${`width:${width}%; background:${accent}; box-shadow:0 0 14px ${accent}55;`}></span>
      </div>
    `;
  }

  private renderLogo(logo: ProjectLogo): TemplateResult {
    if (logo.kind === 'image') {
      if (logo.src) {
        return html`<img src=${logo.src} alt=${logo.alt} />`;
      }

      return logo.fallback ? this.renderLogo(logo.fallback) : this.renderLogo(fallbackProjectLogo);
    }

    if (logo.kind === 'inline-svg') {
      return html`${unsafeSVG(logo.svg)}`;
    }

    return svgIcon(logo.path, logo.color, logo.viewBox);
  }

  private renderHealthChip(status: DriveInfo['status'] | StoragePool['status']): TemplateResult {
    const statusClass = status === 'healthy' ? 'health' : `health ${status}`;
    return html`<span class=${statusClass}><span class="dot"></span>${this.statusLabel(status)}</span>`;
  }

  private renderInfoRow(icon: string, label: string, value: string): TemplateResult {
    return html`<div class="info-row">${svgIcon(icon, '#8fb9ff')} <span>${label}</span> <strong>${value}</strong></div>`;
  }

  private buildDeviceIdentityRows(title: string, model: string, hostname: string): TemplateResult[] {
    const seen = new Set<string>([this.normalizeHeaderValue(title)]);
    const rows: TemplateResult[] = [];

    const pushRow = (icon: string, label: string, value: string): void => {
      const normalizedValue = this.normalizeHeaderValue(value);
      if (!normalizedValue || seen.has(normalizedValue)) {
        return;
      }

      seen.add(normalizedValue);
      rows.push(this.renderInfoRow(icon, label, value));
    };

    pushRow(mdiHomeOutline, 'Model', model);
    pushRow(mdiServerNetwork, 'Hostname', hostname);

    return rows;
  }

  private normalizeHeaderValue(value: string | undefined): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  private renderDriveCountValue(value: string | undefined): string {
    if (!value) {
      return 'N/A';
    }

    return value.replace(/^Drives\s+/i, '');
  }

  private resolveDetailPanelTitle(): { label: string; icon: string } {
    if (this._detailSelection.kind === 'pool') {
      const pool = this.activeStoragePool();
      return { label: pool ? `${pool.name} Drives` : 'Drives', icon: mdiHarddisk };
    }
    if (this._detailSelection.kind === 'project') {
      const project = this.activeDockerProject();
      if (project?.key === 'virtual_machines') {
        return { label: 'Virtual machines', icon: mdiViewGridOutline };
      }
      return { label: project ? `${project.title} Containers` : 'Project', icon: mdiViewGridOutline };
    }
    if (this._detailSelection.kind === 'metric') {
      switch (this._detailSelection.key) {
        case 'cpu':
          return { label: 'CPU Cores', icon: mdiChip };
        case 'ram':
          return { label: 'RAM Breakdown', icon: mdiMemory };
        case 'gpu':
          return { label: 'GPU Details', icon: mdiVideo };
        case 'system-load':
          return { label: 'Top Processes', icon: mdiSineWave };
        default:
          break;
      }
    }
    return { label: 'Drives', icon: mdiHarddisk };
  }

  private togglePoolDetail(pool: StoragePool): void {
    const key = pool.key ?? pool.name;
    this.applyDetailSelection(
      this._detailSelection.kind === 'pool' && this._detailSelection.key === key ? { kind: 'default' } : { kind: 'pool', key }
    );
  }

  private toggleProjectDetail(project: DockerProject): void {
    const key = String(project.key);
    this.applyDetailSelection(
      this._detailSelection.kind === 'project' && this._detailSelection.key === key
        ? { kind: 'default' }
        : { kind: 'project', key }
    );
  }

  private toggleMetricDetail(metricKey: DetailMetricKey): void {
    if (metricKey !== 'cpu' && metricKey !== 'ram' && metricKey !== 'gpu' && metricKey !== 'system-load') {
      return;
    }

    this.applyDetailSelection(
      this._detailSelection.kind === 'metric' && this._detailSelection.key === metricKey
        ? { kind: 'default' }
        : { kind: 'metric', key: metricKey }
    );
  }

  private handleInteractiveCardKeydown(event: KeyboardEvent, action: () => void): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    action();
  }

  private applyDetailSelection(selection: DetailSelection): void {
    this._detailSelection = selection;
    void this.updateComplete.then(() => {
      this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private activeStoragePool(): StoragePool | undefined {
    if (this._detailSelection.kind !== 'pool') {
      return undefined;
    }

    const selectionKey = this._detailSelection.key;
    return this._model.storagePools.find((pool) => (pool.key ?? pool.name) === selectionKey);
  }

  private activeDockerProject(): DockerProject | undefined {
    if (this._detailSelection.kind !== 'project') {
      return undefined;
    }

    const selectionKey = this._detailSelection.key;
    return this._model.dockerProjects.find((project) => String(project.key) === selectionKey);
  }

  private formatCpuCoreRange(minMHz: number | undefined, maxMHz: number | undefined): string {
    if (minMHz === undefined && maxMHz === undefined) {
      return 'N/A';
    }
    if (minMHz === undefined) {
      return `<= ${Math.round(maxMHz ?? 0)} MHz`;
    }
    if (maxMHz === undefined) {
      return `${Math.round(minMHz)}+ MHz`;
    }
    return `${Math.round(minMHz)}-${Math.round(maxMHz)} MHz`;
  }

  private formatGpuStatValue(value: number, unit: string | undefined): string {
    if (unit === '%') {
      return formatPercent(value);
    }
    if (unit === 'W') {
      return `${value.toFixed(value >= 10 ? 1 : 2)} W`;
    }
    if (unit === 'MHz') {
      return `${Math.round(value)} MHz`;
    }
    if (unit === 'ms') {
      return `${value.toFixed(2)} ms`;
    }
    if (unit === 'MiB/s') {
      return `${value.toFixed(value >= 10 ? 1 : 2)} MiB/s`;
    }
    if (unit === '/s') {
      return `${value.toFixed(value >= 10 ? 0 : 2)}/s`;
    }
    return `${value}${unit ? ` ${unit}` : ''}`;
  }

  private formatProcessCount(count: number): string {
    return `${count} ${count === 1 ? 'process' : 'processes'}`;
  }

  private resolveProjectLogo(projectKey: DockerProject['key']): ProjectLogo {
    const rawKey = String(projectKey).trim().toLowerCase();
    const normalizedKey = rawKey.replace(/[\s_-]+/g, '-').replace(/-+/g, '-');
    const candidates = Array.from(
      new Set([
        rawKey,
        rawKey.replace(/\s+/g, '-'),
        rawKey.replace(/\s+/g, '_'),
        rawKey.replace(/-/g, '_'),
        rawKey.replace(/_/g, '-'),
        normalizedKey,
        normalizedKey.replace(/-/g, '_')
      ])
    );

    for (const candidate of candidates) {
      const logo = projectLogos[candidate];
      if (logo) {
        return logo;
      }
    }

    const aliases: Array<[string, string]> = [
      ['grafana', 'grafana'],
      ['jellyfin', 'jellyfin'],
      ['uptime-kuma', 'uptime-kuma'],
      ['uptime_kuma', 'uptime_kuma'],
      ['kuma', 'kuma'],
      ['home-assistant', 'home-assistant'],
      ['home_assistant', 'home_assistant'],
      ['gitea', 'gitea'],
      ['qbittorrent', 'torrent'],
      ['torrent', 'torrent'],
      ['nginx', 'webserver'],
      ['mysql', 'go_back_db'],
      ['gorent', 'gorent'],
      ['nas', 'nas']
    ];

    for (const [needle, logoKey] of aliases) {
      if (candidates.some((candidate) => candidate.includes(needle))) {
        return projectLogos[logoKey] ?? fallbackProjectLogo;
      }
    }

    return fallbackProjectLogo;
  }

  private summaryIcon(kind: HardwareSummaryCard['kind']): string {
    switch (kind) {
      case 'cpu':
        return mdiChip;
      case 'ram':
        return mdiMemory;
      case 'gpu':
        return mdiVideo;
      case 'system-load':
        return mdiSineWave;
      case 'total-storage':
        return mdiDatabase;
      case 'network':
        return mdiNetworkStrength4;
      default:
        return mdiEthernet;
    }
  }

  private statusLabel(status: string): string {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'degraded':
        return 'Degraded';
      case 'up':
        return 'Up';
      case 'partial':
        return 'Partial';
      case 'down':
        return 'Down';
      default:
        return status;
    }
  }

  private refreshModel(): void {
    const liveModel = buildLiveDashboardModel(this._hass, this._config, this._history);
    if (!liveModel) {
      if (this._hass?.states) {
        const emptyModel = createEmptyDashboardModel();
        emptyModel.deviceInfo = {
          ...emptyModel.deviceInfo,
          model: this._config?.deviceModel ?? emptyModel.deviceInfo.model,
          ugosVersion: this._config?.ugosVersion ?? emptyModel.deviceInfo.ugosVersion,
          ipAddress: this._config?.ipAddress ?? emptyModel.deviceInfo.ipAddress
        };
        this._model = emptyModel;
        this._dataMode = 'missing';
      } else {
        this._model = fakeDashboardModel;
        this._dataMode = 'preview';
      }
      this._detailSelection = { kind: 'default' };
      this._history = emptyMetricHistoryState();
      this._watchEntityIds = [];
      this._watchPrefixes = [];
      return;
    }

    this._history = liveModel.history;
    this._watchEntityIds = liveModel.watchEntityIds;
    this._watchPrefixes = liveModel.watchPrefixes;
    this._model = liveModel.model;
    this._detailSelection = this.isDetailSelectionAvailable(this._detailSelection) ? this._detailSelection : { kind: 'default' };
    this._dataMode = 'live';
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

    if (this._watchEntityIds.length === 0 && this._watchPrefixes.length === 0) {
      return true;
    }

    if (this.countWatchedEntities(previousStates) !== this.countWatchedEntities(nextStates)) {
      return true;
    }

    return this._watchEntityIds.some((entityId) => previousStates[entityId] !== nextStates[entityId]);
  }

  private countWatchedEntities(states: Record<string, unknown>): number {
    let count = 0;
    for (const entityId of Object.keys(states)) {
      if (this._watchPrefixes.some((prefix) => entityId.startsWith(prefix))) {
        count += 1;
      }
    }
    return count;
  }

  private isDetailSelectionAvailable(selection: DetailSelection): boolean {
    switch (selection.kind) {
      case 'pool':
        return this._model.storagePools.some((pool) => (pool.key ?? pool.name) === selection.key);
      case 'project':
        return this._model.dockerProjects.some((project) => String(project.key) === selection.key);
      case 'metric':
        if (selection.key === 'cpu') {
          return this._model.cpuCores.length > 0;
        }
        if (selection.key === 'ram') {
          return this._model.ramBreakdown.length > 0;
        }
        if (selection.key === 'gpu') {
          return this._model.gpuEngines.length > 0 || this._model.gpuStats.length > 0;
        }
        if (selection.key === 'system-load') {
          return this._model.topProcesses.length > 0;
        }
        return false;
      default:
        return true;
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'ugreen-nas-card': UgreenNasCard;
  }

  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview: boolean;
      documentationURL?: string;
    }>;
  }
}

if (!customElements.get(CUSTOM_CARD_TYPE)) {
  customElements.define(CUSTOM_CARD_TYPE, UgreenNasCard);
}

window.customCards = window.customCards || [];

if (!window.customCards.some((card) => card.type === CUSTOM_CARD_TYPE)) {
  window.customCards.push({
    type: CUSTOM_CARD_TYPE,
    name: 'UGREEN NAS Card',
    description: 'Large UGREEN DXP6800 Pro monitoring card with hardware, storage, projects, virtual machines, and network sections.',
    preview: true,
    documentationURL: 'https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card'
  });
}
