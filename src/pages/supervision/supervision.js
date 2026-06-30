import { renderSupervisionSidebar } from '../../components/supervision-sidebar/supervision-sidebar.js';
import { getPanelDomBindings } from '../../components/supervision-sidebar/supervision-accordion-item.js';
import { renderSupervisionUserSummaryCard } from '../../components/supervision-sidebar/supervision-user-summary-card.js';
import { fetchIncidenciasByDate } from '../../core/services/apis-me/incidencias.service.js';
import { syncClientUsers } from '../../core/services/apis-me/usuarios.service.js';
import { renderInicioLayout } from '../inicio-layout.js';
import { loadSupervisionSidebarConfig } from './services/supervision-sidebar-config.service.js';

export default class Supervision {
  static instancia = null;
  static PARENT_CARD_CLASS = 'supervision-page-parent-card';
  static DEFAULT_WORKSPACE_ID = '1';

  constructor() {
    if (Supervision.instancia) {
      return Supervision.instancia;
    }

    Supervision.instancia = this;
    this.parentCardElement = null;
    this.titleElement = null;
    this.container = null;
    this.sidebarConfig = null;
    this.dateInputElement = null;
    this.boundHandleDateChange = this.handleDateChange.bind(this);
    this.boundHandleUserSelection = this.handleUserSelection.bind(this);
  }

  async inicializar(container) {
    if (container) {
      await this.render(container);
    }

    return this;
  }

