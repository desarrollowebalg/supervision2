import { renderSupervisionSidebar } from '../../components/supervision-sidebar/supervision-sidebar.js';
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
  }

  async inicializar(container) {
    if (container) {
      await this.render(container);
    }

    return this;
  }

  async render(container) {
    this.ensureSupervisionStyles();

    const sidebarConfig = await loadSupervisionSidebarConfig(Supervision.DEFAULT_WORKSPACE_ID);

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
