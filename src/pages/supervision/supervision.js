import { renderInicioLayout } from '../inicio-layout.js';

export default class Supervision {
  static instancia = null;
  static PARENT_CARD_CLASS = 'supervision-page-parent-card';

  constructor() {
    if (Supervision.instancia) {
      return Supervision.instancia;
    }

    Supervision.instancia = this;
    this.parentCardElement = null;
    this.titleElement = null;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.ensureSupervisionStyles();

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="supervision2-page uk-section uk-section-small uk-padding-remove-top uk-padding-remove-bottom">
          <div class="supervision2-shell">
            <div class="supervision2-layout">
              <aside class="supervision2-panel supervision2-panel--left">
                <ul class="uk-accordion" uk-accordion="multiple: true">
                  <li class="uk-open supervision2-card supervision2-card--tools">
                    <a class="uk-accordion-title supervision2-card__title" href="#">                      
                      <span uk-icon="calendar"></span>
                      <span>Herramientas</span>
                      <span id="loaderGralSupNiveles"></span>
                    </a>
                    <div class="uk-accordion-content uk-margin-small-top">
                      <div class="uk-alert-primary uk-border-rounded supervision2-tools-box" uk-alert>
                        <label class="uk-form-label uk-hidden" for="datePickerMapHot">Selecciona una fecha</label>
                        <div class="uk-grid-small uk-flex-middle" uk-grid>
                          <div class="uk-width-auto@s">
                            <input id="datePickerMapHot" class="uk-input uk-form-width-small uk-border-rounded" type="date">
                          </div>
                          <div class="uk-width-expand@s">
                            <span id="heatmapTitle" class="uk-hidden supervision2-week-title">Sem -- Año --</span>
                            <span id="weekInfo" class="uk-text-meta">Selecciona una fecha para ver la semana correspondiente.</span>
                          </div>
                        </div>
                      </div>
                      <span id="msgContentsPanels"></span>
                      <section class="uk-margin-small-top uk-margin-small-bottom uk-hidden">
                        <input type="hidden" id="idSupervisorSeleccionado" value="0">
                        <div id="contenedorSupervisioresSup_v0" class="uk-margin-small-top uk-margin-small-bottom">
                          <div id="user-list-supervisores" class="supervision2-users-container"></div>
                        </div>
                      </section>
                    </div>
                  </li>

                  ${this.renderLevelAccordionItem({
                    levelClass: 'supervision2-card--critical',
                    title: '🔴 Nivel 4: Crítico → Riesgo inmediato → SLA 60s',
                    listId: 'user-list-4',
                    pendingId: 'pendientes-user-list-4'
                  })}

                  ${this.renderLevelAccordionItem({
                    levelClass: 'supervision2-card--relevant',
                    title: '🟠 Nivel 3: Relevante → Riesgo potencial → SLA 120s',
                    listId: 'user-list-3',
                    pendingId: 'pendientes-user-list-3'
                  })}

                  ${this.renderLevelAccordionItem({
                    levelClass: 'supervision2-card--important',
                    title: '🟡 Nivel 2: Importante → Seguimiento necesario → SLA 240s',
                    listId: 'user-list-2',
                    pendingId: 'pendientes-user-list-2'
                  })}

                  ${this.renderLevelAccordionItem({
                    levelClass: 'supervision2-card--operational',
                    title: '🟢 Nivel 1: Operativo → Registro operativo → SLA 480s',
                    listId: 'user-list-1',
                    pendingId: 'pendientes-user-list-1'
                  })}

                  <li class="supervision2-card supervision2-card--informative">
                    <a class="uk-accordion-title supervision2-card__title" href="#">
                      <span class="uk-text-truncate" title="Nivel 0: Informativo → Contexto → sin SLA Contexto" uk-tooltip>
                        ⚪ Nivel 0: Informativo → Contexto → sin SLA Contexto
                      </span>
                      <span class="uk-badge uk-margin-small-left uk-hidden" id="user-count">0</span>
                    </a>
                    <div class="uk-accordion-content uk-margin-small-top">
                      <span class="uk-badge supervision2-pending-badge supervision2-pending-badge--inactive">
                        Pendientes:
                        <span id="pendientes-user-list" class="supervision2-pending-total">0</span>
                      </span>
                      <div id="user-list" class="supervision2-users-container"></div>
                    </div>
                  </li>
                </ul>
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
  }

  renderLevelAccordionItem({ levelClass, title, listId, pendingId }) {
    return `
      <li class="supervision2-card ${levelClass}">
        <a class="uk-accordion-title supervision2-card__title" href="#">
          <span class="uk-text-truncate" title="${this.escapeAttribute(title)}" uk-tooltip>${title}</span>
        </a>
        <div class="uk-accordion-content uk-margin-small-top">
          <span class="uk-badge supervision2-pending-badge supervision2-pending-badge--inactive">
            Pendientes:
            <span id="${pendingId}" class="supervision2-pending-total">0</span>
          </span>
          <div id="${listId}" class="supervision2-users-container"></div>
        </div>
      </li>
    `;
  }

  escapeAttribute(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
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
        flex-wrap: wrap;
        gap: 0.75rem;
        width: 100%;
        margin-top: 0.75rem;
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
