import { renderInicioLayout } from '../inicio-layout.js';

export class CatalogListPageBase {
  renderCatalogListPage(container, options = {}) {
    this.ensureCatalogListPageStyles();

    const {
      title = '',
      description = '',
      searchPlaceholder = 'Buscar',
      searchInputId = 'catalogSearchInput',
      stateContainerId = 'catalogStateContainer',
      mobileSearchAriaLabel = 'Mostrar buscador'
    } = options;

    renderInicioLayout(container, {
      title: this.buildCatalogPageTitle(title, mobileSearchAriaLabel),
      description,
      contentHtml: this.buildCatalogPageContent({
        searchInputId,
        searchPlaceholder,
        stateContainerId
      })
    });
  }

  buildCatalogPageTitle(title, mobileSearchAriaLabel = 'Mostrar buscador') {
    const safeTitle = this.escapeHtml(title || '');
    const safeAriaLabel = this.escapeHtml(mobileSearchAriaLabel);

    return `
      <span class="catalog-page-title-row">
        <span class="catalog-page-title-text uk-text-left">${safeTitle}</span>
        <button
          type="button"
          class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-hidden@s catalog-page-title-search-btn"
          data-catalog-mobile-search-toggle
          aria-label="${safeAriaLabel}"
          aria-expanded="false">
          <span uk-icon="icon: search"></span>
        </button>
      </span>
    `;
  }

  buildCatalogPageContent(options = {}) {
    const {
      searchInputId = 'catalogSearchInput',
      searchPlaceholder = 'Buscar',
      stateContainerId = 'catalogStateContainer'
    } = options;

    const safeSearchInputId = this.escapeHtml(searchInputId);
    const safeSearchPlaceholder = this.escapeHtml(searchPlaceholder);
    const safeStateContainerId = this.escapeHtml(stateContainerId);

    return `
      <section class="catalog-list-page uk-margin-top">
        <div class="uk-grid-small uk-margin-small-bottom uk-flex-middle catalog-toolbar catalog-search-row" uk-grid data-catalog-search-row>
          <div class="uk-width-1-1 uk-width-expand@s">
            <div class="uk-inline uk-width-1-1 uk-width-medium@s uk-width-1-3@l">
              <span class="uk-form-icon" uk-icon="icon: search"></span>
              <input
                class="uk-input uk-border-rounded inputTxtFrm catalog-search-input"
                id="${safeSearchInputId}"
                type="search"
                placeholder="${safeSearchPlaceholder}">
            </div>
          </div>
        </div>
        <div id="${safeStateContainerId}"></div>
      </section>
    `;
  }

  bindCatalogMobileSearchToggle(container) {
    const toggleButton = container.querySelector('[data-catalog-mobile-search-toggle]');
    const searchRow = container.querySelector('[data-catalog-search-row]');
    if (!toggleButton || !searchRow) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const isOpen = searchRow.classList.toggle('is-mobile-search-open');
      toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  renderCatalogList(container, options = {}) {
    const {
      items = [],
      emptyMessage = 'No hay elementos para mostrar.',
      mobileCounterLabel = 'Total de resultados',
      desktopHeaderLabel = 'Descripción / Item Number',
      renderMobileItem = () => '',
      renderDesktopItem = () => ''
    } = options;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = `
        <div class="uk-alert-warning" uk-alert>
          <p>${this.escapeHtml(emptyMessage)}</p>
        </div>
      `;
      return;
    }

    const mobileItems = items.map((item, index) => renderMobileItem(item, index)).join('');
    const desktopRows = items.map((item, index) => renderDesktopItem(item, index)).join('');

    container.innerHTML = `
      <div class="catalog-list-shell uk-hidden@s">
        <div class="catalog-column-header uk-flex uk-flex-between uk-flex-middle uk-margin-bottom">
          <span class="uk-text-meta">${this.escapeHtml(mobileCounterLabel)}</span>
          <span class="uk-label catalog-count-badge">${items.length}</span>
        </div>
        <ul class="uk-list uk-margin-remove catalog-list">
          ${mobileItems}
        </ul>
      </div>
      <div class="catalog-list-shell uk-visible@s">
        <div class="uk-margin-top">
          <div class="catalog-column-header uk-flex uk-flex-between uk-flex-middle uk-padding-small uk-border-rounded">
            <span class="uk-text-meta">${this.escapeHtml(desktopHeaderLabel)}</span>
            <span class="uk-label catalog-count-badge">${items.length}</span>
          </div>
          <ul class="uk-list uk-margin-remove catalog-list">
            ${desktopRows}
          </ul>
        </div>
      </div>
    `;
  }

