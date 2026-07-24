import './userAvatar.js';
import { getWeeklyIncidencesCatalogFromLocal } from '../core/services/apis-me/reports.service.js';

class IncidencesTimelineComponent extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'subtitle'];
  }

  constructor() {
    super();
    this._items = [];
    this._isLoading = false;
    this._errorMessage = '';
    this._selectedItem = null;
    this._mobileModalInstance = null;
    this._rangeLabel = '';
    this._handleTimelineClick = this._handleTimelineClick.bind(this);
  }

  connectedCallback() {
    this._ensureStyles();
    this.addEventListener('click', this._handleTimelineClick);
    this._loadIncidences();
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleTimelineClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get title() {
    return this.getAttribute('title') || 'Incidencias de la semana';
  }

  get subtitle() {
    return this.getAttribute('subtitle') || this._rangeLabel || 'Consulta semanal de incidencias';
  }

  _ensureStyles() {
    if (document.getElementById('incidences-timeline-component-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'incidences-timeline-component-styles';
    style.textContent = `
      incidences-timeline-component {
        display: block;
        --timeline-accent: var(--app-primary, #1e87f0);
        --timeline-accent-soft: var(--app-primary-soft, rgba(30, 135, 240, 0.14));
        --timeline-border: var(--app-border, #e5e7eb);
        --timeline-border-strong: var(--app-border-strong, #cbd5e1);
        --timeline-text: var(--app-text, #1f2937);
        --timeline-text-muted: var(--app-text-muted, #6b7280);
        --timeline-surface: var(--app-surface, #ffffff);
        --timeline-surface-muted: var(--app-surface-muted, #f3f4f6);
        --timeline-shadow: var(--app-shadow, 0 12px 30px rgba(15, 23, 42, 0.08));
      }

      html[data-theme='dark'] incidences-timeline-component {
        --timeline-accent-soft: rgba(96, 165, 250, 0.18);
      }

      incidences-timeline-component .timeline-list {
        position: relative;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      incidences-timeline-component .timeline-item {
        position: relative;
        padding-left: 1.75rem;
        margin-bottom: 1rem;
      }

      incidences-timeline-component .timeline-item:last-child {
        margin-bottom: 0;
      }

      incidences-timeline-component .timeline-item::before {
        content: '';
        position: absolute;
        left: 0.35rem;
        top: 0.25rem;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        background: var(--timeline-accent);
        box-shadow: 0 0 0 5px var(--timeline-accent-soft);
      }

      incidences-timeline-component .timeline-item::after {
        content: '';
        position: absolute;
        left: 0.58rem;
        top: 1rem;
        bottom: -0.75rem;
        width: 1px;
        background: var(--timeline-border);
      }

      incidences-timeline-component .timeline-item:last-child::after {
        display: none;
      }

      incidences-timeline-component .timeline-record-card {
        border: 1px solid var(--timeline-border);
        background: var(--timeline-surface-muted);
        color: var(--timeline-text);
        transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      }

      incidences-timeline-component .timeline-record-card:hover,
      incidences-timeline-component .timeline-record-card:focus-within {
        border-color: var(--timeline-border-strong);
        box-shadow: var(--timeline-shadow);
      }

      incidences-timeline-component .timeline-record-card strong {
        color: var(--timeline-text);
      }

      incidences-timeline-component .timeline-record-card .uk-text-meta {
        color: var(--timeline-text-muted);
      }

      incidences-timeline-component .timeline-summary-badge {
        background: var(--timeline-accent-soft);
        color: var(--timeline-accent);
        border-radius: 999px;
      }

      incidences-timeline-component .timeline-mobile-modal-title {
        color: var(--timeline-text);
      }

      incidences-timeline-component .timeline-empty-alert.uk-alert-warning {
        background: color-mix(in srgb, var(--timeline-surface) 84%, #f59e0b 16%);
        color: color-mix(in srgb, var(--timeline-text) 72%, #b45309 28%);
        border: 1px solid color-mix(in srgb, var(--timeline-border) 58%, #f59e0b 42%);
      }

      html[data-theme='dark'] incidences-timeline-component .timeline-empty-alert.uk-alert-warning {
        background: color-mix(in srgb, var(--timeline-surface-muted) 82%, #f59e0b 18%);
        color: #fcd34d;
        border-color: color-mix(in srgb, var(--timeline-border-strong) 60%, #f59e0b 40%);
      }

      incidences-timeline-component .timeline-empty-alert p,
      incidences-timeline-component .timeline-error-alert p {
        color: inherit;
      }

      incidences-timeline-component .timeline-detail-grid {
        display: grid;
        gap: 0.55rem;
      }

      incidences-timeline-component .timeline-detail-row {
        display: grid;
        gap: 0.2rem;
      }

      incidences-timeline-component .timeline-detail-row dt {
        font-size: 0.78rem;
        color: var(--timeline-text-muted);
      }

      incidences-timeline-component .timeline-detail-row dd {
        margin: 0;
        color: var(--timeline-text);
        word-break: break-word;
      }

      incidences-timeline-component .timeline-summary-text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);
  }

  _parseDate(value) {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  _formatDate(dateValue) {
    const date = this._parseDate(dateValue);
    if (!date) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  _formatRangeLabel(startDate, endDate) {
    const start = this._parseDate(startDate);
    const end = this._parseDate(endDate);
    if (!start || !end) {
      return 'Semana actual';
    }

    const formatter = new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short'
    });

    return `Semana ${formatter.format(start)} - ${formatter.format(end)}`;
  }

  _getStatusLabelClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('cerrada') || normalized.includes('aprobada')) return 'uk-label-success';
    if (normalized.includes('rechazada') || normalized.includes('error')) return 'uk-label-danger';
    if (normalized.includes('pendiente') || normalized.includes('no leida')) return 'uk-label-warning';
    if (normalized.includes('leida')) return 'uk-label-primary';
    return 'uk-label-secondary';
  }

  _getFilteredItems() {
    return [...this._items].sort((a, b) => {
      const dateA = new Date(a.occurredAt || 0).getTime();
      const dateB = new Date(b.occurredAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async _loadIncidences() {
    this._isLoading = true;
    this._errorMessage = '';
    this.render();

    try {
      const result = await getWeeklyIncidencesCatalogFromLocal();
      this._items = Array.isArray(result?.items) ? result.items : [];
      this._rangeLabel = this._formatRangeLabel(result?.startDate, result?.endDate);

      if (!result) {
        this._errorMessage = 'Aun no hay datos sincronizados para esta semana.';
      }
    } catch (error) {
      this._items = [];
      this._rangeLabel = '';
      this._errorMessage = error?.message || 'No fue posible consultar las incidencias semanales.';
      console.warn('No fue posible consultar incidencias semanales', error);
    } finally {
      this._isLoading = false;
      this.render();
    }
  }

  render() {
    const filtered = this._getFilteredItems();
    const modalId = 'timeline-incidences-modal';

    this.innerHTML = `
      <section class="uk-card uk-card-default uk-card-body uk-border-rounded">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <div>
            <h3 class="uk-card-title uk-margin-remove-bottom">${this.title}</h3>
            <p class="uk-text-meta uk-margin-remove-top">${this.subtitle}</p>
          </div>
          <span class="uk-label timeline-summary-badge">${filtered.length} registros</span>
        </div>

        ${this._isLoading ? `
          <div class="uk-flex uk-flex-center uk-padding-small"><div uk-spinner></div></div>
        ` : this._errorMessage ? `
          <div class="uk-alert-danger uk-border-rounded timeline-error-alert" uk-alert>
            <p class="uk-margin-remove">${this._errorMessage}</p>
          </div>
        ` : filtered.length ? `
          <ul class="timeline-list">
            ${filtered.map((item, index) => `
              <li class="timeline-item">
                <div
                  class="uk-card uk-card-small uk-card-muted uk-padding-small uk-border-rounded timeline-record-card uk-padding-remove-top"
                  data-action="open-mobile-modal"
                  data-item-index="${index}">
                  <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
                    <strong>${this._escapeHtml(item.title || 'Incidencia')}</strong>
                    ${item.status ? `<span class="uk-label ${this._getStatusLabelClass(item.status)}">${this._escapeHtml(item.status)}</span>` : ''}
                  </div>
                  <div class="uk-text-meta uk-margin-small-bottom">${this._escapeHtml(this._formatDate(item.occurredAt))}</div>
                  ${item.id ? `<p class="uk-margin-remove"><strong>ID:</strong> ${this._escapeHtml(item.id)}</p>` : ''}
                  ${item.userName ? `<p class="uk-margin-small-top uk-margin-remove-bottom"><strong>Usuario:</strong> ${this._escapeHtml(item.userName)}</p>` : ''}
                  ${item.summary ? `<p class="uk-margin-small-top uk-margin-remove-bottom timeline-summary-text">${this._escapeHtml(item.summary)}</p>` : ''}
                  <div class="uk-margin-small-top uk-visible@s">
                    ${this._buildDetailsHtml(item)}
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="uk-alert-warning uk-border-rounded timeline-empty-alert" uk-alert>
            <p class="uk-margin-remove">No hay incidencias registradas esta semana.</p>
          </div>
        `}
      </section>

      <div id="${modalId}" uk-modal class="uk-hidden@s">
        <div class="uk-modal-dialog uk-modal-body">
          <button class="uk-modal-close-default" type="button" uk-close></button>
          <h4 class="uk-modal-title timeline-mobile-modal-title">Detalle de incidencia</h4>
          <div data-role="mobile-detail-slot"></div>
        </div>
      </div>
    `;

    const modalElement = this.querySelector('#timeline-incidences-modal');
    if (modalElement && window.UIkit?.modal) {
      this._mobileModalInstance = window.UIkit.modal(modalElement);
    } else {
      this._mobileModalInstance = null;
    }
  }

  _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _buildDetailsHtml(item) {
    const detailEntries = Object.entries(item?.raw || {}).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
    if (!detailEntries.length) {
      return '<p class="uk-text-meta uk-margin-remove">Sin detalle adicional.</p>';
    }

    return `
      <dl class="timeline-detail-grid uk-margin-remove">
        ${detailEntries.map(([key, value]) => `
          <div class="timeline-detail-row">
            <dt>${this._escapeHtml(key)}</dt>
            <dd>${this._escapeHtml(value)}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  }

  _handleTimelineClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const card = target.closest('[data-action="open-mobile-modal"]');
    if (!card || !this.contains(card)) {
      return;
    }

    if (window.matchMedia('(min-width: 640px)').matches) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const itemIndex = Number.parseInt(card.getAttribute('data-item-index') || '-1', 10);
    const item = this._getFilteredItems()[itemIndex];
    if (!item) {
      return;
    }

    this._selectedItem = item;
    const slot = this.querySelector('[data-role="mobile-detail-slot"]');
    if (slot) {
      slot.innerHTML = this._buildDetailsHtml(item);
    }
    this._mobileModalInstance?.show();
  }
}

if (!customElements.get('incidences-timeline-component')) {
  customElements.define('incidences-timeline-component', IncidencesTimelineComponent);
}

export default IncidencesTimelineComponent;
