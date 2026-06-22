import './userAvatar.js';
import { saveTextEvidence } from '../core/services/apis-me/evidences.service.js';
import { getEvidenceRecords, updateEvidenceRecordAt } from '../core/services/evidence-indexeddb.service.js';

class FormsTimelineComponent extends HTMLElement {
  static get observedAttributes() {
    return ['days-window', 'title', 'subtitle'];
  }

  constructor() {
    super();
    this._items = [];
    this._isLoading = false;
    this._selectedItem = null;
    this._isResending = false;
    this._mobileModalInstance = null;
    this._handleTimelineClick = this._handleTimelineClick.bind(this);
  }

  connectedCallback() {
    this._ensureStyles();
    this.addEventListener('click', this._handleTimelineClick);
    this._loadEvidenceItems();
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

  set items(value) {
    if (Array.isArray(value)) {
      this._items = value;
      this.render();
    }
  }

  get items() {
    return this._items;
  }

  get daysWindow() {
    const value = Number.parseInt(this.getAttribute('days-window') || '7', 10);
    return Number.isNaN(value) ? 7 : value;
  }

  get title() {
    return this.getAttribute('title') || 'Ultimos formularios';
  }

  get subtitle() {
    return this.getAttribute('subtitle') || `Actividad de los ultimos ${this.daysWindow} dias`;
  }

  _ensureStyles() {
    if (document.getElementById('forms-timeline-component-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'forms-timeline-component-styles';
    style.textContent = `
      forms-timeline-component {
        display: block;
      }

      forms-timeline-component .timeline-list {
        position: relative;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      forms-timeline-component .timeline-item {
        position: relative;
        padding-left: 1.75rem;
        margin-bottom: 1rem;
      }

      forms-timeline-component .timeline-item:last-child {
        margin-bottom: 0;
      }

      forms-timeline-component .timeline-item::before {
        content: '';
        position: absolute;
        left: 0.35rem;
        top: 0.25rem;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        background: #1e87f0;
      }

      forms-timeline-component .timeline-item::after {
        content: '';
        position: absolute;
        left: 0.58rem;
        top: 1rem;
        bottom: -0.75rem;
        width: 1px;
        background: #d6d6d6;
      }

      forms-timeline-component .timeline-item:last-child::after {
        display: none;
      }
    `;

    document.head.appendChild(style);
  }

  _parseDate(value) {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  _isWithinWindow(dateValue, now) {
    const date = this._parseDate(dateValue);
    if (!date) {
      return false;
    }

    const diffMs = now.getTime() - date.getTime();
    const daysMs = this.daysWindow * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= daysMs;
  }

  _getStatusLabelClass(status) {
    const normalized = (status || '').toLowerCase();
    console.log("Estatus: ",normalized);
    if (normalized.includes('enviada')) return 'uk-label-success';
    if (normalized.includes('no enviada')) return 'uk-label-danger';
    if (normalized.includes('pendiente')) return 'uk-label-warning';
    if (normalized.includes('error')) return 'uk-label-danger';
    return 'uk-label-primary';
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

  _getFilteredItems() {
    return this.items
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async _loadEvidenceItems() {
    this._isLoading = true;
    this.render();

    try {
      const records = await getEvidenceRecords();
      this._items = records.map((record, evidenceIndex) => ({
        title: String(record?.DESCRIPCION || 'Formulario'),
        status: String(record?.ESTATUS || 'PENDIENTE'),
        sentAt: String(record?.FECHA_ENVIO || ''),
        idrc: String(record?.IDRC || ''),
        itemNumber: String(record?.ITEM_NUMBER || ''),
        captured: record?.captured && typeof record.captured === 'object' ? record.captured : null,
        evidenceIndex
      }));
    } catch (error) {
      console.warn('No fue posible leer catalogo evidence', error);
      this._items = [];
    } finally {
      this._isLoading = false;
      this.render();
    }
  }

  render() {
    const filtered = this._getFilteredItems();
    const modalId = 'timeline-evidence-actions-modal';

    this.innerHTML = `
      <section class="uk-card uk-card-default uk-card-body uk-border-rounded">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <div>
            <h3 class="uk-card-title uk-margin-remove-bottom">${this.title}</h3>
            <p class="uk-text-meta uk-margin-remove-top">${this.subtitle}</p>
          </div>
          <span class="uk-label">${filtered.length} registros</span>
        </div>

        ${this._isLoading ? `
          <div class="uk-flex uk-flex-center uk-padding-small"><div uk-spinner></div></div>
        ` : filtered.length ? `
          <ul class="timeline-list">
            ${filtered.map((item) => `
              <li class="timeline-item">
                <div
                  class="uk-card uk-card-small uk-card-muted uk-padding-small uk-border-rounded timeline-record-card uk-padding-remove-top"
                  data-action="open-mobile-modal"
                  data-evidence-index="${item.evidenceIndex}">
                  <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
                    <strong>${item.title || 'Formulario'}</strong>
                    <span class="uk-label ${this._getStatusLabelClass(item.status)}">${item.status || 'PENDIENTE'}</span>
                  </div>
                  <div class="uk-text-meta uk-margin-small-bottom">${this._formatDate(item.sentAt)}</div>
                  <p class="uk-margin-remove"><strong>#:</strong> ${item.idrc || '-'}</p>                  
                  <div class="uk-margin-small-top uk-visible@s">
                    ${this._buildActionsHtml(item)}
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="uk-alert-warning" uk-alert>
            <p class="uk-margin-remove">No hay evidencias enviadas.</p>
          </div>
        `}
      </section>

      <div id="${modalId}" uk-modal class="uk-hidden@s">
        <div class="uk-modal-dialog uk-modal-body">
          <button class="uk-modal-close-default" type="button" uk-close></button>
          <h4 class="uk-modal-title">Opciones de evidencia</h4>
          <div data-role="mobile-actions-slot"></div>
        </div>
      </div>
    `;

    const modalElement = this.querySelector('#timeline-evidence-actions-modal');
    if (modalElement && window.UIkit?.modal) {
      this._mobileModalInstance = window.UIkit.modal(modalElement);
    } else {
      this._mobileModalInstance = null;
    }

    this._bindTimelineEvents();
  }

  _buildActionsHtml(item) {
    const hasIdrc = Boolean(String(item?.idrc || '').trim());
    const canResend = this._canResend(item);
    const pdfUrl = hasIdrc
      ? `https://app.movilizandome.net/modules/rEvidencia/Reporte_pdf.php?id=${encodeURIComponent(String(item.idrc || '').trim())}`
      : '';

    return `
      <div class="uk-flex uk-flex-column uk-grid-small" uk-grid>
        ${hasIdrc ? `
          <div class="uk-width-1-1">
            <a class="uk-link-text uk-text-default" href="${pdfUrl}" target="_blank" rel="noopener noreferrer">
              <div>
                <span uk-icon="icon: file-pdf; ratio: 2"></span>
                <span class="uk-text-primary">Descargar evidencia en PDF</span>
              </div>
            </a>
          </div>
        ` : ''}
        ${canResend ? `
          <div class="uk-width-1-1">
            <button
              type="button"
              class="uk-button uk-button-danger uk-button-small"
              data-action="resend-evidence"
              data-evidence-index="${item.evidenceIndex}">
              Reenviar informacion
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  _bindTimelineEvents() {
    this._bindResendButtons();
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

    const evidenceIndex = Number.parseInt(card.getAttribute('data-evidence-index') || '-1', 10);
    const item = this._items.find((entry) => entry.evidenceIndex === evidenceIndex);
    if (!item) {
      return;
    }

    this._selectedItem = item;
    const slot = this.querySelector('[data-role="mobile-actions-slot"]');
    if (slot) {
      slot.innerHTML = this._buildActionsHtml(item);
    }
    this._bindResendButtons();
    this._mobileModalInstance?.show();
  }

  _bindResendButtons() {
    this.querySelectorAll('[data-action="resend-evidence"]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this._isResending) {
          return;
        }

        const evidenceIndex = Number.parseInt(button.getAttribute('data-evidence-index') || '-1', 10);
        const item = this._items.find((entry) => entry.evidenceIndex === evidenceIndex);
        if (!item || !this._canResend(item)) {
          return;
        }

        await this._resendEvidence(item);
      });
    });
  }

  _canResend(item) {
    const normalized = String(item?.status || '').toLowerCase();
    return normalized.includes('no enviada') || normalized.includes('error');
  }

  async _resendEvidence(item) {
    const payload = item?.captured;
    if (!payload || typeof payload !== 'object') {
      window.UIkit?.notification?.({
        message: 'No hay informacion capturada para reenviar.',
        status: 'warning'
      });
      return;
    }

    this._isResending = true;
    try {
      const response = await saveTextEvidence(payload);
      const idrc = String(response?.data?.IDRC || '').trim();
      const wasSent = Boolean(response?.success) && idrc !== '';
      if (!wasSent) {
        throw new Error(String(response?.message || 'No fue posible reenviar la evidencia.'));
      }

      await updateEvidenceRecordAt(item.evidenceIndex, {
        ESTATUS: 'ENVIADA',
        IDRC: idrc,
        FECHA_ENVIO: new Date().toISOString()
      });

      await this._loadEvidenceItems();
      window.UIkit?.notification?.({
        message: 'Evidencia reenviada correctamente.',
        status: 'success'
      });
    } catch (error) {
      window.UIkit?.notification?.({
        message: error?.message || 'No fue posible reenviar la evidencia.',
        status: 'danger'
      });
    } finally {
      this._isResending = false;
      this._mobileModalInstance?.hide();
    }
  }
}

customElements.define('forms-timeline-component', FormsTimelineComponent);

export default FormsTimelineComponent;