  escapeHtml(value) {
    if (value === null || value === undefined) {
      return '-';
    }

    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  ensureCatalogListPageStyles() {
    if (document.getElementById('catalog-list-page-base-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'catalog-list-page-base-styles';
    style.textContent = `
      .catalog-list-page {
        --catalog-surface: var(--app-surface, #ffffff);
        --catalog-surface-muted: var(--app-surface-muted, #f3f4f6);
        --catalog-surface-elevated: var(--app-surface-elevated, #ffffff);
        --catalog-border: var(--app-border, #e5e7eb);
        --catalog-text: var(--app-text, #1f2937);
        --catalog-text-muted: var(--app-text-muted, #6b7280);
        --catalog-primary: var(--app-primary, #1e87f0);
        --catalog-primary-soft: rgba(30, 135, 240, 0.08);
        --catalog-column-bg: var(--app-surface-muted, #f3f4f6);
        --catalog-hover-bg: rgba(30, 135, 240, 0.08);
        --catalog-hover-border: rgba(30, 135, 240, 0.3);
        color: var(--catalog-text);
      }

      html[data-theme='dark'] .catalog-list-page {
        --catalog-primary-soft: rgba(96, 165, 250, 0.14);
        --catalog-column-bg: rgba(23, 32, 51, 0.92);
        --catalog-hover-bg: rgba(96, 165, 250, 0.12);
        --catalog-hover-border: rgba(96, 165, 250, 0.28);
      }

      .catalog-page-title-text {
        color: var(--app-text, #1f2937);
      }

      .catalog-page-title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .catalog-toolbar {
        margin-top: 0.75rem;
      }

      .catalog-search-input,
      .catalog-search-input:focus {
        background: var(--catalog-surface-elevated);
        border-color: var(--catalog-border);
        color: var(--catalog-text);
      }

      .catalog-search-input:focus {
        box-shadow: 0 0 0 3px var(--catalog-primary-soft);
      }

      .catalog-list-shell {
        margin-top: 0.75rem;
      }

      .catalog-column-header {
        background: var(--catalog-column-bg);
        border: 1px solid var(--catalog-border);
        color: var(--catalog-text-muted);
      }

      .catalog-count-badge {
        background: var(--catalog-primary-soft);
        color: var(--catalog-primary);
        border-radius: 999px;
      }

      .catalog-list {
        border-radius: 14px;
        overflow: hidden;
      }

      .catalog-list__item + .catalog-list__item {
        margin-top: 0;
      }

      .catalog-row {
        background: var(--catalog-surface);
        border: 1px solid transparent;
        border-bottom-color: var(--catalog-border);
        transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .catalog-row--mobile {
        border-color: var(--catalog-border);
        box-shadow: none;
      }

      .catalog-row--desktop {
        border-left-color: transparent;
        border-right-color: transparent;
        border-top-color: transparent;
        border-radius: 12px;
      }

      .catalog-row:hover,
      .catalog-row:focus-within {
        background: var(--catalog-hover-bg);
        border-color: var(--catalog-hover-border);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        cursor: pointer;
      }

      html[data-theme='dark'] .catalog-row:hover,
      html[data-theme='dark'] .catalog-row:focus-within {
        box-shadow: 0 12px 24px rgba(2, 6, 23, 0.24);
      }

      .catalog-row__title {
        color: var(--catalog-text);
      }

      .catalog-row__meta {
        color: var(--catalog-text-muted);
      }

      @media (max-width: 639px) {
        .catalog-page-title-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          column-gap: 0.75rem;
          width: 100%;
        }

        .catalog-page-title-text {
          text-align: left;
        }

        .catalog-page-title-search-btn {
          justify-self: end;
        }

        .catalog-search-row {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          margin-top: 0;
          margin-bottom: 0;
          transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease, margin 0.22s ease;
        }

        .catalog-search-row.is-mobile-search-open {
          max-height: 120px;
          opacity: 1;
          transform: translateY(0);
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
      }

      @media (min-width: 640px) {
        .catalog-search-row {
          max-height: none;
          opacity: 1;
          overflow: visible;
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
