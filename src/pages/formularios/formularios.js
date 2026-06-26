import { CatalogListPageBase } from '../shared/catalog-list-page.base.js';
import { renderInicioLayout } from '../inicio-layout.js';
import { getAssignedForms } from '../../core/services/apis-me/forms.service.js';
import formThemesService from '../../core/services/form-themes.service.js';

export default class Evidencias extends CatalogListPageBase {
  static instancia = null;

  constructor() {
    if (Evidencias.instancia) {
      return Evidencias.instancia;
    }

    super();
    Evidencias.instancia = this;
    this.themesMap = new Map();
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }
  render(container) {
    this.ensureCatalogListPageStyles();
    this.ensureFormListStyles();

    renderInicioLayout(container, {
      title: `
        <span class="forms-page-title-row catalog-page-title-row">
          <span class="forms-page-title-text catalog-page-title-text uk-text-left">Formularios</span>
          <button
            type="button"
            class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-hidden@s forms-page-title-search-btn catalog-page-title-search-btn"
            data-forms-mobile-search-toggle
            aria-label="Mostrar buscador"
            aria-expanded="false">
            <span uk-icon="icon: search"></span>
          </button>
        </span>
      `,
      description: '',
      contentHtml: `
        <section class="catalog-list-page forms-list-page uk-margin-top">
          <div class="uk-grid-small uk-margin-small-bottom uk-flex-middle forms-search-row catalog-search-row catalog-toolbar" uk-grid data-forms-search-row>
            <div class="uk-width-1-1 uk-width-expand@s">
              <div class="uk-inline uk-width-1-1 uk-width-medium@s uk-width-1-3@l forms-search-box">
                <span class="uk-form-icon" uk-icon="icon: search"></span>
                <input
                  class="uk-input uk-border-rounded inputTxtFrm catalog-search-input"
                  id="formsSearchInput"
                  type="search"
                  placeholder="Buscar por descripcion">
              </div>
            </div>
            <div class="uk-width-1-1 uk-width-auto@s uk-text-right@s">
              <span id="formsDesktopTotal" class="forms-desktop-total uk-text-meta uk-visible@s"></span>
            </div>
          </div>
          <div id="formsStateContainer"></div>
        </section>
      `
    });

    this.bindMobileSearchToggle(container);
    this.loadForms(container);
  }

  bindMobileSearchToggle(container) {
    const toggleButton = container.querySelector('[data-forms-mobile-search-toggle]');
    const searchRow = container.querySelector('[data-forms-search-row]');
    if (!toggleButton || !searchRow) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const isOpen = searchRow.classList.toggle('is-mobile-search-open');
      toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  async loadForms(container) {
    const stateContainer = container.querySelector('#formsStateContainer');
    const searchInput = container.querySelector('#formsSearchInput');

    if (!stateContainer || !searchInput) {
      return;
    }

    stateContainer.innerHTML = `
      <div class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner></div>
      </div>
    `;

    try {
      const [forms, themesMap] = await Promise.all([
        getAssignedForms(),
        formThemesService.getThemesMap()
      ]);

      const normalizedForms = Array.isArray(forms) ? forms : [];
      this.themesMap = themesMap instanceof Map ? themesMap : new Map();
      this.bindSearch(searchInput, stateContainer, normalizedForms);
      this.renderForms(stateContainer, normalizedForms);
    } catch (error) {
      stateContainer.innerHTML = `
        <div class="uk-alert-danger" uk-alert>
          <p>No fue posible cargar los formularios.</p>
        </div>
      `;
    }
  }

  bindSearch(searchInput, stateContainer, forms) {
    searchInput.oninput = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filtered = forms.filter((form) =>
        String(form?.DESCRIPCION || '').toLowerCase().includes(query)
      );
      this.renderForms(stateContainer, filtered);
    };
  }

