import { renderInicioLayout } from '../inicio-layout.js';
import { navigate } from '../../core/router.js';
import { getUserState } from '../../core/store.js';
import { storageService } from '../../core/services/storage.service.js';
import catalogIndexedDbService from '../../core/services/catalog-indexeddb.service.js';
import { getSessionCatalogContext } from '../../core/services/apis-me/session-catalog-context.service.js';
import {
  getIncidenciasByDate,
  getIncidenciasDetalle
} from '../../core/services/apis-me/incidencias.service.js';
import '../../components/userAvatar.js';
import '../../components/comentarios/CommentBox.js';
import '../../components/comentarios/comment-history-item.js';
import '../../components/historial/historial-component.js';
import {
  getEvidenceReport,
  getHistoryReport,
  getIncidentReport
} from '../../core/services/apis-me/reports.service.js';
import {
  markEvidenceAsReadAndCreateIncident,
  updateIncidentAction,
  updateIncidentComment
} from '../../core/services/apis-me/supervision.service.js';

export default class DetalleIncidencia {
  static instancia = null;
  static EVIDENCE_IMAGE_BASE_URL = 'https://imagenes.movilizandome.net/';
  static COMMENT_INCIDENT_TYPE = 1;
  static INCIDENT_STATUS_META = {
    0: { code: 'L', label: 'Leída', tone: 'neutral', terminal: false, commentsLocked: false },
    1: { code: 'A', label: 'Atendida', tone: 'info', terminal: false, commentsLocked: false },
    2: { code: 'C', label: 'Cerrada', tone: 'muted', terminal: true, commentsLocked: true },
    3: { code: 'AP', label: 'Aprobada', tone: 'success', terminal: false, commentsLocked: true },
    4: { code: 'R', label: 'Rechazada', tone: 'danger', terminal: true, commentsLocked: true },
    5: { code: 'RE', label: 'Reasignada', tone: 'warning', terminal: false, commentsLocked: false },
    '-1': { code: 'NL_NVL', label: 'No leída *', tone: 'warning', terminal: false, commentsLocked: false }
  };
  static ATTEND_INCIDENT_ACTIONS = [
    { value: '3', label: 'Aprobar' },
    { value: '4', label: 'Rechazar' },
    { value: '2', label: 'Cerrar' }
  ];

  constructor(navigationContext = {}) {
    if (DetalleIncidencia.instancia) {
      DetalleIncidencia.instancia.navigationContext = navigationContext;
      return DetalleIncidencia.instancia;
    }

    this.navigationContext = navigationContext;
    this.handleBackClick = null;
    this.handleCommentSaved = null;
    this.handleAttendFormSubmit = null;
    this.handleAttendModalShown = null;
    this.handleAttendModalHidden = null;
    this.handleAttendSubmitClick = null;
    this.handlePdfClick = null;
    this.requestToken = 0;
    this.pendingEvidenceId = '';
    this.pendingIncidentId = '';
    this.isCreatingIncident = false;
    this.isSubmittingAttention = false;
    this.incidentCreationError = '';
    this.historyRecordsCache = [];
    this.incidentState = {
      loading: false,
      error: '',
      record: null
    };
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
    const commentUser = this.getCommentUserContext();
    const isPendingIncident = this.isPendingIncidentId(idi);
    const historyTitle = isPendingIncident ? 'Generando seguimiento' : `Seguimiento #${idi || 'N/D'}`;
    this.pendingEvidenceId = ide;
    this.pendingIncidentId = idi;
    this.isCreatingIncident = false;
    this.incidentCreationError = '';
    this.historyRecordsCache = [];
    this.incidentState = {
      loading: false,
      error: '',
      record: null
    };

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
              <button
                class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-margin-small-left"
                type="button"
                data-attend-incident-trigger="true"
                ${isPendingIncident ? 'disabled aria-disabled="true"' : 'uk-toggle="target: #detalle-incidencia-attend-modal"'}
              >
                <span uk-icon="icon: check; ratio: 0.85"></span>
                Atender incidencia
              </button>
              <button
                class="uk-button uk-button-default uk-button-small uk-border-rounded uk-margin-small-left"
                type="button"
                data-incident-pdf-trigger="true"
                ${isPendingIncident ? 'disabled aria-disabled="true"' : ''}
              >
                <span uk-icon="icon: file-pdf; ratio: 0.85"></span>
                PDF
              </button>
              <button
                class="uk-button uk-button-default uk-button-small uk-border-rounded uk-margin-small-left"
                type="button"
                ${isPendingIncident ? 'disabled aria-disabled="true"' : 'uk-toggle="target: #detalle-incidencia-history-offcanvas"'}
              >
                <span uk-icon="icon: history; ratio: 0.85"></span>
                Ver historial
              </button>
            </div>
            <div class="detail-incidencia-title-row uk-margin-small-top">
              <h1 class="uk-card-title uk-margin-remove-bottom" data-incident-header-title="true">
                ${isPendingIncident ? 'Generando incidencia...' : `Seguimiento: ${this.escapeHtml(idi || '0')}`}
              </h1>
              <span class="uk-label uk-hidden detail-incidencia-status-badge" data-incident-status-badge="true"></span>
            </div>
            <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom ${isPendingIncident ? '' : 'uk-hidden'}">
              Estamos marcando la evidencia como leída y creando el seguimiento.
            </p>
            <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
              Origen: ${this.escapeHtml(ide || 'N/D')} | IDI: ${this.escapeHtml(idi || '0')}
            </p>
            <div class="uk-grid-large uk-child-width-1-1 uk-grid-match uk-margin-top" uk-grid>
              <div class="uk-width-3-5@m">
                <section class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-panel detail-incidencia-panel--evidence">
                  <div data-evidence-panel="true"></div>
                </section>
              </div>
              <div class="uk-width-2-5@m padding-elemento-derecho">
                <section class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-panel detail-incidencia-panel--commentary">
                  <div class="detail-incidencia-commentary">
                    <div class="detail-incidencia-commentary__header">                      
                      <h2 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">Comentarios</h2>
                    </div>
                    <div data-commentary-panel="true">
                      ${this.renderCommentaryContent(isPendingIncident, commentUser)}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
        <div id="detalle-incidencia-history-offcanvas" uk-offcanvas="flip: true; overlay: true">
          <div class="uk-offcanvas-bar detail-incidencia-offcanvas">
            <button class="uk-offcanvas-close" type="button" uk-close></button>
            <div class="detail-incidencia-offcanvas__header">              
              <h2 class="uk-h3 uk-margin-small-top uk-margin-remove-bottom">${this.escapeHtml(historyTitle)}</h2>
            </div>
            <div class="detail-incidencia-offcanvas__content" data-history-offcanvas-content="true">
              <div class="uk-flex uk-flex-center uk-flex-middle uk-padding detail-incidencia-panel__state">
                <div class="uk-text-center">
                  <div uk-spinner></div>
                  <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">Preparando historial...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="detalle-incidencia-attend-modal" uk-modal>
          <div class="uk-modal-dialog uk-modal-body uk-border-rounded detail-incidencia-attend-modal">
            <button class="uk-modal-close-default" type="button" uk-close aria-label="Cerrar atencion de incidencia"></button>
            <h3 class="uk-modal-title detail-incidencia-attend-modal__title">Atender incidencia</h3>
            <form data-attend-incident-form="true">
              <div class="detail-incidencia-attend-modal__content">
                <div data-attend-incident-summary="true">
                  ${this.renderAttentionSummary()}
                </div>
                <div class="detail-incidencia-attend-modal__field">
                  <h4 class="uk-h5 uk-margin-small-bottom">Comentario de atención</h4>
                  <comment-box
                    open
                    hide-actions
                    data-attend-comment-box="true"
                    user-id="${this.escapeHtml(commentUser.userId)}"
                    user-name="${this.escapeHtml(commentUser.userName)}"
                    nickname="${this.escapeHtml(commentUser.nickname)}"
                    user-photo="${this.escapeHtml(commentUser.userPhoto)}"
                  ></comment-box>
                </div>
                <div class="detail-incidencia-attend-modal__field">
                  <label class="uk-form-label" for="detalle-incidencia-attend-tip">Acción a realizar</label>
                  <div class="uk-form-controls">
                    <select
                      id="detalle-incidencia-attend-tip"
                      class="uk-select uk-border-rounded"
                      data-attend-incident-tip="true"
                    >
                      <option value="">Selecciona una opción</option>
                      ${DetalleIncidencia.ATTEND_INCIDENT_ACTIONS.map((action) => `
                        <option value="${this.escapeHtml(action.value)}">${this.escapeHtml(action.label)}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
                <div
                  class="uk-alert-danger uk-border-rounded uk-margin-remove uk-hidden detail-incidencia-attend-modal__error"
                  uk-alert
                  data-attend-incident-error="true"
                >
                  <p class="uk-margin-remove"></p>
                </div>
              </div>
              <div class="uk-flex uk-flex-right uk-flex-middle uk-grid-small uk-margin-top" uk-grid>
                <div class="uk-width-auto">
                  <button class="uk-button uk-button-default uk-border-rounded uk-modal-close" type="button">
                    Cancelar
                  </button>
                </div>
                <div class="uk-width-auto">
                  <button
                    class="uk-button uk-button-primary uk-border-rounded"
                    type="submit"
                    data-attend-incident-submit="true"
                  >
                    Guardar y atender incidencia
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      `
    });

    container.querySelector('.inicio-padding-card > h1.uk-card-title')?.remove();
    this.bindEvents();
    this.renderHeaderState();
    if (isPendingIncident) {
      this.renderHistoryOffcanvas();
    }
    this.initializeDetailFlow(ide, idi);
  }

