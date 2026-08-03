import { css, unsafeCSS } from 'lit';
import { LAYOUT, THEME_COLORS } from './theme';

export const cardStyles = css`
  :host {
    --ug-card-bg: radial-gradient(circle at top, ${unsafeCSS(THEME_COLORS.panelTop)}, ${unsafeCSS(THEME_COLORS.panelBottom)});
    --ug-panel: ${unsafeCSS(THEME_COLORS.panelSolid)};
    --ug-border: ${unsafeCSS(THEME_COLORS.border)};
    --ug-border-strong: ${unsafeCSS(THEME_COLORS.borderStrong)};
    --ug-text-main: ${unsafeCSS(THEME_COLORS.textMain)};
    --ug-text-soft: ${unsafeCSS(THEME_COLORS.textSoft)};
    --ug-good: ${unsafeCSS(THEME_COLORS.good)};
    --ug-purple: ${unsafeCSS(THEME_COLORS.purple)};
    --ug-cyan: ${unsafeCSS(THEME_COLORS.cyan)};
    --ug-blue: ${unsafeCSS(THEME_COLORS.blue)};
    --ug-yellow: ${unsafeCSS(THEME_COLORS.yellow)};
    --ug-danger: ${unsafeCSS(THEME_COLORS.danger)};
    --ug-shadow: 0 0 0 1px rgba(38, 85, 145, 0.25), 0 10px 30px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
    display: block;
    color: var(--ug-text-main);
    font-family: Inter, system-ui, sans-serif;
  }

  ha-card {
    background: linear-gradient(180deg, rgba(4, 17, 35, 0.94), rgba(2, 12, 25, 0.98));
    border: 1px solid rgba(45, 121, 214, 0.28);
    border-radius: 26px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(24, 172, 255, 0.08);
    overflow: hidden;
  }

  .shell {
    padding: ${LAYOUT.shellPadding}px;
    display: grid;
    gap: ${LAYOUT.shellGap}px;
    grid-template-columns: 396px minmax(628px, 1fr) minmax(182px, 0.4fr);
    align-items: start;
    background:
      radial-gradient(circle at 15% 10%, rgba(0, 198, 255, 0.09), transparent 26%),
      radial-gradient(circle at 80% 18%, rgba(146, 83, 255, 0.08), transparent 24%),
      linear-gradient(180deg, ${unsafeCSS(THEME_COLORS.shellTop)}, ${unsafeCSS(THEME_COLORS.shellBottom)});
  }

  .shell > * {
    align-self: start;
    min-width: 0;
  }

  .panel {
    background: var(--ug-card-bg);
    border: 1px solid var(--ug-border);
    border-radius: ${LAYOUT.panelRadius}px;
    box-shadow: var(--ug-shadow);
    overflow: hidden;
  }

  .panel-title,
  .subsection-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ug-text-main);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .panel-title {
    padding: 14px 16px 10px;
    font-size: 14px;
  }

  .panel-title svg,
  .subsection-title svg {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    display: block;
  }

  .subsection-title {
    font-size: 12px;
    color: var(--ug-text-soft);
    margin-bottom: 10px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .main-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .device-head {
    padding: 16px 18px 12px;
    display: grid;
    gap: 10px;
  }

  .device-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .device-subtitle {
    color: var(--ug-cyan);
    font-size: 16px;
  }

  .device-mode-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .mode-chip {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: var(--ug-text-main);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .mode-chip.live {
    border-color: rgba(105, 235, 87, 0.35);
    background: rgba(105, 235, 87, 0.12);
    color: var(--ug-good);
  }

  .mode-chip.missing {
    border-color: rgba(255, 216, 77, 0.32);
    background: rgba(255, 216, 77, 0.12);
    color: var(--ug-yellow);
  }

  .mode-chip.preview {
    border-color: rgba(42, 167, 255, 0.35);
    background: rgba(42, 167, 255, 0.12);
    color: var(--ug-blue);
  }

  .device-mode-note {
    color: var(--ug-text-soft);
    font-size: 12px;
  }

  .info-list {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin-top: 4px;
    padding-top: 10px;
    display: grid;
    gap: 10px;
  }

  .info-row {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    gap: 10px;
    align-items: center;
    color: var(--ug-text-soft);
    font-size: 14px;
  }

  .info-row svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  .info-row strong {
    color: var(--ug-text-main);
    font-weight: 500;
  }

  .sidebar-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .mini-card,
  .storage-card,
  .network-card,
  .docker-summary,
  .docker-item,
  .hardware-card,
  .table-card {
    background: linear-gradient(180deg, rgba(9, 23, 43, 0.96), rgba(8, 19, 36, 0.92));
    border: 1px solid rgba(47, 103, 177, 0.34);
    border-radius: ${LAYOUT.cardRadius}px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  }

  .interactive {
    width: 100%;
    color: inherit;
    font: inherit;
    line-height: inherit;
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .mini-card.interactive {
    display: grid;
    align-content: start;
  }

  .interactive.active {
    border-color: rgba(126, 162, 255, 1);
    box-shadow:
      inset 0 0 0 1px rgba(126, 162, 255, 0.38),
      0 0 0 1px rgba(126, 162, 255, 0.45),
      0 0 18px rgba(126, 162, 255, 0.22);
  }

  .interactive:hover {
    border-color: rgba(126, 162, 255, 0.7);
  }

  .interactive:focus-visible {
    outline: none;
    border-color: rgba(126, 162, 255, 1);
    box-shadow:
      inset 0 0 0 1px rgba(126, 162, 255, 0.3),
      0 0 0 1px rgba(126, 162, 255, 0.4),
      0 0 16px rgba(126, 162, 255, 0.18);
  }

  .mini-card {
    padding: 12px 14px;
    display: grid;
    gap: 8px;
    min-height: 114px;
  }

  .mini-card.full {
    grid-column: 1 / -1;
    min-height: 124px;
  }

  .mini-top {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ug-text-main);
    font-size: 14px;
  }

  .mini-top svg {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    display: block;
  }

  .mini-value {
    font-size: 24px;
    font-weight: 700;
  }

  .mini-footer {
    font-size: 13px;
    color: var(--ug-text-soft);
  }

  .mini-footer.positive {
    color: var(--ug-good);
  }

  .mini-storage-meta,
  .mini-network-meta {
    display: grid;
    gap: 8px;
    margin-top: 2px;
  }

  .metric-indicator {
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .metric-indicator > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    min-width: 10px;
  }

  .mini-storage-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  .mini-storage-bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--ug-cyan), var(--ug-blue));
  }

  .mini-network-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ug-text-soft);
    font-size: 13px;
  }

  .mini-network-stat svg {
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
    display: block;
  }

  .mini-network-stat strong {
    color: var(--ug-text-main);
    font-size: 15px;
  }

  .mini-network-stat.down {
    color: var(--ug-good);
  }

  .mini-network-stat.up {
    color: var(--ug-purple);
  }

  .hardware-grid {
    padding: 0 12px 12px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    align-items: start;
  }

  .hardware-card {
    padding: 14px;
    display: grid;
    gap: 12px;
    border: 1px solid rgba(47, 103, 177, 0.34);
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
  }

  .metric-title {
    font-size: 16px;
    font-weight: 700;
  }

  .metric-subtitle {
    font-size: 12px;
    color: var(--ug-text-soft);
  }

  .metric-value {
    font-size: 22px;
    font-weight: 700;
  }

  .detail-grid {
    display: grid;
    gap: 6px;
    font-size: 13px;
  }

  .detail-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    color: var(--ug-text-soft);
  }

  .detail-row strong {
    color: var(--ug-text-main);
    font-weight: 500;
  }

  .storage {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 12px;
  }

  .storage > * {
    align-self: start;
  }

  .table-card {
    padding: 0 0 10px;
  }

  .table-wrap {
    padding: 0 12px 12px;
    max-height: min(50vh, 550px);
    overflow: auto;
    scrollbar-gutter: stable;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-align: left;
  }

  th {
    color: var(--ug-text-soft);
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(7, 19, 35, 0.96);
    backdrop-filter: blur(8px);
  }

  td {
    color: var(--ug-text-main);
  }

  .health {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .health.warning {
    color: var(--ug-yellow);
  }

  .health.degraded,
  .status.down {
    color: var(--ug-danger);
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--ug-good);
    box-shadow: 0 0 10px rgba(105, 235, 87, 0.7);
  }

  .health.warning .dot,
  .status.partial .dot {
    background: var(--ug-yellow);
    box-shadow: 0 0 10px rgba(255, 216, 77, 0.6);
  }

  .health.degraded .dot,
  .status.down .dot {
    background: var(--ug-danger);
    box-shadow: 0 0 10px rgba(255, 107, 125, 0.65);
  }

  .pool-list {
    display: grid;
    gap: 12px;
    padding: 0 12px 12px;
    align-content: start;
    max-height: min(35vh, 376px);
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .storage-card {
    padding: 12px;
    display: grid;
    gap: 8px;
    border: 1px solid rgba(47, 103, 177, 0.34);
  }

  .pool-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 10px;
  }

  .pool-title {
    font-size: 15px;
    font-weight: 700;
  }

  .pool-subtitle {
    color: var(--ug-text-soft);
    font-size: 13px;
    margin-top: 3px;
  }

  .bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  .bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
  }

  .pool-stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    font-size: 13px;
  }

  .pool-stats .label {
    color: var(--ug-text-soft);
    display: block;
    margin-bottom: 3px;
  }

  .pool-drives-value {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .pool-drives-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--ug-good);
    box-shadow: 0 0 0 3px rgba(105, 235, 87, 0.12);
    flex: 0 0 8px;
  }

  .docker {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .docker-list {
    padding: 0 12px 12px;
    display: grid;
    gap: 10px;
    max-height: min(67vh, 860px);
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .docker-item {
    padding: 12px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border: 1px solid rgba(47, 103, 177, 0.34);
  }

  .logo-chip {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.04);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
    overflow: hidden;
  }

  .logo-chip svg,
  .logo-chip img {
    width: 22px;
    height: 22px;
    max-width: 22px;
    max-height: 22px;
    display: block;
  }

  .logo-chip img {
    object-fit: contain;
  }

  .docker-name {
    font-size: 15px;
    font-weight: 600;
  }

  .docker-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ug-good);
    font-size: 13px;
    margin-top: 4px;
  }

  .docker-metrics {
    min-width: 112px;
    display: grid;
    gap: 6px;
    font-size: 12px;
  }

  .metric-line {
    display: grid;
    grid-template-columns: 34px auto 1fr;
    gap: 8px;
    align-items: center;
    color: var(--ug-text-soft);
  }

  .metric-line strong {
    color: var(--ug-text-main);
    min-width: 48px;
    text-align: right;
  }

  .metric-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .metric-bar > span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--ug-blue), var(--ug-purple));
    border-radius: inherit;
  }

  .detail-card-stack,
  .detail-grid-cards {
    display: grid;
    gap: 12px;
  }

  .detail-grid-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-card,
  .detail-stat-card {
    padding: 14px;
    border-radius: ${LAYOUT.cardRadius}px;
    border: 1px solid rgba(47, 103, 177, 0.28);
    background: linear-gradient(180deg, rgba(10, 24, 44, 0.94), rgba(7, 18, 34, 0.88));
    display: grid;
    gap: 12px;
  }

  .detail-card-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }

  .detail-card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .detail-card-logo {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    overflow: hidden;
    flex: 0 0 38px;
  }

  .detail-card-logo svg,
  .detail-card-logo img {
    width: 20px;
    height: 20px;
    max-width: 20px;
    max-height: 20px;
    display: block;
  }

  .detail-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--ug-text-main);
    min-width: 0;
    word-break: break-word;
  }

  .detail-subtitle {
    font-size: 12px;
    color: var(--ug-text-soft);
    min-width: 0;
    word-break: break-word;
  }

  .detail-metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .container-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .container-metrics .detail-metric-card:last-child {
    grid-column: 1 / -1;
  }

  .detail-metric-card {
    display: grid;
    gap: 4px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
  }

  .detail-metric-card span,
  .detail-meta-list span {
    color: var(--ug-text-soft);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .detail-metric-card strong,
  .detail-meta-list strong {
    color: var(--ug-text-main);
    font-size: 13px;
    word-break: break-word;
  }

  .detail-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--ug-text-main);
  }

  .detail-inline-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 999px;
    overflow: hidden;
  }

  .detail-inline-bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--ug-cyan), var(--ug-blue));
    min-width: 8px;
  }

  .detail-meta-list {
    display: grid;
    gap: 8px;
  }

  .detail-meta-list > div {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .docker-summary-grid {
    padding: 0 12px 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .docker-summary {
    padding: 14px;
    min-height: 84px;
    display: grid;
    gap: 8px;
  }

  .docker-summary .mini-value.positive {
    color: var(--ug-good);
  }

  .network-panel-body {
    padding: 0 12px 12px;
    min-width: 0;
  }

  .network-panel-scroll {
    max-height: min(32vh, 320px);
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .table-wrap,
  .pool-list,
  .docker-list,
  .network-panel-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(126, 162, 255, 0.45) rgba(255, 255, 255, 0.04);
  }

  .table-wrap::-webkit-scrollbar,
  .pool-list::-webkit-scrollbar,
  .docker-list::-webkit-scrollbar,
  .network-panel-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .table-wrap::-webkit-scrollbar-track,
  .pool-list::-webkit-scrollbar-track,
  .docker-list::-webkit-scrollbar-track,
  .network-panel-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 999px;
  }

  .table-wrap::-webkit-scrollbar-thumb,
  .pool-list::-webkit-scrollbar-thumb,
  .docker-list::-webkit-scrollbar-thumb,
  .network-panel-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(126, 162, 255, 0.65), rgba(42, 167, 255, 0.45));
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: 18px;
    border: 1px dashed rgba(126, 162, 255, 0.24);
    border-radius: ${LAYOUT.cardRadius}px;
    color: var(--ug-text-soft);
    text-align: center;
    font-size: 13px;
    line-height: 1.5;
    background: linear-gradient(180deg, rgba(9, 23, 43, 0.62), rgba(8, 19, 36, 0.5));
  }

  .iface-card {
    padding: 12px 0px 0 6px;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .iface-card:last-child {
    margin-bottom: 0;
    border-bottom: 0;
  }

  .iface-main {
    display: grid;
    grid-template-columns: repeat(5, minmax(60px, auto));
    gap: 14px;
    align-items: center;
    min-width: 0;
  }

  .iface-meta-block {
    min-width: 0;
  }

  .iface-heading {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 0px;
    min-width: 0px;
  }

  .iface-name {
    min-width: 0;
  }

  .iface-stat {
    display: grid;
    gap: 4px;
    min-width: 0px;
    text-align: center;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
  }

  .iface-stat span {
    color: var(--ug-text-soft);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .iface-stat strong {
    color: var(--ug-text-main);
    font-size: 12px;
    white-space: nowrap;
  }

  .iface-stat.down strong {
    color: var(--ug-good);
  }

  .iface-stat.up strong {
    color: var(--ug-purple);
  }

  @media (max-width: 1440px) {
    .shell {
      grid-template-columns: 360px minmax(520px, 1fr);
    }

    .docker {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 1080px) {
    .shell {
      grid-template-columns: 1fr;
    }

    .hardware-grid,
    .storage {
      grid-template-columns: 1fr;
    }

    .docker {
      grid-column: auto;
    }

    .table-wrap,
    .pool-list,
    .docker-list,
    .network-panel-scroll {
      max-height: none;
    }

    .docker-item {
      grid-template-columns: 1fr;
    }

    .detail-grid-cards,
    .detail-metric-grid {
      grid-template-columns: 1fr;
    }
  }
`;