  renderForms(container, forms) {
    if (!forms.length) {
      container.innerHTML = `
        <div class="uk-alert-warning" uk-alert>
          <p>No tienes formularios asignados.</p>
        </div>
      `;
      return;
    }

    const mobileItems = forms.map((form) => this.renderMobileItem(form)).join('');
    const desktopRows = forms.map((form) => this.renderDesktopRow(form)).join('');

    container.innerHTML = `
      <div class="catalog-list-shell uk-hidden@s">
        <div class="catalog-column-header uk-flex uk-flex-between uk-flex-middle uk-margin-bottom">
          <span class="uk-text-meta">Total de resultados</span>
          <span class="uk-label catalog-count-badge">${forms.length}</span>
        </div>
        <ul class="uk-list uk-margin-remove catalog-list">
          ${mobileItems}
        </ul>
      </div>
      <div class="catalog-list-shell uk-visible@s">
        <div class="uk-margin-top">
          <div class="catalog-column-header uk-flex uk-flex-between uk-flex-middle uk-padding-small uk-border-rounded">
            <div class="uk-grid-small uk-width-expand" uk-grid>
              <div class="uk-width-expand">
                <span class="uk-text-meta">Descripcion del formulario</span>
              </div>
              <div class="uk-width-auto">
                <span class="uk-text-meta">Item Number</span>
              </div>
            </div>
          </div>
          <ul class="uk-list uk-margin-remove catalog-list">
            ${desktopRows}
          </ul>
        </div>
      </div>
    `;

    const desktopTotal = document.querySelector('#formsDesktopTotal');
    if (desktopTotal) {
      desktopTotal.textContent = `${forms.length} elementos`;
    }
  }

  renderMobileItem(form) {
    const descripcion = this.cleanDescription(form?.DESCRIPCION);
    const detailPath = this.getDetailPath(form);
    const themeStyles = this.getInlineThemeStyle(form?.TEMA);

    return `
      <li
        class="catalog-list__item"
        data-clv="${this.escapeHtml(form?.CLV)}"
        data-item-number="${this.escapeHtml(form?.ITEM_NUMBER)}"
        data-tipo="${this.escapeHtml(form?.TIPO ?? form?.ID_TIPO)}"
        data-tema="${this.escapeHtml(form?.TEMA)}">
        <a href="#${detailPath}" data-route="${this.escapeHtml(detailPath)}" class="forms-row-link catalog-row catalog-row--mobile uk-display-block uk-padding-small uk-card uk-card-default uk-card-body uk-border-rounded" style="${themeStyles}">
          <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
            <div class="uk-width-auto">
              <span class="forms-desktop-icon-pill" uk-icon="icon: file-text"></span>
            </div>
            <div class="uk-width-expand">
              <h4
                class="uk-margin-remove-bottom uk-text-truncate catalog-row__title"
                title="${this.escapeHtml(descripcion)}">${this.escapeHtml(descripcion)}</h4>
              <p class="forms-row-meta catalog-row__meta uk-margin-small-top uk-margin-small-bottom">
                Item: ${this.escapeHtml(form?.ITEM_NUMBER)}
              </p>
            </div>
          </div>
        </a>
      </li>
    `;
  }

  renderDesktopRow(form) {
    const descripcion = this.cleanDescription(form?.DESCRIPCION);
    const detailPath = this.getDetailPath(form);
    const themeStyles = this.getInlineThemeStyle(form?.TEMA);

    return `
      <li
        class="catalog-list__item uk-padding-small uk-padding-remove-top uk-padding-remove-bottom"
        data-clv="${this.escapeHtml(form?.CLV)}"
        data-item-number="${this.escapeHtml(form?.ITEM_NUMBER)}"
        data-tipo="${this.escapeHtml(form?.TIPO ?? form?.ID_TIPO)}"
        data-tema="${this.escapeHtml(form?.TEMA)}">
        <a href="#${detailPath}" data-route="${this.escapeHtml(detailPath)}" class="forms-row-link catalog-row catalog-row--desktop uk-display-block uk-border-rounded uk-padding-small" style="${themeStyles}">
          <div class="uk-flex uk-flex-middle uk-flex-between uk-grid-small" uk-grid>
            <div class="uk-width-expand">
              <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
                <div class="uk-width-auto">
                  <span class="forms-desktop-icon-pill" uk-icon="icon: file-text">
                  </span>
                </div>
                <div class="uk-width-expand">
                  <h3
                    class="uk-margin-remove uk-text-truncate uk-text-default catalog-row__title"
                    title="${this.escapeHtml(descripcion)}">${this.escapeHtml(descripcion)}</h3>
                </div>
              </div>
            </div>
            <div class="uk-width-auto">
              <span class="forms-row-meta catalog-row__meta uk-text-meta">Item: ${this.escapeHtml(form?.ITEM_NUMBER)}</span>
            </div>
          </div>
        </a>
      </li>
    `;
  }