  bindEvents() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    const attendForm = this.container?.querySelector('[data-attend-incident-form="true"]');
    const attendSubmitButton = this.container?.querySelector('[data-attend-incident-submit="true"]');
    const attendModal = this.getAttentionModalElement();
    const pdfButton = this.container?.querySelector('[data-incident-pdf-trigger="true"]');
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

    if (pdfButton) {
      if (this.handlePdfClick) {
        pdfButton.removeEventListener('click', this.handlePdfClick);
      }

      this.handlePdfClick = () => {
        this.openIncidentPdfReport();
      };

      pdfButton.addEventListener('click', this.handlePdfClick);
    }

    if (this.handleCommentSaved) {
      this.container?.removeEventListener('comment-saved', this.handleCommentSaved);
    }

    this.handleCommentSaved = (event) => {
      this.handleCommentSaveRequest(event);
    };

    this.container?.addEventListener('comment-saved', this.handleCommentSaved);

    if (attendForm) {
      if (this.handleAttendFormSubmit) {
        attendForm.removeEventListener('submit', this.handleAttendFormSubmit);
      }

      this.handleAttendFormSubmit = (event) => {
        event.preventDefault();
        this.handleAttendIncidentSubmit();
      };

      attendForm.addEventListener('submit', this.handleAttendFormSubmit);
    }

    if (attendSubmitButton && attendForm) {
      if (this.handleAttendSubmitClick) {
        attendSubmitButton.removeEventListener('click', this.handleAttendSubmitClick);
      }

      this.handleAttendSubmitClick = (event) => {
        event.preventDefault();
        attendForm.requestSubmit();
      };

      attendSubmitButton.addEventListener('click', this.handleAttendSubmitClick);
    }

