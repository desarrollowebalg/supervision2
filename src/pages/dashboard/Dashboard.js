import { renderInicioLayout } from '../inicio-layout.js';
import { buildDashboardDemoData } from './dashboard-demo.data.js';

const STATUS_ORDER = ['No leída *', 'Leída', 'Aprobada', 'Cerrada', 'Rechazada'];
const KPI_CONFIG = [
  { key: 'total', label: 'Total incidencias', tone: 'primary' },
  { key: 'No leída *', label: 'No leídas', tone: 'warning' },
  { key: 'Leída', label: 'Leídas', tone: 'default' },
  { key: 'Aprobada', label: 'Aprobadas', tone: 'success' },
  { key: 'Cerrada', label: 'Cerradas', tone: 'success' },
  { key: 'Rechazada', label: 'Rechazadas', tone: 'danger' }
];

const STATUS_TONE = {
  'No leída *': 'warning',
  'Leída': 'default',
  'Aprobada': 'success',
  'Cerrada': 'success',
  'Rechazada': 'danger'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function groupBy(items, mapper) {
  return items.reduce((accumulator, item) => {
    const key = mapper(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

export default class Dashboard {
  static instancia = null;

  constructor() {
    if (Dashboard.instancia) {
      return Dashboard.instancia;
    }

    Dashboard.instancia = this;
    this.allIncidents = buildDashboardDemoData();
    this.availableDates = [...new Set(this.allIncidents.map((item) => item.FECHA))].sort();
    this.currentDate = this.availableDates[this.availableDates.length - 1] || '';
    this.selectedIncidentIde = null;
    this.handleDateSelect = this.handleDateSelect.bind(this);
    this.handleDateStep = this.handleDateStep.bind(this);
    this.handleIncidentSelect = this.handleIncidentSelect.bind(this);
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.container = container;
    this.ensureStyles();

    const dateIncidents = this.getIncidentsForCurrentDate();
    const selectedIncident = this.getSelectedIncident(dateIncidents);
    const metrics = this.buildMetrics(dateIncidents);

    renderInicioLayout(container, {
      title: 'Dashboard',
      description: 'Demo operativa construida con la estructura JSON compartida. La navegación entre fechas ya está lista para sustituir el mock por datos reales.',
      contentHtml: this.renderDashboardContent({
        incidents: dateIncidents,
        selectedIncident,
        metrics
      })
    });

    this.bindEvents();
  }

  getIncidentsForCurrentDate() {
    return this.allIncidents.filter((item) => item.FECHA === this.currentDate);
  }

  getSelectedIncident(incidents) {
    if (!incidents.length) {
      return null;
    }

    const selected = incidents.find((item) => item.IDE === this.selectedIncidentIde);
    if (selected) {
      return selected;
    }

    this.selectedIncidentIde = incidents[0].IDE;
    return incidents[0];
  }

  buildMetrics(incidents) {
    const statusCounts = groupBy(incidents, (item) => item.STT_DESC);
    const shiftCounts = groupBy(incidents, (item) => item.TURNO || 'Sin turno');
    const pointCounts = groupBy(incidents, (item) => item.PDR || 'Sin punto');
    const levelCounts = groupBy(incidents, (item) => `Nivel ${item.NVL ?? 0}`);
    const hourCounts = groupBy(incidents, (item) => String(item.HORA || '').slice(0, 2) || '--');

    return {
      total: incidents.length,
      statusCounts,
      shiftCounts,
      pointCounts,
      levelCounts,
      hourCounts
    };
  }

  renderDashboardContent({ incidents, selectedIncident, metrics }) {
    const dateIndex = this.availableDates.indexOf(this.currentDate);
    const prevDisabled = dateIndex <= 0;
    const nextDisabled = dateIndex === -1 || dateIndex >= this.availableDates.length - 1;

    return `
      <section class="dashboard-page uk-section uk-section-small">
        <div class="dashboard-hero uk-card uk-card-default uk-card-body uk-border-rounded">
          <div class="uk-flex uk-flex-between uk-flex-middle dashboard-hero__header">
            <div>
              <span class="uk-text-meta">Supervision / Dashboard demo</span>
              <h2 class="uk-margin-small-top uk-margin-remove-bottom">Monitoreo por fecha, estatus y punto de revision</h2>
            </div>
            <span class="uk-label dashboard-demo-badge">Demo con muestra derivada del JSON compartido</span>
          </div>

          <div class="dashboard-date-toolbar uk-margin-medium-top">
            <button class="uk-button uk-button-default" data-dashboard-date-step="-1" ${prevDisabled ? 'disabled' : ''}>
              <span uk-icon="chevron-left"></span>
            </button>
            <div class="dashboard-date-chip-group">
              ${this.availableDates.map((date) => `
                <button
                  type="button"
                  class="uk-button ${date === this.currentDate ? 'uk-button-primary' : 'uk-button-default'}"
                  data-dashboard-date="${escapeHtml(date)}">
                  ${escapeHtml(formatDate(date))}
                </button>
              `).join('')}
            </div>
            <button class="uk-button uk-button-default" data-dashboard-date-step="1" ${nextDisabled ? 'disabled' : ''}>
              <span uk-icon="chevron-right"></span>
            </button>
          </div>
        </div>

        <div class="uk-child-width-1-2@s uk-child-width-1-3@l uk-grid-small uk-margin-top" uk-grid>
          ${KPI_CONFIG.map((kpi) => this.renderKpiCard(kpi, metrics)).join('')}
        </div>

        <div class="uk-grid-small uk-margin-top" uk-grid>
          <div class="uk-width-1-1 uk-width-1-2@l">
            ${this.renderDistributionCard('Distribucion por estatus', metrics.statusCounts, STATUS_ORDER)}
          </div>
          <div class="uk-width-1-1 uk-width-1-2@l">
            ${this.renderDistributionCard('Incidencias por punto de revision', metrics.pointCounts)}
          </div>
          <div class="uk-width-1-1 uk-width-1-2@l">
            ${this.renderDistributionCard('Incidencias por turno', metrics.shiftCounts)}
          </div>
          <div class="uk-width-1-1 uk-width-1-2@l">
            ${this.renderDistributionCard('Incidencias por nivel', metrics.levelCounts)}
          </div>
        </div>

        <div class="uk-grid-small uk-margin-top" uk-grid>
          <div class="uk-width-1-1 uk-width-2-3@xl">
            ${this.renderTimelineCard(metrics.hourCounts)}
          </div>
          <div class="uk-width-1-1 uk-width-1-3@xl">
            ${this.renderDetailCard(selectedIncident)}
          </div>
        </div>

        <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-margin-top">
          <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom dashboard-table-header">
            <div>
              <h3 class="uk-card-title uk-margin-remove">Muestra operativa del dia</h3>
              <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
                ${incidents.length} incidencias en la fecha seleccionada. Selecciona una fila para ver el detalle lateral.
              </p>
            </div>
            <span class="uk-label">${escapeHtml(formatDate(this.currentDate))}</span>
          </div>

          <div class="dashboard-table-wrap">
            <table class="uk-table uk-table-divider uk-table-small dashboard-table">
              <thead>
                <tr>
                  <th>IDE</th>
                  <th>Hora</th>
                  <th>Estatus</th>
                  <th>Nivel</th>
                  <th>Punto</th>
                  <th>Turno</th>
                  <th>Usuario</th>
                  <th>Atendio</th>
                </tr>
              </thead>
              <tbody>
                ${incidents.map((incident) => this.renderIncidentRow(incident)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  renderKpiCard(kpi, metrics) {
    const value = kpi.key === 'total' ? metrics.total : (metrics.statusCounts[kpi.key] || 0);
    return `
      <div>
        <article class="uk-card uk-card-default uk-card-body uk-border-rounded dashboard-kpi dashboard-kpi--${escapeHtml(kpi.tone)}">
          <span class="uk-text-meta">${escapeHtml(kpi.label)}</span>
          <strong class="dashboard-kpi__value">${escapeHtml(value)}</strong>
        </article>
      </div>
    `;
  }

  renderDistributionCard(title, counts, preferredOrder = []) {
    const entries = sortEntries(Object.entries(counts || {}));
    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
    const ordered = preferredOrder.length
      ? [
          ...preferredOrder
            .filter((label) => counts?.[label] !== undefined)
            .map((label) => [label, counts[label]]),
          ...entries.filter(([label]) => !preferredOrder.includes(label))
        ]
      : entries;

    return `
      <article class="uk-card uk-card-default uk-card-body uk-border-rounded dashboard-panel-card">
        <h3 class="uk-card-title uk-margin-small-bottom">${escapeHtml(title)}</h3>
        <div class="dashboard-bars">
          ${ordered.map(([label, value]) => {
            const percentage = Math.max(6, Math.round((value / total) * 100));
            const tone = STATUS_TONE[label] || 'default';

            return `
              <div class="dashboard-bar-row">
                <div class="dashboard-bar-row__meta">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
                <div class="dashboard-bar-track">
                  <div class="dashboard-bar-fill dashboard-bar-fill--${escapeHtml(tone)}" style="width:${percentage}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </article>
    `;
  }

  renderTimelineCard(hourCounts) {
    const entries = sortEntries(Object.entries(hourCounts || {})).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const max = Math.max(...entries.map(([, value]) => value), 1);

    return `
      <article class="uk-card uk-card-default uk-card-body uk-border-rounded dashboard-panel-card">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <h3 class="uk-card-title uk-margin-remove">Tendencia por hora</h3>
          <span class="uk-text-meta">Vista diaria</span>
        </div>
        <div class="dashboard-hour-grid">
          ${entries.map(([hour, value]) => `
            <div class="dashboard-hour-card">
              <div class="dashboard-hour-card__bar">
                <span style="height:${Math.max(12, Math.round((value / max) * 100))}%"></span>
              </div>
              <strong>${escapeHtml(value)}</strong>
              <span class="uk-text-meta">${escapeHtml(hour)}:00</span>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }

  renderDetailCard(incident) {
    if (!incident) {
      return `
        <article class="uk-card uk-card-default uk-card-body uk-border-rounded dashboard-panel-card">
          <h3 class="uk-card-title">Detalle</h3>
          <p class="uk-text-meta uk-margin-remove">Selecciona una incidencia para ver el resumen operativo.</p>
        </article>
      `;
    }

    const photos = (incident.FTS || []).filter(Boolean);
    const statusTone = STATUS_TONE[incident.STT_DESC] || 'default';

    return `
      <article class="uk-card uk-card-default uk-card-body uk-border-rounded dashboard-panel-card dashboard-detail-card">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <h3 class="uk-card-title uk-margin-remove">Detalle rapido</h3>
          <span class="uk-label dashboard-status-badge dashboard-status-badge--${escapeHtml(statusTone)}">${escapeHtml(incident.STT_DESC)}</span>
        </div>
        <dl class="uk-description-list dashboard-detail-list">
          <dt>IDE / IDI</dt>
          <dd>${escapeHtml(incident.IDE)} / ${escapeHtml(incident.IDI || '0')}</dd>
          <dt>Punto</dt>
          <dd>${escapeHtml(incident.PDR)}${incident.PDR_LABEL ? ` · ${escapeHtml(incident.PDR_LABEL)}` : ''}</dd>
          <dt>Turno</dt>
          <dd>${escapeHtml(incident.TURNO)}</dd>
          <dt>Atendio</dt>
          <dd>${escapeHtml(incident.USUARIO_ATENDIO || 'Pendiente')}</dd>
          <dt>Fecha atendido</dt>
          <dd>${escapeHtml(incident.FECHA_ATENDIDO || 'Sin atencion')}</dd>
        </dl>

        <div class="uk-margin-medium-top">
          <h4 class="uk-h5 uk-margin-small-bottom">Observacion</h4>
          <p class="uk-margin-remove dashboard-detail-observation">${escapeHtml(incident.OBS)}</p>
        </div>

        <div class="uk-margin-medium-top">
          <h4 class="uk-h5 uk-margin-small-bottom">Evidencias</h4>
          <div class="dashboard-photo-list">
            ${photos.length ? photos.map((photo) => `<span class="uk-label dashboard-photo-pill">${escapeHtml(photo)}</span>`).join('') : '<span class="uk-text-meta">Sin fotos disponibles</span>'}
          </div>
        </div>
      </article>
    `;
  }

  renderIncidentRow(incident) {
    const isSelected = incident.IDE === this.selectedIncidentIde;
    const tone = STATUS_TONE[incident.STT_DESC] || 'default';

    return `
      <tr class="${isSelected ? 'dashboard-row--selected' : ''}" data-dashboard-incident="${escapeHtml(incident.IDE)}">
        <td>${escapeHtml(incident.IDE)}</td>
        <td>${escapeHtml(incident.HORA)}</td>
        <td><span class="uk-label dashboard-status-badge dashboard-status-badge--${escapeHtml(tone)}">${escapeHtml(incident.STT_DESC)}</span></td>
        <td>${escapeHtml(`Nivel ${incident.NVL}`)}</td>
        <td>${escapeHtml(incident.PDR)}</td>
        <td>${escapeHtml(incident.TURNO)}</td>
        <td>${escapeHtml(incident.USUARIO)}</td>
        <td>${escapeHtml(incident.USUARIO_ATENDIO || 'Pendiente')}</td>
      </tr>
    `;
  }

  bindEvents() {
    this.container?.querySelectorAll('[data-dashboard-date]').forEach((button) => {
      button.addEventListener('click', this.handleDateSelect);
    });

    this.container?.querySelectorAll('[data-dashboard-date-step]').forEach((button) => {
      button.addEventListener('click', this.handleDateStep);
    });

    this.container?.querySelectorAll('[data-dashboard-incident]').forEach((row) => {
      row.addEventListener('click', this.handleIncidentSelect);
    });
  }

  handleDateSelect(event) {
    const nextDate = event.currentTarget?.getAttribute('data-dashboard-date');
    if (!nextDate || nextDate === this.currentDate) {
      return;
    }

    this.currentDate = nextDate;
    this.selectedIncidentIde = null;
    this.render(this.container);
  }

  handleDateStep(event) {
    const step = Number(event.currentTarget?.getAttribute('data-dashboard-date-step') || 0);
    const index = this.availableDates.indexOf(this.currentDate);
    const nextIndex = index + step;

    if (nextIndex < 0 || nextIndex >= this.availableDates.length) {
      return;
    }

    this.currentDate = this.availableDates[nextIndex];
    this.selectedIncidentIde = null;
    this.render(this.container);
  }

  handleIncidentSelect(event) {
    const ide = event.currentTarget?.getAttribute('data-dashboard-incident');
    if (!ide) {
      return;
    }

    this.selectedIncidentIde = ide;
    this.render(this.container);
  }

  ensureStyles() {
    if (document.getElementById('dashboard-demo-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'dashboard-demo-page-styles';
    style.textContent = `
      .dashboard-page {
        --dashboard-surface: var(--app-surface, #ffffff);
        --dashboard-surface-muted: var(--app-surface-muted, #f5f7fb);
        --dashboard-surface-elevated: var(--app-surface-elevated, #ffffff);
        --dashboard-border: var(--app-border, #d8dee6);
        --dashboard-text: var(--app-text, #1f2937);
        --dashboard-text-muted: var(--app-text-muted, #6b7280);
        --dashboard-primary: var(--app-primary, #1e87f0);
        --dashboard-primary-soft: var(--app-primary-soft, rgba(30, 135, 240, 0.14));
        --dashboard-shadow: var(--app-shadow-soft, 0 16px 36px rgba(15, 23, 42, 0.08));
      }

      .dashboard-page .uk-card,
      .dashboard-page .uk-table tbody tr,
      .dashboard-page .uk-table tbody td {
        color: var(--dashboard-text);
      }

      .dashboard-hero,
      .dashboard-panel-card,
      .dashboard-kpi {
        background: var(--dashboard-surface-elevated);
        border: 1px solid var(--dashboard-border);
        box-shadow: var(--dashboard-shadow);
      }

      .dashboard-demo-badge {
        background: var(--dashboard-primary-soft);
        color: var(--dashboard-primary);
        border: 1px solid var(--dashboard-border);
      }

      .dashboard-date-toolbar {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .dashboard-date-chip-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .dashboard-kpi {
        min-height: 8.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .dashboard-kpi__value {
        font-size: 2rem;
        line-height: 1;
      }

      .dashboard-kpi--primary {
        background: linear-gradient(135deg, color-mix(in srgb, var(--dashboard-primary) 12%, var(--dashboard-surface-elevated)) 0%, var(--dashboard-surface-elevated) 100%);
      }

      .dashboard-kpi--warning {
        background: linear-gradient(135deg, color-mix(in srgb, #f59e0b 14%, var(--dashboard-surface-elevated)) 0%, var(--dashboard-surface-elevated) 100%);
      }

      .dashboard-kpi--success {
        background: linear-gradient(135deg, color-mix(in srgb, #10b981 14%, var(--dashboard-surface-elevated)) 0%, var(--dashboard-surface-elevated) 100%);
      }

      .dashboard-kpi--danger {
        background: linear-gradient(135deg, color-mix(in srgb, #ef4444 14%, var(--dashboard-surface-elevated)) 0%, var(--dashboard-surface-elevated) 100%);
      }

      .dashboard-bars {
        display: grid;
        gap: 0.85rem;
      }

      .dashboard-bar-row__meta {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.35rem;
        font-size: 0.92rem;
      }

      .dashboard-bar-track {
        height: 0.6rem;
        border-radius: 999px;
        background: var(--dashboard-surface-muted);
        overflow: hidden;
      }

      .dashboard-bar-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--dashboard-primary);
      }

      .dashboard-bar-fill--warning {
        background: #f59e0b;
      }

      .dashboard-bar-fill--success {
        background: #10b981;
      }

      .dashboard-bar-fill--danger {
        background: #ef4444;
      }

      .dashboard-bar-fill--default {
        background: #64748b;
      }

      .dashboard-hour-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
        gap: 0.75rem;
      }

      .dashboard-hour-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.45rem;
        padding: 0.9rem 0.65rem;
        border-radius: 14px;
        background: var(--dashboard-surface-muted);
        border: 1px solid var(--dashboard-border);
      }

      .dashboard-hour-card__bar {
        width: 100%;
        height: 92px;
        display: flex;
        align-items: flex-end;
      }

      .dashboard-hour-card__bar span {
        width: 100%;
        border-radius: 999px 999px 0 0;
        background: linear-gradient(180deg, color-mix(in srgb, var(--dashboard-primary) 86%, white) 0%, var(--dashboard-primary) 100%);
      }

      .dashboard-detail-list dt {
        color: var(--dashboard-text-muted);
        font-weight: 600;
      }

      .dashboard-detail-list dd {
        margin-bottom: 0.85rem;
      }

      .dashboard-detail-observation {
        color: var(--dashboard-text);
      }

      .dashboard-photo-list {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .dashboard-photo-pill {
        background: var(--dashboard-surface-muted);
        color: var(--dashboard-text);
        border: 1px solid var(--dashboard-border);
      }

      .dashboard-table-wrap {
        overflow-x: auto;
      }

      .dashboard-table tbody tr {
        cursor: pointer;
      }

      .dashboard-table tbody tr:hover,
      .dashboard-row--selected {
        background: var(--dashboard-primary-soft);
      }

      .dashboard-status-badge {
        border-radius: 999px;
      }

      .dashboard-status-badge--warning {
        background: color-mix(in srgb, #f59e0b 18%, var(--dashboard-surface-elevated));
        color: #b45309;
      }

      .dashboard-status-badge--success {
        background: color-mix(in srgb, #10b981 18%, var(--dashboard-surface-elevated));
        color: #047857;
      }

      .dashboard-status-badge--danger {
        background: color-mix(in srgb, #ef4444 16%, var(--dashboard-surface-elevated));
        color: #b91c1c;
      }

      .dashboard-status-badge--default {
        background: var(--dashboard-surface-muted);
        color: var(--dashboard-text);
      }

      @media (max-width: 959px) {
        .dashboard-hero__header,
        .dashboard-table-header,
        .dashboard-date-toolbar {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