  async render(container) {
    this.ensureSupervisionStyles();
    this.container = container;

    const sidebarConfig = await loadSupervisionSidebarConfig(Supervision.DEFAULT_WORKSPACE_ID);
    this.sidebarConfig = sidebarConfig;

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="supervision2-page uk-section uk-section-small uk-padding-remove-top uk-padding-remove-bottom">
          <div class="supervision2-shell">
            <div class="supervision2-layout">
              <aside class="supervision2-panel supervision2-panel--left">
                ${renderSupervisionSidebar(sidebarConfig)}
              </aside>

              <section class="supervision2-panel supervision2-panel--right">
                <p class="supervision2-empty-detail">
                  Da clic en un usuario con incidencias para mostrar el detalle de las mismas.
                </p>
                <span id="loaderDetalleIncidencias"></span>
                <section id="panelDerechoListIncidencias"></section>
              </section>
            </div>
          </div>
        </section>
      `
    });

    this.syncParentCardClass(container);
    await this.initializeSidebarRuntime();
  }

  async initializeSidebarRuntime() {
    const dateInput = this.container?.querySelector('#datePickerMapHot');
    if (!dateInput) {
      return;
    }

    if (this.dateInputElement && this.dateInputElement !== dateInput) {
      this.dateInputElement.removeEventListener('change', this.boundHandleDateChange);
    }

    this.dateInputElement = dateInput;
    this.dateInputElement.removeEventListener('change', this.boundHandleDateChange);
    if (this.sidebarConfig?.queryPanel?.behavior?.fetchOnChange) {
      this.dateInputElement.addEventListener('change', this.boundHandleDateChange);
    }

    const leftPanel = this.container?.querySelector('.supervision2-panel--left');
    leftPanel?.removeEventListener('click', this.boundHandleUserSelection);
    leftPanel?.addEventListener('click', this.boundHandleUserSelection);

    if (!this.dateInputElement.value) {
      this.dateInputElement.value = this.getDefaultDateValue();
    }

    if (this.sidebarConfig?.queryPanel?.behavior?.fetchOnInitialLoad) {
      await this.loadIncidenciasForSelectedDate(this.dateInputElement.value);
    }
  }

  getDefaultDateValue() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }

  async handleDateChange(event) {
    const selectedDate = event?.target?.value || '';
    await this.loadIncidenciasForSelectedDate(selectedDate);
  }

  async loadIncidenciasForSelectedDate(selectedDate) {
    const safeDate = String(selectedDate || '').trim();
    if (!safeDate) {
      return;
    }

    this.setSidebarLoading(true);
    this.updateWeekInfo(safeDate);
    this.resetSidebarPanels();

    try {
      const [incidenciasResult, usersCatalogResult] = await Promise.allSettled([
        fetchIncidenciasByDate(safeDate),
        syncClientUsers()
      ]);
      const incidencias = incidenciasResult.status === 'fulfilled' ? incidenciasResult.value : [];
      const usersCatalog = usersCatalogResult.status === 'fulfilled' ? usersCatalogResult.value : { data: [] };

      if (incidenciasResult.status !== 'fulfilled') {
        throw incidenciasResult.reason;
      }

      const usersById = new Map(
        (Array.isArray(usersCatalog?.data) ? usersCatalog.data : []).map((user) => [
          Number(user?.ID_USUARIO ?? 0),
          user
        ])
      );

      this.renderIncidenciasByLevel(
        incidencias.map((item) => ({
          ...item,
          URL_FOTO_PERFIL: usersById.get(Number(item.ID_USUARIO))?.URL_FOTO_PERFIL || ''
        }))
      );
      this.renderSidebarMessage('');
    } catch (error) {
      console.error('[supervision] error loading incidencias', error);
      this.renderSidebarMessage('No se pudo cargar la lista de incidencias para la fecha seleccionada.');
    } finally {
      this.setSidebarLoading(false);
    }
  }

  renderIncidenciasByLevel(records) {
    const normalizedRecords = Array.isArray(records) ? records : [];
    const recordsByLevel = new Map();

    normalizedRecords.forEach((record) => {
      const levelKey = this.resolvePanelIdFromLevel(record?.NIVEL);
      if (!recordsByLevel.has(levelKey)) {
        recordsByLevel.set(levelKey, []);
      }

      recordsByLevel.get(levelKey).push(record);
    });

    (this.sidebarConfig?.panels || []).forEach((panel) => {
      const panelId = String(panel?.id || '');
      const bindings = getPanelDomBindings(panelId);
      const listElement = this.container?.querySelector(`#${bindings.listId}`);
      const pendingElement = this.container?.querySelector(`#${bindings.pendingId}`);
      const badgeElement = bindings.countBadgeId
        ? this.container?.querySelector(`#${bindings.countBadgeId}`)
        : null;
      const panelRecords = recordsByLevel.get(panelId) || [];
      const pendingTotal = panelRecords.reduce((sum, item) => sum + Number(item?.NO_LEIDOS ?? 0), 0);

      if (listElement) {
        listElement.innerHTML = panelRecords
          .map((record) => renderSupervisionUserSummaryCard(record))
          .join('');
      }

      if (pendingElement) {
        pendingElement.textContent = String(pendingTotal);
      }

      if (badgeElement) {
        badgeElement.textContent = String(panelRecords.length);
        badgeElement.classList.toggle('uk-hidden', panelRecords.length === 0);
      }
    });
  }

  resolvePanelIdFromLevel(level) {
    const normalizedLevel = String(Number(level ?? 0));
    const hasNumericPanel = (this.sidebarConfig?.panels || []).some((panel) => panel?.id === normalizedLevel);
    if (hasNumericPanel) {
      return normalizedLevel;
    }

    const legacyMap = {
      '4': 'critical',
      '3': 'relevant',
      '2': 'important',
      '1': 'operational',
      '0': 'informative'
    };

    return legacyMap[normalizedLevel] || '0';
  }

  resetSidebarPanels() {
    (this.sidebarConfig?.panels || []).forEach((panel) => {
      const bindings = getPanelDomBindings(panel.id);
      const listElement = this.container?.querySelector(`#${bindings.listId}`);
      const pendingElement = this.container?.querySelector(`#${bindings.pendingId}`);
      const badgeElement = bindings.countBadgeId
        ? this.container?.querySelector(`#${bindings.countBadgeId}`)
        : null;

      if (listElement) {
        listElement.innerHTML = '';
      }

      if (pendingElement) {
        pendingElement.textContent = '0';
      }

      if (badgeElement) {
        badgeElement.textContent = '0';
        badgeElement.classList.add('uk-hidden');
      }
    });
  }

  setSidebarLoading(isLoading) {
    const loader = this.container?.querySelector('#loaderGralSupNiveles');
    if (!loader) {
      return;
    }

    loader.innerHTML = isLoading ? '<span uk-spinner="ratio: 0.6"></span>' : '';
  }

  updateWeekInfo(selectedDate) {
    const weekInfo = this.container?.querySelector('#weekInfo');
    const title = this.container?.querySelector('#heatmapTitle');
    if (weekInfo) {
      weekInfo.textContent = `Fecha seleccionada: ${selectedDate}`;
    }

    if (title) {
      title.textContent = selectedDate;
      title.classList.remove('uk-hidden');
    }
  }

  renderSidebarMessage(message) {
    const messageNode = this.container?.querySelector('#msgContentsPanels');
    if (!messageNode) {
      return;
    }

    if (!message) {
      messageNode.innerHTML = '';
      return;
    }

    messageNode.innerHTML = `<div class="uk-alert-warning uk-border-rounded uk-margin-small-top" uk-alert>${message}</div>`;
  }

  handleUserSelection(event) {
    const trigger = event.target?.closest('[data-supervision-user-id]');
    if (!trigger) {
      return;
    }

    const userId = Number(trigger.getAttribute('data-supervision-user-id') || 0);
    const userName = trigger.getAttribute('data-supervision-user-name') || '';
    const selectedUserInput = this.container?.querySelector('#idSupervisorSeleccionado');
    const detailPanel = this.container?.querySelector('#panelDerechoListIncidencias');

    if (selectedUserInput) {
      selectedUserInput.value = String(userId);
    }

    if (detailPanel) {
      detailPanel.innerHTML = `
        <div class="uk-alert-primary uk-border-rounded" uk-alert>
          Usuario seleccionado: <strong>${userName}</strong> (${userId})
        </div>
      `;
    }

    window.dispatchEvent(new CustomEvent('supervision:user-selected', {
      detail: {
        userId,
        userName,
        selectedDate: this.dateInputElement?.value || ''
      }
    }));
  }

  syncParentCardClass(container) {
    this.removeParentCardClass();
    this.removeTitleHiddenClass();

    const supervisionRoot = container?.querySelector('.supervision2-page');
    const parentCard = supervisionRoot?.closest('.uk-card.uk-card-body');
    const titleElement = supervisionRoot?.previousElementSibling;

    if (!parentCard) {
      return;
    }

    parentCard.classList.add(Supervision.PARENT_CARD_CLASS);
    this.parentCardElement = parentCard;

    if (titleElement?.matches('h1.uk-card-title')) {
      titleElement.classList.add('uk-hidden');
      this.titleElement = titleElement;
    }
  }

  removeParentCardClass() {
    if (!this.parentCardElement) {
      return;
    }

    this.parentCardElement.classList.remove(Supervision.PARENT_CARD_CLASS);
    this.parentCardElement = null;
  }

  removeTitleHiddenClass() {
    if (!this.titleElement) {
      return;
    }

    this.titleElement.classList.remove('uk-hidden');
    this.titleElement = null;
  }

  destroy() {
    this.dateInputElement?.removeEventListener('change', this.boundHandleDateChange);
    this.container
      ?.querySelector('.supervision2-panel--left')
      ?.removeEventListener('click', this.boundHandleUserSelection);
    this.removeParentCardClass();
    this.removeTitleHiddenClass();
  }

  ensureSupervisionStyles() {
    if (document.getElementById('supervision2-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'supervision2-page-styles';
    style.textContent = `
      .supervision2-page {
        --supervision2-surface: var(--app-surface);
        --supervision2-surface-muted: var(--app-surface-muted);
        --supervision2-surface-elevated: var(--app-surface-elevated);
        --supervision2-border: var(--app-border);
        --supervision2-border-strong: var(--app-border-strong);
        --supervision2-text: var(--app-text);
        --supervision2-text-muted: var(--app-text-muted);
        --supervision2-text-soft: var(--app-text-soft);
        --supervision2-primary: var(--app-primary);
        --supervision2-primary-soft: var(--app-primary-soft);
        --supervision2-shadow: var(--app-shadow);
        --supervision2-shadow-soft: var(--app-shadow-soft);
        --supervision2-badge-bg: color-mix(in srgb, var(--app-surface-elevated) 70%, var(--app-border) 30%);
        --supervision2-badge-text: var(--app-text-muted);
        height: 100%;
        top: -20px;
        position: relative;
      }

      .${Supervision.PARENT_CARD_CLASS} {
        height: calc(100vh - 200px);
      }

      .${Supervision.PARENT_CARD_CLASS} > .supervision2-page {
        height: 100%;
      }

      .supervision2-shell {
        width: 100%;
        height: calc(100vh - 100px);
      }

      .supervision2-layout {
        display: grid;
        grid-template-columns: minmax(300px, 26%) 1fr;
        gap: 0.75rem;
        align-items: start;
        height: 100%;
      }

      .supervision2-panel {
        border: 1px solid var(--supervision2-border);
        border-radius: 12px;
        box-shadow: var(--supervision2-shadow);
        color: var(--supervision2-text);
      }

      .supervision2-panel--left {
        background: var(--supervision2-surface-muted);
        padding: 0.5rem;
        height: 100%;
        overflow-y: auto;
      }

      .supervision2-panel--right {
        background: var(--supervision2-surface);
        padding: 0.75rem;
        min-height: 100%;
      }

      .supervision2-panel .uk-accordion > :nth-child(n + 2) {
        margin-top: 0.75rem;
      }

      .supervision2-card {
        border: 1px solid var(--supervision2-border);
        border-radius: 12px;
        background: var(--supervision2-surface);
        overflow: hidden;
        box-shadow: var(--supervision2-shadow-soft);
      }

      .supervision2-card__title {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.875rem 1rem;
        color: var(--supervision2-text);
        background: var(--supervision2-surface);
        font-size: 1rem;
      }

      .supervision2-card__title .uk-text-truncate {
        color: inherit;
      }

      .supervision2-card__title:hover,
      .supervision2-card__title:focus {
        color: var(--supervision2-text);
        text-decoration: none;
      }

      .supervision2-page .uk-accordion-title::before {
        filter: none;
        opacity: 0.75;
      }

      .supervision2-level-indicator {
        display: inline-flex;
        flex: 0 0 auto;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        background: var(--supervision2-indicator-color, var(--supervision2-primary));
        border: 1px solid color-mix(in srgb, var(--supervision2-indicator-color, var(--supervision2-primary)) 70%, #000 30%);
      }

      .supervision2-title-icon {
        font-size: 1rem;
        line-height: 1;
        color: var(--supervision2-text-muted);
      }

      .supervision2-tools-box {
        border: 1px solid var(--supervision2-border);
        margin: 0;
        padding: 0.875rem 1rem;
        background: color-mix(in srgb, var(--supervision2-primary-soft) 45%, var(--supervision2-surface) 55%);
        color: var(--supervision2-text);
      }

      .supervision2-week-title {
        display: inline-block;
        margin-right: 0.5rem;
        font-weight: 600;
        color: var(--supervision2-text);
      }

      .supervision2-tools-box .uk-text-meta,
      .supervision2-tools-box .uk-form-label {
        color: var(--supervision2-text-muted);
      }

      .supervision2-tools-box .uk-input {
        background: var(--supervision2-surface-elevated);
        color: var(--supervision2-text);
        border-color: var(--supervision2-border);
      }

      .supervision2-tools-box .uk-input:focus {
        border-color: var(--supervision2-primary);
      }

      .supervision2-users-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
        margin-top: 0.75rem;
      }

      .supervision2-user-summary {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.875rem;
        width: 100%;
        min-height: 76px;
        padding: 0.875rem 1rem;
        border-radius: 14px;
        border: 1px solid var(--supervision2-border);
        background: var(--supervision2-surface-elevated);
        box-shadow: var(--supervision2-shadow-soft);
        text-transform: none;
      }

      .supervision2-user-summary:hover,
      .supervision2-user-summary:focus {
        border-color: var(--supervision2-primary);
        background: color-mix(in srgb, var(--supervision2-primary-soft) 22%, var(--supervision2-surface-elevated) 78%);
      }

      .supervision2-user-summary__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--supervision2-surface);
        border: 1px solid var(--supervision2-border);
      }

      .supervision2-user-summary__photo,
      .supervision2-user-summary__photo-fallback {
        width: 100%;
        height: 100%;
      }

      .supervision2-user-summary__photo {
        display: block;
        object-fit: cover;
      }

      .supervision2-user-summary__photo-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--supervision2-text-muted);
      }

      .supervision2-user-summary__body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }

      .supervision2-user-summary__name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--supervision2-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .supervision2-user-summary__meta {
        color: var(--supervision2-text-muted);
      }

      .supervision2-pending-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.7rem 0.85rem;
        font-size: 0.8rem;
        border-radius: 999px;
        border: 1px solid var(--supervision2-border);
      }

      .supervision2-pending-badge--inactive {
        background-color: var(--supervision2-badge-bg);
        color: var(--supervision2-badge-text);
      }

      .supervision2-pending-total {
        font-weight: 600;
        color: inherit;
      }

      .supervision2-empty-detail {
        margin: 0;
        padding: 2rem;
        text-align: center;
        color: var(--supervision2-text-muted);
        font-style: italic;
      }

      .supervision2-page .uk-badge#user-count {
        background: var(--supervision2-primary-soft);
        color: var(--supervision2-primary);
        border: 1px solid var(--supervision2-border);
      }

      html[data-theme='dark'] .supervision2-page {
        --supervision2-badge-bg: color-mix(in srgb, var(--app-surface-elevated) 82%, var(--app-border) 18%);
      }

      @media (max-width: 1200px) {
        .supervision2-layout {
          grid-template-columns: minmax(300px, 35%) 1fr;
        }
      }

      @media (max-width: 960px) {
        .supervision2-layout {
          grid-template-columns: minmax(280px, 40%) 1fr;
        }
      }

      @media (max-width: 768px) {
        .supervision2-shell {
          min-height: auto;
        }

        .supervision2-layout {
          grid-template-columns: 1fr;
          height: auto;
        }

        .supervision2-panel--left {
          max-height: 50vh;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
