import '../../components/userAvatar.js';
import { renderSupervisionSidebar } from '../../components/supervision-sidebar/supervision-sidebar.js';
import { createSupervisionDetailPanel, renderSupervisionDetailPanel } from '../../components/supervision-detail/supervision-detail-panel.js';
import { createSupervisionSidebarController } from '../../components/supervision-sidebar/supervision-sidebar.controller.js';
import { renderInicioLayout } from '../inicio-layout.js';
import { loadSupervisionSidebarConfig } from './services/supervision-sidebar-config.service.js';

export default class Supervision {
  static instancia = null;
  static PARENT_CARD_CLASS = 'supervision-page-parent-card';
  static MAIN_SCROLL_LOCK_CLASS = 'supervision2-main-content-lock';

  constructor() {
    if (Supervision.instancia) {
      return Supervision.instancia;
    }

    Supervision.instancia = this;
    this.parentCardElement = null;
    this.titleElement = null;
    this.container = null;
    this.sidebarConfig = null;
    this.sidebarController = null;
    this.detailPanel = null;
    this.viewportSyncHandler = null;
    this.viewportScrollContainer = null;
    this.mainScrollContainer = null;
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

    const sidebarConfig = await loadSupervisionSidebarConfig();
    this.sidebarConfig = sidebarConfig;

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="supervision2-page uk-section uk-section-small uk-padding-remove-top uk-padding-remove-bottom" style="top: -25px;">
          <div class="supervision2-shell">
            <div class="supervision2-layout">
              <aside class="supervision2-panel supervision2-panel--left">
                ${renderSupervisionSidebar(sidebarConfig)}
                <div id="supervisionSidebarLoader" class="supervision2-panel-loader uk-hidden" aria-hidden="true">
                  <div class="supervision2-panel-loader__content uk-text-center">
                    <span uk-spinner="ratio: 1.1"></span>
                    <p class="supervision2-panel-loader__message uk-margin-small-top uk-margin-remove-bottom">
                      Buscando incidencias...
                    </p>
                  </div>
                </div>
              </aside>

              <section class="supervision2-panel supervision2-panel--right">
                ${renderSupervisionDetailPanel()}
              </section>
            </div>
          </div>
        </section>
      `
    });

    this.syncParentCardClass(container);
    this.bindViewportHeightSync(container);
    const detailContainer = this.container?.querySelector('.supervision2-panel--right');
    this.detailPanel?.destroy?.();
    this.detailPanel = createSupervisionDetailPanel({
      container: detailContainer
    });
    this.detailPanel.init();

    this.sidebarController?.destroy?.();
    this.sidebarController = createSupervisionSidebarController({
      container: this.container,
      config: sidebarConfig,
      onUserSelect: (selection) => this.handleSidebarUserSelection(selection)
    });
    await this.sidebarController.init();
  }

  handleSidebarUserSelection(selection) {
    this.detailPanel?.showSelection(selection);

    window.dispatchEvent(new CustomEvent('supervision:user-selected', {
      detail: {
        ...selection
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

  bindViewportHeightSync(container) {
    this.unbindViewportHeightSync();

    const supervisionRoot = container?.querySelector('.supervision2-page');
    const scrollContainer = container?.querySelector('.inicio-main-content');
    if (!supervisionRoot) {
      return;
    }

    this.lockMainScroll(scrollContainer);

    const syncViewportHeight = () => {
      const rootRect = supervisionRoot.getBoundingClientRect();
      const availableHeight = Math.max(320, window.innerHeight - rootRect.top - 12);
      supervisionRoot.style.setProperty('--supervision2-viewport-height', `${availableHeight}px`);
    };

    this.viewportSyncHandler = () => window.requestAnimationFrame(syncViewportHeight);
    this.viewportScrollContainer = scrollContainer || null;

    window.addEventListener('resize', this.viewportSyncHandler);
    this.viewportScrollContainer?.addEventListener('scroll', this.viewportSyncHandler, { passive: true });
    syncViewportHeight();
  }

  unbindViewportHeightSync() {
    if (this.viewportSyncHandler) {
      window.removeEventListener('resize', this.viewportSyncHandler);
      this.viewportScrollContainer?.removeEventListener('scroll', this.viewportSyncHandler);
    }

    this.viewportSyncHandler = null;
    this.viewportScrollContainer = null;
  }

  lockMainScroll(scrollContainer) {
    this.unlockMainScroll();

    if (!scrollContainer) {
      return;
    }

    scrollContainer.classList.add(Supervision.MAIN_SCROLL_LOCK_CLASS);
    this.mainScrollContainer = scrollContainer;
  }

  unlockMainScroll() {
    if (!this.mainScrollContainer) {
      return;
    }

    this.mainScrollContainer.classList.remove(Supervision.MAIN_SCROLL_LOCK_CLASS);
    this.mainScrollContainer = null;
  }

  destroy() {
    this.sidebarController?.destroy?.();
    this.detailPanel?.destroy?.();
    this.sidebarController = null;
    this.detailPanel = null;
    this.unbindViewportHeightSync();
    this.unlockMainScroll();
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
        --supervision2-badge-text: var(--app-text);
        --supervision2-badge-value: var(--app-text);
        --supervision2-page-lift: 0.75rem;
        height: var(--supervision2-viewport-height, auto);
        min-height: var(--supervision2-viewport-height, auto);
        margin-top: calc(var(--supervision2-page-lift) * -1);
        position: relative;
      }

      .${Supervision.PARENT_CARD_CLASS} {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .${Supervision.PARENT_CARD_CLASS} > .supervision2-page {
        flex: 1 1 auto;
      }

      .inicio-main-content.${Supervision.MAIN_SCROLL_LOCK_CLASS} {
        overflow: hidden;
      }

      .supervision2-shell {
        width: 100%;
        height: 100%;
        min-height: 100%;
        overflow: hidden;
      }

      .supervision2-layout {
        display: grid;
        grid-template-columns: minmax(300px, 26%) 1fr;
        gap: 0.75rem;
        align-items: stretch;
        height: 100%;
        min-height: 0;
      }

      .supervision2-panel {
        border: 1px solid var(--supervision2-border);
        border-radius: 12px;
        box-shadow: var(--supervision2-shadow);
        color: var(--supervision2-text);
        min-height: 0;
        max-height: 100%;
        overflow: hidden;
      }

      .supervision2-panel--left {
        position: relative;
        background: var(--supervision2-surface-muted);
        padding: 0.5rem;
        height: 100%;
        min-height: 0;
        overflow-y: auto;
      }

      .supervision2-panel--left.supervision2-panel--loading {
        overflow: hidden;
      }

      .supervision2-panel--right {
        background: var(--supervision2-surface);
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        min-height: 0;
        height: 100%;
        overflow-y: auto;
      }

      .supervision2-detail-origin {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 0.85rem 1rem;
        background: var(--supervision2-surface-muted);
        color: var(--supervision2-text);
        border: 1px solid var(--supervision2-border);
      }

      .supervision2-level-indicator--detail {
        width: 0.9rem;
        height: 0.9rem;
        background: color-mix(in srgb, var(--supervision2-surface-elevated) 78%, var(--supervision2-border-strong) 22%);
        box-shadow: inset 0 0 0 1px var(--supervision2-border);
      }

      .supervision2-detail-user-card {
        border: 1px solid var(--supervision2-border);
        box-shadow: var(--supervision2-shadow-soft);
      }

      .supervision2-detail-user-card__title {
        color: var(--supervision2-text);
      }

      .supervision2-detail-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.20rem;
      }

      .supervision2-detail-stat {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--supervision2-border);
        border-radius: 10px;
        background: color-mix(in srgb, var(--supervision2-surface-elevated) 90%, var(--supervision2-surface) 10%);
        box-shadow: none;
        color: var(--supervision2-text-muted);
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }

      .supervision2-detail-stat:hover,
      .supervision2-detail-stat:focus-visible {
        border-color: color-mix(in srgb, var(--supervision2-detail-stat-color, var(--supervision2-primary)) 50%, var(--supervision2-border) 50%);
        color: var(--supervision2-text);
        text-decoration: none;
        outline: none;
      }

      .supervision2-detail-stat.is-active {
        background: color-mix(in srgb, var(--supervision2-detail-stat-color, var(--supervision2-primary)) 14%, var(--supervision2-surface) 86%);
        border-color: color-mix(in srgb, var(--supervision2-detail-stat-color, var(--supervision2-primary)) 55%, var(--supervision2-border) 45%);
        color: var(--supervision2-text);
      }

      .supervision2-detail-stat__label {
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.2;
      }

      .supervision2-detail-stat__total {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: var(--supervision2-detail-stat-color, var(--supervision2-primary));
        color: #fff;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.1;
      }

      .supervision2-detail-stat--all {
        --supervision2-detail-stat-color: #1e87f0;
      }

      .supervision2-detail-stat--nl {
        --supervision2-detail-stat-color: #ff9800;
      }

      .supervision2-detail-stat--nl-nvl {
        --supervision2-detail-stat-color: #ff9800;
      }

      .supervision2-detail-stat--l {
        --supervision2-detail-stat-color: #9e9e9e;
      }

      .supervision2-detail-stat--a {
        --supervision2-detail-stat-color: #009688;
      }

      .supervision2-detail-stat--ap {
        --supervision2-detail-stat-color: #4caf50;
      }

      .supervision2-detail-stat--c {
        --supervision2-detail-stat-color: #78909c;
      }

      .supervision2-detail-stat--r {
        --supervision2-detail-stat-color: #f44336;
      }

      .supervision2-detail-stat--re {
        --supervision2-detail-stat-color: #9c27b0;
      }

      .supervision2-detail-stat--x {
        --supervision2-detail-stat-color: #1e87f0;
      }

      .supervision2-detail-table-card {
        border: 1px solid var(--supervision2-border);
        box-shadow: var(--supervision2-shadow-soft);
        padding-left: 10px;
        padding-right: 10px;
      }

      .supervision2-detail-search {
        min-width: min(240px, 72vw);
      }

      .supervision2-detail-search .uk-input,
      .supervision2-detail-filter-grid .uk-input,
      .supervision2-detail-filter-grid .uk-select {
        background: var(--supervision2-surface-elevated);
        color: var(--supervision2-text);
        border-color: var(--supervision2-border);
      }

      .supervision2-detail-search .uk-input:focus,
      .supervision2-detail-filter-grid .uk-input:focus,
      .supervision2-detail-filter-grid .uk-select:focus {
        border-color: var(--supervision2-primary);
      }

      .supervision2-detail-dropdown {
        min-width: 220px;
        border: 1px solid var(--supervision2-border);
        box-shadow: var(--supervision2-shadow-soft);
      }

      .supervision2-detail-filter-button {
        white-space: nowrap;
      }

      .uk-modal-dialog.supervision2-detail-filter-modal {
        background-color: var(--app-surface, #ffffff);
        color: var(--app-text, #111827);
        border: 1px solid var(--app-border, #d1d5db);
        box-shadow: var(--app-shadow-soft, 0 10px 30px rgba(15, 23, 42, 0.18));
        opacity: 1;
      }

      .supervision2-detail-filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
      }

      .supervision2-detail-filter-select {
        min-height: 8.5rem;
      }

      .supervision2-detail-filter-help {
        display: inline-block;
        margin-top: 0.35rem;
      }

      .supervision2-detail-table {
        margin-bottom: 0;
      }

      .supervision2-detail-table th {
        color: var(--supervision2-text);
        white-space: nowrap;
      }

      .supervision2-detail-table td {
        vertical-align: top;
        color: var(--supervision2-text);
      }

      .supervision2-detail-table .uk-table-hover tbody tr:hover {
        background: var(--supervision2-table-row-hover, color-mix(in srgb, var(--supervision2-primary-soft) 32%, var(--supervision2-surface) 68%));
      }

      .supervision2-detail-table.uk-table-hover tbody tr:hover td,
      .supervision2-detail-table.uk-table-hover tbody tr:hover th {
        background: var(--supervision2-table-row-hover, color-mix(in srgb, var(--supervision2-primary-soft) 32%, var(--supervision2-surface) 68%));
      }

      .supervision2-detail-sort-button {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: var(--supervision2-text);
      }

      .supervision2-detail-sort-button.is-active {
        color: var(--supervision2-primary);
      }

      .supervision2-detail-description,
      .supervision2-detail-truncate {
        display: inline-block;
        max-width: 100%;
      }

      .supervision2-detail-status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 5.5rem;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
        background: var(--supervision2-detail-status-color, var(--supervision2-primary));
        color: #fff;
        border: 0;
        font-weight: 700;
        text-transform: uppercase;
      }

      .supervision2-detail-status-badge--all {
        --supervision2-detail-status-color: #1e87f0;
      }

      .supervision2-detail-status-badge--nl {
        --supervision2-detail-status-color: #ff9800;
      }

      .supervision2-detail-status-badge--nl-nvl {
        --supervision2-detail-status-color: #ff9800;
      }

      .supervision2-detail-status-badge--l {
        --supervision2-detail-status-color: #9e9e9e;
      }

      .supervision2-detail-status-badge--a {
        --supervision2-detail-status-color: #009688;
      }

      .supervision2-detail-status-badge--ap {
        --supervision2-detail-status-color: #4caf50;
      }

      .supervision2-detail-status-badge--c {
        --supervision2-detail-status-color: #78909c;
      }

      .supervision2-detail-status-badge--r {
        --supervision2-detail-status-color: #f44336;
      }

      .supervision2-detail-status-badge--re {
        --supervision2-detail-status-color: #9c27b0;
      }

      .supervision2-detail-status-badge--x {
        --supervision2-detail-status-color: #1e87f0;
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

      .supervision2-pending-label {
        color: var(--supervision2-badge-text);
      }

      .supervision2-pending-total {
        font-weight: 600;
        color: var(--supervision2-badge-value);
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

      .supervision2-panel-loader {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: color-mix(in srgb, var(--supervision2-surface-muted) 88%, transparent);
        backdrop-filter: blur(2px);
      }

      .supervision2-panel-loader__content {
        width: min(280px, 100%);
        padding: 1rem 1.25rem;
        border: 1px solid var(--supervision2-border);
        border-radius: 14px;
        background: var(--supervision2-surface);
        box-shadow: var(--supervision2-shadow);
      }

      .supervision2-panel-loader__message {
        color: var(--supervision2-text);
        font-weight: 600;
      }

      html[data-theme='dark'] .supervision2-page {
        --supervision2-badge-bg: color-mix(in srgb, var(--app-surface-elevated) 82%, var(--app-border) 18%);
      }
      
      .supervision2-panel-detai-tbl-actions {
        width: 100px;
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
        .inicio-main-content.${Supervision.MAIN_SCROLL_LOCK_CLASS} {
          overflow-y: auto;
        }

        .supervision2-page {
          --supervision2-page-lift: 0;
          height: auto;
          min-height: auto;
          margin-top: 0;
        }

        .supervision2-shell {
          min-height: auto;
          overflow: visible;
        }

        .supervision2-layout {
          grid-template-columns: 1fr;
          height: auto;
        }

        .supervision2-panel--left {
          max-height: 50vh;
        }

        .supervision2-detail-filter-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