  getThemeById(idTema) {
    const normalizedId = idTema === null || idTema === undefined ? '' : String(idTema).trim();
    if (!normalizedId || !(this.themesMap instanceof Map)) {
      return null;
    }

    return this.themesMap.get(normalizedId) || null;
  }

  getInlineThemeStyle(idTema) {
    const theme = this.getThemeById(idTema);
    if (!theme) {
      return '';
    }

    const fallbackGradient = 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 35%, rgba(0, 0, 0, 0.14) 100%)';
    const gradient = theme.GRADIENTE || fallbackGradient;

    return `--forms-theme-bg: ${theme.BARRA}; --forms-theme-gradient: ${gradient}; --forms-theme-text: ${theme.LETRA};`;
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

  cleanDescription(value) {
    return String(value || '').replaceAll('*', '').trim();
  }

  getDetailPath(formName) {
    const indicator = formName?.ITEM_NUMBER || formName?.CLV || 'formulario';
    const clv = formName?.CLV;
    const basePath = `/formularios/${encodeURIComponent(String(indicator))}`;

    if (clv === null || clv === undefined || clv === '') {
      return basePath;
    }

    return `${basePath}?clv=${encodeURIComponent(String(clv))}`;
  }

  ensureFormListStyles() {
    if (document.getElementById('forms-list-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'forms-list-page-styles';
    style.textContent = `
      .forms-list-page {
        --forms-theme-bg: var(--catalog-primary);
        --forms-theme-gradient: none;
        --forms-theme-text: var(--catalog-text);
      }

      .forms-row-link {
        color: inherit;
        text-decoration: none;
        position: relative;
        overflow: hidden;
      }

      .forms-row-link:hover,
      .forms-row-link:focus {
        color: inherit;
        text-decoration: none;
      }

      .forms-row-link [uk-icon] svg,
      .forms-row-link [uk-icon] {
        color: inherit;
      }

      .forms-row-meta {
        opacity: 0.92;
      }

      .forms-desktop-icon-pill {
        width: 2.15rem;
        height: 2.15rem;
        border-radius: 0.6rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--forms-theme-bg);
        background-image: var(--forms-theme-gradient);
        color: var(--forms-theme-text);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
      }

      .forms-desktop-total {
        color: var(--catalog-text-muted);
      }

      .forms-list-page .catalog-row__title,
      .forms-list-page .catalog-row__meta {
        position: relative;
        z-index: 1;
      }

      .forms-list-page .catalog-row--mobile::before,
      .forms-list-page .catalog-row--desktop::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--forms-theme-bg);
        opacity: 0.95;
      }

      .forms-list-page .catalog-row--mobile {
        padding-left: calc(1rem + 6px);
      }

      .forms-list-page .catalog-row--desktop {
        padding-left: calc(1rem + 6px);
      }

      .forms-list-page .catalog-row--mobile:hover,
      .forms-list-page .catalog-row--mobile:focus-within,
      .forms-list-page .catalog-row--desktop:hover,
      .forms-list-page .catalog-row--desktop:focus-within {
        background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.02));
      }

      html[data-theme='dark'] .forms-list-page .catalog-row--mobile:hover,
      html[data-theme='dark'] .forms-list-page .catalog-row--mobile:focus-within,
      html[data-theme='dark'] .forms-list-page .catalog-row--desktop:hover,
      html[data-theme='dark'] .forms-list-page .catalog-row--desktop:focus-within {
        background-image: linear-gradient(0deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.12));
      }

      @media (max-width: 639px) {
        .forms-page-title-text {
          text-align: left;
        }

        .forms-page-title-search-btn {
          justify-self: end;
        }

        .forms-search-row {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          margin-top: 0;
          margin-bottom: 0;
          transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease, margin 0.22s ease;
        }

        .forms-search-row.is-mobile-search-open {
          max-height: 120px;
          opacity: 1;
          transform: translateY(0);
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
      }

      @media (min-width: 640px) {
        .forms-search-row {
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