    if (attendModal) {
      if (this.handleAttendModalShown) {
        attendModal.removeEventListener('shown', this.handleAttendModalShown);
      }

      if (this.handleAttendModalHidden) {
        attendModal.removeEventListener('hidden', this.handleAttendModalHidden);
      }

      this.handleAttendModalShown = () => {
        this.prepareAttentionModalForInput();
      };

      this.handleAttendModalHidden = () => {
        this.resetAttentionModal();
      };

      attendModal.addEventListener('shown', this.handleAttendModalShown);
      attendModal.addEventListener('hidden', this.handleAttendModalHidden);
    }
  }

  async initializeDetailFlow(ide, idi) {
    await this.loadEvidence(ide);

    if (this.pendingEvidenceId !== String(ide || '').trim()) {
      return;
    }

    if (this.isPendingIncidentId(idi)) {
      await this.createIncidentFromEvidence();
      return;
    }

    await Promise.all([
      this.loadIncident(idi),
      this.refreshHistoryViews()
    ]);
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
    return this.evidenceState.record;
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
      this.renderAttentionModalState();
      this.renderHeaderState();
      return;
    }

    const header = this.evidenceState.record?.header;
    const detail = Array.isArray(this.evidenceState.record?.detail) ? this.evidenceState.record.detail : [];
    if (!header) {
      evidenceNode.innerHTML = '';
      this.renderHeaderState();
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
              <p class="uk-text-meta uk-margin-remove-bottom uk-display-inline">Fecha y hora</p>
              <p class="uk-margin-remove detail-evidence-value detail-evidence-value--inline">
                ${this.escapeHtml(formattedDateTime.date)} ${this.escapeHtml(formattedDateTime.time)}
              </p>
            </div>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-remove-top uk-padding-remove-bottom detail-evidence-user-card">
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

        <section class="detail-evidence-section uk-margin">
          <div class="detail-evidence-title-row">
            <span class="detail-evidence-icon" uk-icon="icon: location"></span>
            <div>
              <p class="uk-text-meta uk-margin-remove-bottom">Ubicación / Equipo</p>
              <p class="uk-margin-remove detail-evidence-value">${this.escapeHtml(locationText)}</p>
            </div>
          </div>
        </section>

        <section class="detail-evidence-section uk-margin-bottom">
          <div class="detail-evidence-title-row detail-evidence-title-row--section">
            <span class="detail-evidence-icon" uk-icon="icon: file-text"></span>
            <h2 class="uk-h4 uk-margin-remove">Descripción</h2>
          </div>
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-remove-top uk-padding-remove-bottom detail-evidence-description-card">
            <p class="uk-margin-remove detail-evidence-description">${this.escapeHtml(observationText || 'Sin descripcion disponible.')}</p>
          </div>
        </section>

        <section class="detail-evidence-section">
          <div class="detail-evidence-title-row detail-evidence-title-row--section">
            <span class="detail-evidence-icon" uk-icon="icon: image"></span>
            <h2 class="uk-h4 uk-margin-remove">Fotografías</h2>
          </div>
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-evidence-photo-card uk-padding-remove-top uk-padding-remove-bottom">
            ${this.renderPhotoGallery(photoFilename)}
          </div>
        </section>
      </div>
    `;
    this.renderAttentionModalState();
    this.renderHeaderState();
  }

  destroy() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    const attendForm = this.container?.querySelector('[data-attend-incident-form="true"]');
    const attendSubmitButton = this.container?.querySelector('[data-attend-incident-submit="true"]');
    const attendModal = this.getAttentionModalElement();
    const pdfButton = this.container?.querySelector('[data-incident-pdf-trigger="true"]');
    if (backButton && this.handleBackClick) {
      backButton.removeEventListener('click', this.handleBackClick);
    }
    if (pdfButton && this.handlePdfClick) {
      pdfButton.removeEventListener('click', this.handlePdfClick);
    }
    if (attendForm && this.handleAttendFormSubmit) {
      attendForm.removeEventListener('submit', this.handleAttendFormSubmit);
    }
    if (attendSubmitButton && this.handleAttendSubmitClick) {
      attendSubmitButton.removeEventListener('click', this.handleAttendSubmitClick);
    }
    if (attendModal && this.handleAttendModalShown) {
      attendModal.removeEventListener('shown', this.handleAttendModalShown);
    }
    if (attendModal && this.handleAttendModalHidden) {
      attendModal.removeEventListener('hidden', this.handleAttendModalHidden);
    }
    if (this.container && this.handleCommentSaved) {
      this.container.removeEventListener('comment-saved', this.handleCommentSaved);
    }
    this.handleBackClick = null;
    this.handlePdfClick = null;
    this.handleAttendFormSubmit = null;
    this.handleAttendModalShown = null;
    this.handleAttendModalHidden = null;
    this.handleAttendSubmitClick = null;
    this.handleCommentSaved = null;
    this.requestToken += 1;
  }

  async refreshHistoryViews() {
    const records = await this.buildHistoryRecords();
    this.historyRecordsCache = records;
    this.renderHistoryOffcanvas(records);
    this.renderCommentHistory(records);
  }

  async loadIncident(incidentId = this.pendingIncidentId) {
    const safeIncidentId = String(incidentId || '').trim();
    if (!/^\d+$/.test(safeIncidentId) || this.isPendingIncidentId(safeIncidentId)) {
      this.incidentState = {
        loading: false,
        error: '',
        record: null
      };
      this.renderHeaderState();
      this.renderCommentaryPanelState();
      return null;
    }

    this.incidentState = {
      loading: true,
      error: '',
      record: this.incidentState.record
    };
    this.renderHeaderState();

    try {
      const incidentRecord = await getIncidentReport(safeIncidentId);
      this.incidentState = {
        loading: false,
        error: '',
        record: incidentRecord
      };
    } catch (error) {
      this.incidentState = {
        loading: false,
        error: error instanceof Error ? error.message : 'No fue posible cargar la incidencia.',
        record: null
      };
    }

    this.renderHeaderState();
    this.renderCommentaryPanelState();
    return this.incidentState.record;
  }

  renderHistoryOffcanvas(records = null) {
    const slot = this.container?.querySelector('[data-history-offcanvas-content="true"]');
    if (!slot) {
      return;
    }

    if (this.isPendingIncidentId(this.pendingIncidentId)) {
      const pendingMessage = this.isCreatingIncident
        ? 'Estamos generando la incidencia y habilitaremos el historial en cuanto termine el proceso.'
        : (this.incidentCreationError || 'El historial se habilitara cuando la incidencia termine de generarse.');
      slot.innerHTML = `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-history-empty">
          <p class="uk-margin-remove">
            ${this.escapeHtml(pendingMessage)}
          </p>
        </div>
      `;
      return;
    }

    const historyRecords = Array.isArray(records)
      ? records.filter((entry) => !this.isCommentStatus(entry.status))
      : [];
    const commentRecords = Array.isArray(records)
      ? records.filter((entry) => this.isCommentStatus(entry.status))
      : [];

    if (!Array.isArray(records)) {
      slot.innerHTML = `
        <div class="uk-flex uk-flex-center uk-flex-middle uk-padding detail-incidencia-panel__state">
          <div class="uk-text-center">
            <div uk-spinner></div>
            <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">Cargando historial...</p>
          </div>
        </div>
      `;
      return;
    }

    slot.innerHTML = `
      <div class="detail-incidencia-history-panel">
        <section class="detail-incidencia-history-group">
          <div class="detail-incidencia-history-group__header">            
            <h3 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">Historial completo</h3>
          </div>
          <div class="detail-incidencia-history-group__body">
            ${this.renderHistoryEntries(historyRecords, 'No hay movimientos de historial para mostrar.')}
          </div>
        </section>
        ${commentRecords.length ? `
          <section class="detail-incidencia-history-group">
            <div class="detail-incidencia-history-group__toggle">
              <a
                href="#"
                class="uk-link-reset detail-incidencia-history-toggle-link"
                uk-toggle="target: #detalle-incidencia-history-comments; cls: uk-hidden"
              >
                Mostrar comentarios de atencion
              </a>
            </div>
            <div id="detalle-incidencia-history-comments" class="uk-hidden">
              <div class="detail-incidencia-history-group__header">
                <h3 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">Comentarios de atencion</h3>
              </div>
              <div class="detail-incidencia-comments-list">
                ${commentRecords.map((entry) => {
                  const { date, time } = this.splitDateTime(entry.timestamp);
                  return `
                    <comment-history-item
                      fecha="${this.escapeHtml(date)}"
                      hora="${this.escapeHtml(time)}"
                      usuario="${this.escapeHtml(entry.username)}"
                      nombre-completo="${this.escapeHtml(entry.fullName || entry.username || 'Usuario')}"
                      foto-usuario="${this.escapeHtml(entry.photoUrl)}"
                      comentario="${this.escapeHtml(entry.comment)}"
                      variant="timeline"
                    ></comment-history-item>
                  `;
                }).join('')}
              </div>
            </div>
          </section>
        ` : ''}
      </div>
    `;
  }

  async buildHistoryRecords() {
    const usersByUsername = await this.getUsersCatalogMap();
    const fallbackUser = this.getCommentUserContext();
    const historyEntries = await this.fetchHistoryEntries();

    return historyEntries
      .map((entry) => {
        const normalizedUserName = String(entry?.USUARIO || '').trim();
        const catalogUser = usersByUsername.get(normalizedUserName.toLowerCase()) || null;
        const fullName = String(
          catalogUser?.NOMBRE_COMPLETO ||
          catalogUser?.nombre_completo ||
          (normalizedUserName.toLowerCase() === String(fallbackUser.nickname || '').toLowerCase() ? fallbackUser.userName : normalizedUserName)
        ).trim();
        const photoUrl = String(
          catalogUser?.URL_FOTO_PERFIL ||
          catalogUser?.foto_perfil ||
          (normalizedUserName.toLowerCase() === String(fallbackUser.nickname || '').toLowerCase() ? fallbackUser.userPhoto : '')
        ).trim();

        return {
          id: Number(entry?.ID ?? 0),
          idInc: Number(entry?.ID_INC ?? 0),
          status: String(entry?.ESTATUS || '').trim(),
          username: normalizedUserName,
          fullName,
          photoUrl,
          comment: String(entry?.COMENTARIOS || '').trim(),
          timestamp: String(entry?.FECHA || '').trim()
        };
      })
      .sort((left, right) => this.toTimestamp(right.timestamp) - this.toTimestamp(left.timestamp));
  }

  async fetchHistoryEntries() {
    const safeIncidentId = String(this.pendingIncidentId || '').trim();
    if (!/^\d+$/.test(safeIncidentId)) {
      return [];
    }

    try {
      return await getHistoryReport(safeIncidentId);
    } catch (error) {
      console.warn('No fue posible consultar el historial de la incidencia.', error);
      return [];
    }
  }

  async getUsersCatalogMap() {
    try {
      const { contextKey } = getSessionCatalogContext();
      const catalog = await catalogIndexedDbService.getCatalog({
        catalogKey: 'usuarios',
        contextKey
      });
      const rows = Array.isArray(catalog?.data) ? catalog.data : [];
      return rows.reduce((map, entry) => {
        const username = String(entry?.USUARIO || entry?.usuario || '').trim().toLowerCase();
        if (username) {
          map.set(username, entry);
        }
        return map;
      }, new Map());
    } catch (error) {
      console.warn('No fue posible leer el catalogo de usuarios para el historial.', error);
      return new Map();
    }
  }

  renderHistoryEntries(entries = [], emptyMessage = '') {
    if (!entries.length) {
      return `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-history-empty">
          <p class="uk-margin-remove">${this.escapeHtml(emptyMessage)}</p>
        </div>
      `;
    }

    return entries.map((entry) => {
      const { date, time } = this.splitDateTime(entry.timestamp);
      return `
        <historial-component
          fecha="${this.escapeHtml(date)}"
          hora="${this.escapeHtml(time)}"
          usuario="${this.escapeHtml(entry.username)}"
          nombre-completo="${this.escapeHtml(entry.fullName || entry.username || 'Usuario')}"
          foto-usuario="${this.escapeHtml(entry.photoUrl)}"
          estatus="${this.escapeHtml(entry.status)}"
          comentario="${this.escapeHtml(entry.comment)}"
        ></historial-component>
      `;
    }).join('');
  }

  renderCommentHistory(entries = []) {
    const slot = this.container?.querySelector('[data-comment-history-panel="true"]');
    if (!slot) {
      return;
    }

    const commentEntries = (Array.isArray(entries) ? entries : [])
      .filter((entry) => this.isCommentStatus(entry.status));

    if (!commentEntries.length) {
      slot.innerHTML = `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-comments-empty">
          <p class="uk-margin-remove">No hay comentarios de atencion para mostrar.</p>
        </div>
      `;
      return;
    }

    slot.innerHTML = `
      <div class="detail-incidencia-comments-list">
        ${commentEntries.map((entry) => {
          const { date, time } = this.splitDateTime(entry.timestamp);
          return `
            <comment-history-item
              fecha="${this.escapeHtml(date)}"
              hora="${this.escapeHtml(time)}"
              usuario="${this.escapeHtml(entry.username)}"
              nombre-completo="${this.escapeHtml(entry.fullName || entry.username || 'Usuario')}"
              foto-usuario="${this.escapeHtml(entry.photoUrl)}"
              comentario="${this.escapeHtml(entry.comment)}"
            ></comment-history-item>
          `;
        }).join('')}
      </div>
    `;
  }

  isCommentStatus(status) {
    const normalizedStatus = String(status || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalizedStatus === 'ATENDIDO';
  }

  splitDateTime(value) {
    const safeValue = String(value || '').trim();
    const match = safeValue.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?$/);
    if (!match) {
      return {
        date: safeValue,
        time: ''
      };
    }

    return {
      date: match[1],
      time: match[2] || ''
    };
  }

  toTimestamp(value) {
    const safeValue = String(value || '').trim();
    const normalized = safeValue ? safeValue.replace(' ', 'T') : '';
    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  getCommentUserContext() {
    const user = getUserState();
    return {
      userId: String(user?.id || '').trim(),
      userName: String(user?.nombre_completo || user?.usuario || 'Usuario').trim(),
      nickname: String(user?.usuario || '').trim(),
      userPhoto: String(user?.foto_perfil || '').trim()
    };
  }

  renderCommentaryContent(isPendingIncident, commentUser) {
    if (isPendingIncident) {
      const waitingMessage = this.isCreatingIncident
        ? 'Estamos generando la incidencia. Los comentarios se habilitaran al finalizar.'
        : (this.incidentCreationError || 'Los comentarios estaran disponibles cuando se genere la incidencia.');
      return `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-commentary__waiting">
          <p class="uk-margin-remove">
            ${this.escapeHtml(waitingMessage)}
          </p>
        </div>
      `;
    }

    if (!this.canCommentIncident()) {
      const statusLabel = this.getCurrentIncidentStatusMeta()?.label || 'final';
      return `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-commentary__waiting">
          <p class="uk-margin-remove">
            Los comentarios ya no están disponibles porque la incidencia está en estado ${this.escapeHtml(statusLabel)}.
          </p>
        </div>
        <div class="detail-incidencia-commentary__feed uk-margin-medium-top">
          <div class="detail-incidencia-commentary__subheader">
            <h3 class="uk-h5 uk-margin-remove">Comentarios recientes</h3>
          </div>
          <div data-comment-history-panel="true">
            <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-comments-empty">
              <p class="uk-margin-remove">Cargando comentarios...</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <comment-box
        user-id="${this.escapeHtml(commentUser.userId)}"
        user-name="${this.escapeHtml(commentUser.userName)}"
        nickname="${this.escapeHtml(commentUser.nickname)}"
        user-photo="${this.escapeHtml(commentUser.userPhoto)}"
      ></comment-box>
      <div class="detail-incidencia-commentary__feed">
        <div class="detail-incidencia-commentary__subheader">
          <h3 class="uk-h5 uk-margin-remove">Comentarios recientes</h3>
        </div>
        <div data-comment-history-panel="true">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded detail-incidencia-comments-empty">
            <p class="uk-margin-remove">Cargando comentarios...</p>
          </div>
        </div>
      </div>
    `;
  }

  isPendingIncidentId(value) {
    return String(value || '').trim() === '0';
  }

  async createIncidentFromEvidence() {
    if (this.isCreatingIncident) {
      return;
    }

    const evidenceHeader = this.evidenceState.record?.header;
    const idResCuestionario = String(evidenceHeader?.ID_RES_CUESTIONARIO || '').trim();
    const itemNumber = String(evidenceHeader?.ITEM_NUMBER || '').trim();

    if (!/^\d+$/.test(idResCuestionario) || !itemNumber) {
      this.incidentCreationError = 'No fue posible obtener la referencia necesaria para generar la incidencia.';
      this.renderCommentaryPanelState();
      this.renderHistoryOffcanvas();
      return;
    }

    this.isCreatingIncident = true;
    this.incidentCreationError = '';
    this.renderCommentaryPanelState();
    this.renderHistoryOffcanvas();

    try {
      const incidentId = await markEvidenceAsReadAndCreateIncident(idResCuestionario, itemNumber);
      const safeEvidenceId = encodeURIComponent(this.pendingEvidenceId);
      const safeIncidentId = encodeURIComponent(String(incidentId));

      navigate(`/supervision/detalle/${safeEvidenceId}/${safeIncidentId}/`, {
        replace: true,
        state: {
          ...(this.navigationContext?.state || {}),
          from: this.navigationContext?.state?.from || '/supervision',
          previousLabel: this.navigationContext?.state?.previousLabel || 'Supervisión'
        }
      });
    } catch (error) {
      this.incidentCreationError = error instanceof Error
        ? error.message
        : 'No fue posible generar la incidencia.';
      this.isCreatingIncident = false;
      this.renderCommentaryPanelState();
      this.renderHistoryOffcanvas();
    }
  }

  async handleCommentSaveRequest(event) {
    const commentBox = event?.target;
    if (!(commentBox instanceof HTMLElement) || commentBox.tagName?.toLowerCase() !== 'comment-box') {
      return;
    }

    const commentText = String(event?.detail?.text || '').trim();
    const safeIncidentId = String(this.pendingIncidentId || '').trim();
    if (!commentText) {
      commentBox.showErrorMessage('Escribe un comentario antes de guardar.');
      return;
    }

    if (!/^\d+$/.test(safeIncidentId) || this.isPendingIncidentId(safeIncidentId)) {
      commentBox.showErrorMessage('La incidencia todavia no esta lista para guardar comentarios.');
      return;
    }

    if (!this.canCommentIncident()) {
      commentBox.showErrorMessage('La incidencia ya no permite nuevos comentarios.');
      return;
    }

    commentBox.setSavingState(true);
    commentBox.showErrorMessage('');

    try {
      await updateIncidentComment(safeIncidentId, DetalleIncidencia.COMMENT_INCIDENT_TYPE, commentText);
      commentBox.completeSave();
      await this.refreshHistoryViews();
      this.refreshSupervisionCachesInBackground();
    } catch (error) {
      commentBox.showErrorMessage(
        error instanceof Error ? error.message : 'No fue posible guardar el comentario.'
      );
    } finally {
      commentBox.setSavingState(false);
    }
  }

  renderCommentaryPanelState() {
    const slot = this.container?.querySelector('[data-commentary-panel="true"]');
    if (!slot) {
      return;
    }

    slot.innerHTML = this.renderCommentaryContent(
      this.isPendingIncidentId(this.pendingIncidentId),
      this.getCommentUserContext()
    );
  }

  getIncidentStatusMeta(statusValue = null) {
    if (statusValue == null || statusValue === '') {
      return null;
    }

    const safeStatus = String(statusValue).trim();
    const exactMeta = DetalleIncidencia.INCIDENT_STATUS_META[safeStatus];
    if (exactMeta) {
      return exactMeta;
    }

    return {
      code: safeStatus,
      label: `Estado ${safeStatus}`,
      tone: 'neutral',
      terminal: false
    };
  }

  getCurrentIncidentStatusMeta() {
    return this.getIncidentStatusMeta(this.incidentState.record?.ID_ESTATUS ?? null);
  }

  canAttendIncident() {
    if (this.isPendingIncidentId(this.pendingIncidentId)) {
      return false;
    }

    const statusMeta = this.getCurrentIncidentStatusMeta();
    return !statusMeta?.terminal;
  }

  canCommentIncident() {
    if (this.isPendingIncidentId(this.pendingIncidentId)) {
      return false;
    }

    const statusMeta = this.getCurrentIncidentStatusMeta();
    return !statusMeta?.commentsLocked;
  }

  getAttentionSuccessMessageByTip(tip) {
    const safeTip = String(tip || '').trim();
    if (safeTip === '3') {
      return 'La incidencia se aprobó correctamente.';
    }
    if (safeTip === '4') {
      return 'La incidencia se rechazó correctamente.';
    }
    if (safeTip === '2') {
      return 'La incidencia se cerró correctamente.';
    }

    return 'La incidencia se atendió correctamente.';
  }

  getSupervisionSelectionContext() {
    return this.navigationContext?.state?.supervisionSelection || null;
  }

  getSupervisionRefreshRange(selectedDate = '') {
    const safeSelectedDate = String(selectedDate || '').trim();
    const storedStart = String(storageService.getSessionItem('fechaInicio') || '').trim();
    const storedEnd = String(storageService.getSessionItem('fechaFin') || '').trim();

    return {
      fechaInicio: storedStart || safeSelectedDate,
      fechaFin: storedEnd || safeSelectedDate,
      selectedDate: safeSelectedDate
    };
  }

  refreshSupervisionCachesInBackground() {
    const selection = this.getSupervisionSelectionContext();
    const safeUserId = String(selection?.userId || '').trim();
    const safeSelectedDate = String(selection?.selectedDate || '').trim();
    const safeNivel = Number.isFinite(Number(selection?.nivel)) ? Number(selection.nivel) : null;
    const { fechaInicio, fechaFin, selectedDate } = this.getSupervisionRefreshRange(safeSelectedDate);

    if (!safeUserId || !fechaInicio || !fechaFin || !selectedDate) {
      return;
    }

    Promise.allSettled([
      getIncidenciasDetalle({
        fechaInicio,
        fechaFin,
        usuario: safeUserId,
        nivel: safeNivel,
        selectedDate,
        forceRefresh: true
      }),
      getIncidenciasByDate(selectedDate, { forceRefresh: true })
    ]).catch(() => {
      // Sync en segundo plano: se ignora el error para no bloquear la vista.
    });
  }

  renderHeaderState() {
    const titleNode = this.container?.querySelector('[data-incident-header-title="true"]');
    const statusNode = this.container?.querySelector('[data-incident-status-badge="true"]');
    const attendButton = this.container?.querySelector('[data-attend-incident-trigger="true"]');
    const pdfButton = this.container?.querySelector('[data-incident-pdf-trigger="true"]');
    const historyButton = this.container?.querySelector('[uk-toggle="target: #detalle-incidencia-history-offcanvas"]');

    if (titleNode) {
      titleNode.textContent = this.isPendingIncidentId(this.pendingIncidentId)
        ? 'Generando incidencia...'
        : `Seguimiento: ${String(this.pendingIncidentId || '0').trim() || '0'}`;
    }

    const statusMeta = this.getCurrentIncidentStatusMeta();
    if (statusNode) {
      if (statusMeta?.label) {
        statusNode.textContent = statusMeta.label;
        statusNode.className = `uk-label detail-incidencia-status-badge detail-incidencia-status-badge--${statusMeta.tone || 'neutral'}`;
      } else {
        statusNode.textContent = '';
        statusNode.className = 'uk-label uk-hidden detail-incidencia-status-badge';
      }
    }

    const isPending = this.isPendingIncidentId(this.pendingIncidentId);
    const canAttend = this.canAttendIncident();
    if (attendButton instanceof HTMLButtonElement) {
      attendButton.disabled = !canAttend;
      attendButton.setAttribute('aria-disabled', String(!canAttend));
      attendButton.classList.toggle('detail-incidencia-button-disabled', !canAttend);
    }

    if (pdfButton instanceof HTMLButtonElement) {
      pdfButton.disabled = isPending;
      pdfButton.setAttribute('aria-disabled', String(isPending));
    }

    if (historyButton instanceof HTMLButtonElement) {
      historyButton.disabled = isPending;
      historyButton.setAttribute('aria-disabled', String(isPending));
    }
  }

  getAttentionModalElement() {
    return document.getElementById('detalle-incidencia-attend-modal');
  }

  getAttentionCommentBox() {
    const commentBox = this.getAttentionModalElement()?.querySelector('[data-attend-comment-box="true"]');
    return commentBox instanceof HTMLElement && commentBox.tagName?.toLowerCase() === 'comment-box'
      ? commentBox
      : null;
  }

  prepareAttentionModalForInput() {
    const commentBox = this.getAttentionCommentBox();
    commentBox?.reset({ keepOpen: true });
    commentBox?.activate();
    commentBox?.focusTextarea();
    this.setAttentionModalError('');
    this.setAttentionSubmittingState(false);
  }

  resetAttentionModal() {
    const commentBox = this.getAttentionCommentBox();
    commentBox?.reset({ keepOpen: true });

    const tipSelect = this.getAttentionModalElement()?.querySelector('[data-attend-incident-tip="true"]');
    if (tipSelect instanceof HTMLSelectElement) {
      tipSelect.value = '';
    }

    this.setAttentionModalError('');
    this.setAttentionSubmittingState(false);
  }

  renderAttentionModalState() {
    const summarySlot = this.getAttentionModalElement()?.querySelector('[data-attend-incident-summary="true"]');
    if (summarySlot) {
      summarySlot.innerHTML = this.renderAttentionSummary();
    }

    this.setAttentionSubmittingState(this.isSubmittingAttention);
  }

  renderAttentionSummary() {
    const safeIncidentId = String(this.pendingIncidentId || '').trim() || 'N/D';
    const safeEvidenceId = String(this.pendingEvidenceId || '').trim() || 'N/D';
    const header = this.evidenceState.record?.header || null;
    const locationText = header
      ? [header.DESCRIPCION, header.ITEM_NUMBER].filter(Boolean).join(' / ') || 'Sin ubicacion'
      : 'Cargando ubicación...';
    const reportUser = header
      ? String(header.NOMBRE_COMPLETO || header.USUARIO || header.COD_USER || 'Usuario sin nombre').trim()
      : 'Cargando responsable...';
    const receivedAt = header
      ? (() => {
        const formatted = this.formatReceptionDateTime(header.FECHA_RECEPCION);
        return [formatted.date, formatted.time].filter(Boolean).join(' ').trim() || 'Sin fecha';
      })()
      : 'Cargando fecha...';

    return `
      <div class="detail-incidencia-attend-summary uk-card uk-card-default uk-card-body uk-border-rounded">
        <div class="detail-incidencia-attend-summary__grid">
          <div>
            <p class="uk-text-meta uk-margin-remove-bottom">Incidencia</p>
            <p class="uk-text-bold uk-margin-remove">${this.escapeHtml(`#${safeIncidentId}`)}</p>
          </div>
          <div>
            <p class="uk-text-meta uk-margin-remove-bottom">Origen</p>
            <p class="uk-margin-remove">${this.escapeHtml(safeEvidenceId)}</p>
          </div>
          <div>
            <p class="uk-text-meta uk-margin-remove-bottom">Ubicación / Equipo</p>
            <p class="uk-margin-remove">${this.escapeHtml(locationText)}</p>
          </div>
          <div>
            <p class="uk-text-meta uk-margin-remove-bottom">Reportado por</p>
            <p class="uk-margin-remove">${this.escapeHtml(reportUser)}</p>
          </div>
          <div>
            <p class="uk-text-meta uk-margin-remove-bottom">Fecha</p>
            <p class="uk-margin-remove">${this.escapeHtml(receivedAt)}</p>
          </div>
        </div>
      </div>
    `;
  }

  setAttentionModalError(message = '') {
    const errorNode = this.getAttentionModalElement()?.querySelector('[data-attend-incident-error="true"]');
    const messageNode = errorNode?.querySelector('p');
    if (!errorNode || !messageNode) {
      return;
    }

    const safeMessage = String(message || '').trim();
    messageNode.textContent = safeMessage;
    errorNode.classList.toggle('uk-hidden', !safeMessage);
  }

  showAttentionNotification(message, status = 'primary') {
    const safeMessage = String(message || '').trim();
    if (!safeMessage) {
      return;
    }

    if (window.UIkit?.notification) {
      window.UIkit.notification({
        message: safeMessage,
        status,
        pos: 'top-center',
        timeout: 2500
      });
    }
  }

  setAttentionSubmittingState(isSubmitting) {
    this.isSubmittingAttention = Boolean(isSubmitting);

    const modalElement = this.getAttentionModalElement();
    const submitButton = modalElement?.querySelector('[data-attend-incident-submit="true"]');
    const cancelButton = modalElement?.querySelector('.uk-modal-close');
    const tipSelect = modalElement?.querySelector('[data-attend-incident-tip="true"]');
    const commentBox = this.getAttentionCommentBox();

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = this.isSubmittingAttention;
      submitButton.textContent = this.isSubmittingAttention
        ? 'Guardando atención...'
        : 'Guardar y atender incidencia';
    }

    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.disabled = this.isSubmittingAttention;
    }

    if (tipSelect instanceof HTMLSelectElement) {
      tipSelect.disabled = this.isSubmittingAttention;
    }

    commentBox?.setSavingState(this.isSubmittingAttention);
  }

  async handleAttendIncidentSubmit() {
    const commentBox = this.getAttentionCommentBox();
    const tipSelect = this.getAttentionModalElement()?.querySelector('[data-attend-incident-tip="true"]');
    const safeIncidentId = String(this.pendingIncidentId || '').trim();

    if (!commentBox || !(tipSelect instanceof HTMLSelectElement)) {
      return;
    }

    const commentText = commentBox.getCommentText();
    const selectedTip = String(tipSelect.value || '').trim();

    commentBox.showErrorMessage('');
    this.setAttentionModalError('');

    if (!commentText) {
      commentBox.showErrorMessage('Escribe un comentario antes de guardar.');
      commentBox.focusTextarea();
      this.showAttentionNotification('Escribe un comentario antes de guardar.', 'warning');
      return;
    }

    if (!selectedTip) {
      this.setAttentionModalError('Selecciona una acción para atender la incidencia.');
      tipSelect.focus();
      this.showAttentionNotification('Selecciona una acción para atender la incidencia.', 'warning');
      return;
    }

    if (!/^\d+$/.test(safeIncidentId) || this.isPendingIncidentId(safeIncidentId)) {
      this.setAttentionModalError('La incidencia todavía no está lista para ser atendida.');
      this.showAttentionNotification('La incidencia todavía no está lista para ser atendida.', 'danger');
      return;
    }

    this.setAttentionSubmittingState(true);
    this.showAttentionNotification('Guardando atención de la incidencia...', 'primary');

    try {
      await updateIncidentAction(safeIncidentId, selectedTip, commentText, {
        invalidIncidentMessage: 'Identificador de incidencia invalido para atender la incidencia',
        invalidTypeMessage: 'Tipo de atencion invalido para atender la incidencia',
        emptyObservationMessage: 'Escribe un comentario antes de guardar.',
        requestErrorMessage: 'No fue posible atender la incidencia.'
      });

      await Promise.all([
        this.loadIncident(safeIncidentId),
        this.refreshHistoryViews()
      ]);
      this.refreshSupervisionCachesInBackground();

      this.showAttentionNotification(this.getAttentionSuccessMessageByTip(selectedTip), 'success');

      const modalElement = this.getAttentionModalElement();
      if (modalElement && window.UIkit?.modal) {
        window.UIkit.modal(modalElement).hide();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No fue posible atender la incidencia.';
      this.setAttentionModalError(errorMessage);
      this.showAttentionNotification(errorMessage, 'danger');
    } finally {
      this.setAttentionSubmittingState(false);
    }
  }

  formatDateTimeForDisplay(date, time) {
    const rawValue = [date, time].filter(Boolean).join(' ').trim();
    if (!rawValue) {
      return 'Sin fecha';
    }

    const normalized = rawValue.replace(' ', 'T');
    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawValue;
    }

    return parsedDate.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapePrintableText(value) {
    return this.escapeHtml(String(value || '')).replaceAll('\n', '<br>');
  }

  buildPrintableHistoryRows(records = []) {
    return (Array.isArray(records) ? records : []).map((entry) => {
      const { date, time } = this.splitDateTime(entry.timestamp);
      return {
        fecha: this.formatDateTimeForDisplay(date, time),
        estatus: entry.status || 'Sin estado',
        usuario: entry.fullName || entry.username || 'Usuario',
        comentario: entry.comment || 'Sin comentario'
      };
    });
  }

  buildPdfDocumentHtml({ historyRows = [] } = {}) {
    const header = this.evidenceState.record?.header || null;
    const detail = Array.isArray(this.evidenceState.record?.detail) ? this.evidenceState.record.detail : [];
    const observationText = this.formatObservationText(this.getDetailAnswer(detail, 'OBS')) || 'Sin descripción disponible.';
    const photoFilename = this.getDetailAnswer(detail, 'FT1');
    const imageUrl = this.buildEvidenceImageUrl(photoFilename);
    const locationText = header
      ? [header.DESCRIPCION, header.ITEM_NUMBER].filter(Boolean).join(' / ') || 'Sin ubicación'
      : 'Sin ubicación';
    const reportUser = header
      ? String(header.NOMBRE_COMPLETO || header.USUARIO || header.COD_USER || 'Usuario sin nombre').trim()
      : 'Sin responsable';
    const receivedAt = header
      ? (() => {
        const formatted = this.formatReceptionDateTime(header.FECHA_RECEPCION);
        return [formatted.date, formatted.time].filter(Boolean).join(' ').trim() || 'Sin fecha';
      })()
      : 'Sin fecha';
    const incidentRecord = this.incidentState.record || null;
    const incidentStatus = this.getCurrentIncidentStatusMeta()?.label || 'Sin estado';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incidencia ${this.escapeHtml(this.pendingIncidentId)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; line-height: 1.45; }
    h1, h2 { margin: 0 0 12px; }
    h1 { font-size: 22px; }
    h2 { font-size: 16px; margin-top: 24px; }
    p { margin: 0 0 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e5e7eb; font-size: 12px; font-weight: 700; }
    .section { margin-bottom: 20px; }
    .box { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .label { font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; }
    .value { font-size: 14px; }
    img { max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #f3f4f6; }
    @media print {
      body { margin: 16px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <h1>Incidencia #${this.escapeHtml(this.pendingIncidentId)}</h1>
  <p><span class="badge">${this.escapeHtml(incidentStatus)}</span></p>

  <section class="section">
    <h2>Resumen</h2>
    <div class="box grid">
      <div><div class="label">Origen</div><div class="value">${this.escapeHtml(this.pendingEvidenceId || 'N/D')}</div></div>
      <div><div class="label">Fecha de recepción</div><div class="value">${this.escapeHtml(receivedAt)}</div></div>
      <div><div class="label">Ubicación / Equipo</div><div class="value">${this.escapeHtml(locationText)}</div></div>
      <div><div class="label">Reportado por</div><div class="value">${this.escapeHtml(reportUser)}</div></div>
      <div><div class="label">Nivel</div><div class="value">${this.escapeHtml(incidentRecord?.NIVEL ?? 'N/D')}</div></div>
      <div><div class="label">Tipo de incidencia</div><div class="value">${this.escapeHtml(incidentRecord?.ID_TIPO_INC ?? 'N/D')}</div></div>
    </div>
  </section>

  <section class="section">
    <h2>Evidencia</h2>
    <div class="box">
      <p><span class="label">Descripción</span></p>
      <p>${this.escapePrintableText(observationText)}</p>
      ${imageUrl ? `
        <p><span class="label">Fotografía</span></p>
        <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(photoFilename || 'Fotografía')}">
        <p>${this.escapeHtml(photoFilename || imageUrl)}</p>
      ` : '<p>Sin fotografía disponible.</p>'}
    </div>
  </section>

  <section class="section page-break">
    <h2>Historial completo</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Estatus</th>
          <th>Usuario</th>
          <th>Comentario</th>
        </tr>
      </thead>
      <tbody>
        ${historyRows.length ? historyRows.map((row) => `
          <tr>
            <td>${this.escapeHtml(row.fecha)}</td>
            <td>${this.escapeHtml(row.estatus)}</td>
            <td>${this.escapeHtml(row.usuario)}</td>
            <td>${this.escapePrintableText(row.comentario)}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="4">No hay historial disponible.</td>
          </tr>
        `}
      </tbody>
    </table>
  </section>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 300);
    });
  </script>
</body>
</html>`;
  }

  async openIncidentPdfReport() {
    const safeIncidentId = String(this.pendingIncidentId || '').trim();
    if (!/^\d+$/.test(safeIncidentId) || this.isPendingIncidentId(safeIncidentId)) {
      this.showAttentionNotification('La incidencia todavía no está lista para generar el PDF.', 'warning');
      return;
    }

    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      this.showAttentionNotification('Tu navegador bloqueó la nueva pestaña del PDF.', 'warning');
      return;
    }

    pdfWindow.document.write('<!DOCTYPE html><html><head><title>Generando PDF…</title></head><body><p>Generando PDF de la incidencia…</p></body></html>');
    pdfWindow.document.close();

    try {
      const historyRows = this.buildPrintableHistoryRows(
        this.historyRecordsCache.length ? this.historyRecordsCache : await this.buildHistoryRecords()
      );
      const html = this.buildPdfDocumentHtml({ historyRows });
      pdfWindow.document.open();
      pdfWindow.document.write(html);
      pdfWindow.document.close();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No fue posible generar el PDF.';
      pdfWindow.document.open();
      pdfWindow.document.write(`<!DOCTYPE html><html><body><p>${this.escapeHtml(errorMessage)}</p></body></html>`);
      pdfWindow.document.close();
      this.showAttentionNotification(errorMessage, 'danger');
    }
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
      <div class="detail-evidence-photo-gallery uk-width-1-2" uk-lightbox="animation: slide">
        <div>
          <a class="uk-inline detail-evidence-photo-link uk-height-medium" href="${escapedUrl}" data-caption="${escapedFilename}">
            <img
              src="${escapedUrl}"
              class="uk-border-rounded detail-evidence-photo-image uk-height-medium"
              width="1800"
              height="auto"
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

      .detail-incidencia-panel--evidence,
      .detail-incidencia-panel--commentary {
        background: var(--app-surface);
        color: var(--app-text);
      }

      .detail-incidencia-panel__state {
        min-height: 20rem;
      }

      .detail-incidencia-panel__placeholder {
        min-height: 24rem;
      }

      .detail-incidencia-commentary {
        display: grid;
        gap: 1rem;
        min-height: 24rem;
        align-content: start;
      }

      .detail-incidencia-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .detail-incidencia-status-badge {
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.35rem 0.75rem;
      }

      .detail-incidencia-status-badge--neutral {
        background: color-mix(in srgb, var(--app-primary, #1e87f0) 14%, transparent);
        color: var(--app-primary, #1e87f0);
      }

      .detail-incidencia-status-badge--info {
        background: color-mix(in srgb, #0ea5e9 16%, transparent);
        color: #0369a1;
      }

      .detail-incidencia-status-badge--success {
        background: color-mix(in srgb, #16a34a 16%, transparent);
        color: #15803d;
      }

      .detail-incidencia-status-badge--warning {
        background: color-mix(in srgb, #d97706 16%, transparent);
        color: #b45309;
      }

      .detail-incidencia-status-badge--danger {
        background: color-mix(in srgb, #dc2626 16%, transparent);
        color: #b91c1c;
      }

      .detail-incidencia-status-badge--muted {
        background: color-mix(in srgb, #64748b 18%, transparent);
        color: #475569;
      }

      .detail-incidencia-button-disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .detail-incidencia-commentary__waiting {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-text-muted);
      }

      .detail-incidencia-offcanvas {
        background: var(--app-surface-elevated);
        color: var(--app-text);
        box-shadow: var(--app-shadow-soft);
        width: min(34rem, 92vw);
      }

      .detail-incidencia-offcanvas__header {
        margin-bottom: 1.25rem;
        padding-right: 1.75rem;
      }

      .detail-incidencia-offcanvas__content {
        display: grid;
        gap: 1.5rem;
      }

      .detail-incidencia-history-panel {
        display: grid;
        gap: 1.5rem;
      }

      .detail-incidencia-history-group {
        display: grid;
        gap: 0.9rem;
      }

      .detail-incidencia-history-group__body {
        display: grid;
        gap: 0.25rem;
      }

      .detail-incidencia-history-group__toggle {
        display: flex;
        justify-content: flex-start;
      }

      .detail-incidencia-history-toggle-link {
        color: var(--app-primary, #1e87f0);
        font-size: 0.92rem;
        font-weight: 600;
      }

      .detail-incidencia-history-toggle-link:hover,
      .detail-incidencia-history-toggle-link:focus-visible {
        color: var(--app-primary-hover, #0f7ae5);
        text-decoration: underline;
      }

      .detail-incidencia-history-empty {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-text-muted);
        box-shadow: none;
      }

      .detail-incidencia-commentary__header .uk-h4 {
        color: var(--app-text);
      }

      .detail-incidencia-commentary comment-box {
        margin: 0;
      }

      .detail-incidencia-commentary__feed {
        display: grid;
        gap: 0.75rem;
      }

      .detail-incidencia-commentary__subheader .uk-h5 {
        color: var(--app-text);
      }

      .detail-incidencia-comments-list {
        display: grid;
        gap: 0;
      }

      .detail-incidencia-comments-empty {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        color: var(--app-text-muted);
        box-shadow: none;
      }

      .detail-incidencia-attend-modal {
        background: var(--app-surface-elevated);
        border: 1px solid var(--app-border);
        color: var(--app-text);
        box-shadow: var(--app-shadow-soft);
        width: min(40rem, calc(100vw - 2rem));
      }

      .detail-incidencia-attend-modal__title {
        color: var(--app-text);
      }

      .detail-incidencia-attend-modal__content {
        display: grid;
        gap: 1rem;
      }

      .detail-incidencia-attend-summary {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        box-shadow: none;
      }

      .detail-incidencia-attend-summary__grid {
        display: grid;
        gap: 0.85rem;
      }

      .detail-incidencia-attend-modal__field {
        display: grid;
        gap: 0.5rem;
      }

      .detail-incidencia-attend-modal__field .uk-form-label {
        color: var(--app-text);
        font-weight: 600;
      }

      .detail-incidencia-attend-modal__field .uk-select {
        background: var(--app-surface);
        border-color: var(--app-border);
        color: var(--app-text);
      }

      .detail-incidencia-attend-modal__error {
        background: color-mix(in srgb, #dc2626 10%, var(--app-surface, #ffffff));
        border: 1px solid color-mix(in srgb, #dc2626 30%, var(--app-border, #d0d7de));
        color: #991b1b;
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
        display: inline-block;
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
      .detail-evidence-title-row .uk-text-meta,
      .detail-incidencia-commentary__header .uk-text-meta,
      .detail-incidencia-offcanvas .uk-text-meta {
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

      .padding-elemento-derecho {
        padding-left: 15px;
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
