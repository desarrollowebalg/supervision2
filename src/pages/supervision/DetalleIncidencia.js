import { renderInicioLayout } from '../inicio-layout.js';
import { navigate } from '../../core/router.js';
import '../../components/userAvatar.js';
import { getEvidenceReport } from '../../core/services/apis-me/reports.service.js';

export default class DetalleIncidencia {
  static instancia = null;
  static EVIDENCE_IMAGE_BASE_URL = 'https://imagenes.movilizandome.net/';

  constructor(navigationContext = {}) {
    if (DetalleIncidencia.instancia) {
      DetalleIncidencia.instancia.navigationContext = navigationContext;
      return DetalleIncidencia.instancia;
    }

    this.navigationContext = navigationContext;
    this.handleBackClick = null;
    this.requestToken = 0;
    this.pendingEvidenceId = '';
    this.evidenceState = {
      loading: false,
      error: '',
      record: null
    };
    DetalleIncidencia.instancia = this;
  }

  render(container, params = {}) {
    this.ensureStyles();
    this.container = container;
    this.params = params;
    const ide = String(params?.ide || '').trim();
    const idi = String(params?.idi || '0').trim() || '0';
    const previousLabel = this.navigationContext?.state?.previousLabel || 'Supervisión';
    this.pendingEvidenceId = ide;

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="uk-section uk-section-small uk-padding-remove-top">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-card">
            <div class="uk-margin-small-bottom">
              <button
                class="uk-button uk-button-default uk-button-small uk-border-rounded"
                type="button"
                data-detail-back="true"
              >
                <span uk-icon="icon: arrow-left; ratio: 0.85"></span>
                Volver a ${this.escapeHtml(previousLabel)}
              </button>
            </div>
            <p class="uk-text-meta uk-margin-remove-bottom">Seguimiento</p>
            <h1 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">
              Seguimiento
            </h1>
            <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
              IDE: ${this.escapeHtml(ide || 'N/D')} | IDI: ${this.escapeHtml(idi)}
            </p>
            <div class="uk-grid-large uk-child-width-1-1 uk-grid-match uk-margin-top" uk-grid>
              <div class="uk-width-3-5@m">
                <section class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-panel detail-incidencia-panel--evidence">
                  <div data-evidence-panel="true"></div>
                </section>
              </div>
              <div class="uk-width-2-5@m">
                <section class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-panel">
                  <p class="uk-text-meta uk-margin-remove-bottom">Atención de la incidencia</p>
                  <div class="detail-incidencia-panel__placeholder"></div>
                </section>
              </div>
            </div>
          </div>
        </section>
      `
    });

    container.querySelector('.inicio-padding-card > h1.uk-card-title')?.remove();
    this.bindEvents();
    this.loadEvidence(ide);
  }

  bindEvents() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    if (!backButton) {
      return;
    }

    if (this.handleBackClick) {
      backButton.removeEventListener('click', this.handleBackClick);
    }

    this.handleBackClick = () => {
      const fallbackRoute = this.navigationContext?.state?.from || '/supervision';
      const hasInternalOrigin = Boolean(this.navigationContext?.state?.from);

      if (hasInternalOrigin && window.history.length > 1) {
        window.history.back();
        return;
      }

      navigate(fallbackRoute, { replace: true });
    };

    backButton.addEventListener('click', this.handleBackClick);
  }

  async loadEvidence(ide) {
    const safeIde = String(ide || '').trim();
    if (!safeIde) {
      this.evidenceState = {
        loading: false,
        error: 'No se recibió un identificador de evidencia válido.',
        record: null
      };
      this.renderEvidencePanel();
      return;
    }

    const currentToken = ++this.requestToken;
    this.evidenceState = {
      loading: true,
      error: '',
      record: null
    };
    this.renderEvidencePanel();

    try {
      const evidenceRecord = await getEvidenceReport(safeIde);
      if (currentToken !== this.requestToken || this.pendingEvidenceId !== safeIde) {
        return;
      }

      this.evidenceState = {
        loading: false,
        error: evidenceRecord?.header ? '' : 'No se encontró información para la evidencia solicitada.',
        record: evidenceRecord?.header ? evidenceRecord : null
      };
    } catch (error) {
      if (currentToken !== this.requestToken) {
        return;
      }

      this.evidenceState = {
        loading: false,
        error: error instanceof Error ? error.message : 'No fue posible cargar la evidencia.',
        record: null
      };
    }

    this.renderEvidencePanel();
  }

  renderEvidencePanel() {
    const evidenceNode = this.container?.querySelector('[data-evidence-panel="true"]');
    if (!evidenceNode) {
      return;
    }

    if (this.evidenceState.loading) {
      evidenceNode.innerHTML = `
        <div class="uk-flex uk-flex-center uk-flex-middle uk-padding detail-incidencia-panel__state">
          <div class="uk-text-center">
            <div uk-spinner></div>
            <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">Cargando evidencia...</p>
          </div>
        </div>
      `;
      return;
    }

    if (this.evidenceState.error) {
      evidenceNode.innerHTML = `
        <div class="uk-alert-danger uk-border-rounded uk-margin-remove" uk-alert>
          <p class="uk-margin-remove">${this.escapeHtml(this.evidenceState.error)}</p>
        </div>
      `;
      return;
    }

    const header = this.evidenceState.record?.header;
    const detail = Array.isArray(this.evidenceState.record?.detail) ? this.evidenceState.record.detail : [];
    if (!header) {
      evidenceNode.innerHTML = '';
      return;
    }

    const formattedDateTime = this.formatReceptionDateTime(header.FECHA_RECEPCION);
    const observationText = this.formatObservationText(this.getDetailAnswer(detail, 'OBS'));
    const photoFilename = this.getDetailAnswer(detail, 'FT1');
    const fullName = header.NOMBRE_COMPLETO || 'Usuario sin nombre';
    const userName = header.USUARIO || '';
    const locationText = [header.DESCRIPCION, header.ITEM_NUMBER].filter(Boolean).join(' / ') || 'Sin ubicacion';

    evidenceNode.innerHTML = `
      <div class="detail-evidence-stack">
        <section class="detail-evidence-section">
          <div class="detail-evidence-title-row">
            <span class="detail-evidence-icon" uk-icon="icon: calendar"></span>
            <div>
              <p class="uk-text-meta uk-margin-remove-bottom">Fecha y hora</p>
              <p class="uk-margin-remove detail-evidence-value detail-evidence-value--inline">
                ${this.escapeHtml(formattedDateTime.date)} ${this.escapeHtml(formattedDateTime.time)}
              </p>
            </div>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-evidence-user-card">
            <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
              <div class="uk-width-auto">
                <user-avatar-enhanced
                  url="${this.escapeHtml(header.URL_FOTO_PERFIL)}"
                  nombre="${this.escapeHtml(fullName)}"
                  size="56px"
                  shape="circle"
                ></user-avatar-enhanced>
              </div>
              <div class="uk-width-expand">
                <p class="uk-text-bold uk-margin-remove-bottom">${this.escapeHtml(fullName)}</p>
                <p class="uk-text-meta uk-margin-remove-top uk-margin-remove-bottom">${this.escapeHtml(userName || header.COD_USER)}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="detail-evidence-title-row">
            <span class="detail-evidence-icon" uk-icon="icon: location"></span>
            <div>
              <p class="uk-text-meta uk-margin-remove-bottom">Ubicación / Equipo</p>
              <p class="uk-margin-remove detail-evidence-value">${this.escapeHtml(locationText)}</p>
            </div>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="detail-evidence-title-row detail-evidence-title-row--section">
            <span class="detail-evidence-icon" uk-icon="icon: file-text"></span>
            <h2 class="uk-h4 uk-margin-remove">Descripción</h2>
          </div>
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-evidence-description-card">
            <p class="uk-margin-remove detail-evidence-description">${this.escapeHtml(observationText || 'Sin descripcion disponible.')}</p>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="detail-evidence-title-row detail-evidence-title-row--section">
            <span class="detail-evidence-icon" uk-icon="icon: image"></span>
            <h2 class="uk-h4 uk-margin-remove">Fotografías</h2>
          </div>
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-evidence-photo-card">
            ${this.renderPhotoGallery(photoFilename)}
          </div>
        </section>
      </div>
    `;
  }

  destroy() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    if (backButton && this.handleBackClick) {
      backButton.removeEventListener('click', this.handleBackClick);
    }
    this.handleBackClick = null;
    this.requestToken += 1;
  }

  escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  getDetailAnswer(detail, itemNumber) {
    const safeItemNumber = String(itemNumber || '').trim().toUpperCase();
    const matchedEntry = (Array.isArray(detail) ? detail : []).find((entry) => (
      String(entry?.ITEM_NUMBER || '').trim().toUpperCase() === safeItemNumber
    ));

    return String(matchedEntry?.RESPUESTA || '').trim();
  }

  formatObservationText(value) {
    const safeValue = String(value || '').trim();
    if (!safeValue) {
      return '';
    }

    return safeValue.replace(/\s+(?=\d+-)/g, '\n');
  }

  formatReceptionDateTime(value) {
    const safeValue = String(value || '').trim();
    const match = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
    if (!match) {
      return {
        date: safeValue || 'N/D',
        time: ''
      };
    }

    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = match;
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`
    };
  }

  buildEvidenceImageUrl(filename) {
    const safeFilename = String(filename || '').trim().replace(/^\/+/, '');
    if (!safeFilename) {
      return '';
    }

    return `${DetalleIncidencia.EVIDENCE_IMAGE_BASE_URL}${encodeURI(safeFilename)}`;
  }

  renderPhotoGallery(filename) {
    const safeFilename = String(filename || '').trim();
    if (!safeFilename) {
      return '<p class="uk-margin-remove detail-evidence-photo-name">Sin fotografia disponible.</p>';
    }

    const imageUrl = this.buildEvidenceImageUrl(safeFilename);
    const escapedUrl = this.escapeHtml(imageUrl);
    const escapedFilename = this.escapeHtml(safeFilename);

    return `
      <div class="detail-evidence-photo-gallery" uk-lightbox="animation: slide">
        <div>
          <a class="uk-inline detail-evidence-photo-link" href="${escapedUrl}" data-caption="${escapedFilename}">
            <img
              src="${escapedUrl}"
              class="uk-border-rounded detail-evidence-photo-image"
              width="1800"
              height="1200"
              alt="${escapedFilename}"
              loading="lazy"
            >
          </a>
        </div>
      </div>
    `;
  }

  ensureStyles() {
    if (document.getElementById('detalle-incidencia-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'detalle-incidencia-styles';
    style.textContent = `
      .detail-incidencia-card {
        background: var(--app-surface-elevated);
        border: 1px solid var(--app-border);
        color: var(--app-text);
        box-shadow: var(--app-shadow-soft);
      }

      .detail-incidencia-panel {
        min-height: 100%;
        background: var(--app-surface-elevated);
        border: 1px solid var(--app-border);
        color: var(--app-text);
      }

      .detail-incidencia-panel--evidence {
        background: var(--app-surface);
        color: var(--app-text);
      }

      .detail-incidencia-panel__state {
        min-height: 20rem;
      }

      .detail-incidencia-panel__placeholder {
        min-height: 24rem;
      }

      .detail-evidence-stack {
        display: grid;
        gap: 1.5rem;
      }

      .detail-evidence-section {
        display: grid;
        gap: 0.85rem;
      }

      .detail-evidence-title-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .detail-evidence-title-row--section {
        align-items: center;
      }

      .detail-evidence-icon {
        color: var(--app-primary, #1e87f0);
        margin-top: 0.1rem;
      }

      .detail-evidence-value {
        color: var(--app-text);
        font-size: 1.02rem;
        font-weight: 600;
      }

      .detail-evidence-value--inline {
        font-size: 1.18rem;
      }

      .detail-evidence-user-card,
      .detail-evidence-description-card,
      .detail-evidence-photo-card {
        background: var(--app-surface-elevated);
        border: 1px solid var(--app-border);
        color: var(--app-text);
        box-shadow: none;
      }

      .detail-incidencia-card .uk-card-title,
      .detail-incidencia-card .uk-h3,
      .detail-incidencia-card .uk-h4,
      .detail-incidencia-card .uk-text-bold,
      .detail-incidencia-card .uk-button {
        color: var(--app-text);
      }

      .detail-incidencia-card .uk-text-meta,
      .detail-evidence-user-card .uk-text-meta,
      .detail-evidence-title-row .uk-text-meta {
        color: var(--app-text-muted) !important;
      }

      .detail-evidence-description {
        white-space: pre-line;
        line-height: 1.65;
      }

      .detail-evidence-photo-name {
        word-break: break-word;
        color: var(--app-text);
      }

      .detail-evidence-photo-gallery,
      .detail-evidence-photo-link {
        display: block;
      }

      .detail-evidence-photo-link {
        overflow: hidden;
      }

      .detail-evidence-photo-image {
        display: block;
        width: 100%;
        max-width: 100%;
        height: auto;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        object-fit: cover;
        transition: transform 0.2s ease;
      }

      .detail-evidence-photo-link:hover .detail-evidence-photo-image,
      .detail-evidence-photo-link:focus-visible .detail-evidence-photo-image {
        transform: scale(1.01);
      }

      @media (max-width: 959px) {
        .detail-evidence-value--inline {
          font-size: 1.05rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
