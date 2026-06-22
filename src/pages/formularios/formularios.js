import { renderInicioLayout } from '../inicio-layout.js';
import { getAssignedForms } from '../../core/services/apis-me/forms.service.js';
import formThemesService from '../../core/services/form-themes.service.js';

export default class Evidencias {
  static instancia = null;

  constructor() {
    if (Evidencias.instancia) {
      return Evidencias.instancia;
    }

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
    this.ensureFormListStyles();

    renderInicioLayout(container, {
      title: `
        <span class="forms-page-title-row">
          <span class="forms-page-title-text uk-text-left">Formularios</span>
          <button
            type="button"
            class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-hidden@s forms-page-title-search-btn"
            data-forms-mobile-search-toggle
            aria-label="Mostrar buscador"
            aria-expanded="false">
            <span uk-icon="icon: search"></span>
          </button>
        </span>
      `,
      description: '',
      contentHtml: `
        <div class="uk-grid-small uk-margin-small-bottom uk-flex-middle forms-search-row" uk-grid data-forms-search-row>
          <div class="uk-width-1-1 uk-width-expand@s">
            <div class="uk-inline uk-width-1-1 uk-width-medium@s uk-width-1-3@l forms-search-box">
              <span class="uk-form-icon" uk-icon="icon: search"></span>
              <input
                class="uk-input uk-background-muted uk-border-rounded inputTxtFrm"
                id="formsSearchInput"
                type="search"
                placeholder="Buscar por descripcion">
            </div>
          </div>
          <div class="uk-width-1-1 uk-width-auto@s uk-text-right@s">
            <span id="formsDesktopTotal" class="uk-text-meta uk-visible@s"></span>
          </div>
        </div>
        <div id="formsStateContainer"></div>
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
      <div class="uk-hidden@s">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-top uk-margin-bottom">
          <span class="uk-text-meta">Total</span>
          <span class="uk-label">${forms.length}</span>
        </div>
        <ul class="uk-list uk-margin-remove">
          ${mobileItems}
        </ul>
      </div>
      <div class="uk-visible@s">
        <div class="uk-margin-top">
          <div class="uk-flex uk-flex-between uk-flex-middle uk-padding-small uk-background-muted uk-border-rounded">
            <div class="uk-grid-small uk-width-expand" uk-grid>
              <div class="uk-width-expand">
                <span class="uk-text-meta">Descripcion del formulario</span>
              </div>
              <div class="uk-width-auto">
                <span class="uk-text-meta">Item Number</span>
              </div>
            </div>
          </div>
          <ul class="uk-list uk-margin-remove">
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
    const titleStyles = this.getInlineThemeTitleStyle(form?.TEMA);

    return `
      <li
        data-clv="${this.escapeHtml(form?.CLV)}"
        data-item-number="${this.escapeHtml(form?.ITEM_NUMBER)}"
        data-tipo="${this.escapeHtml(form?.TIPO ?? form?.ID_TIPO)}"
        data-tema="${this.escapeHtml(form?.TEMA)}">
        <a href="#${detailPath}" data-route="${this.escapeHtml(detailPath)}" class="forms-row-link uk-display-block uk-padding-small uk-card uk-card-default uk-card-body uk-border-rounded" style="${themeStyles}">
          <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
            <div class="uk-width-auto">
              <span uk-icon="icon: file-text"></span>
            </div>
            <div class="uk-width-expand">
              <h4
                class="uk-margin-remove-bottom uk-text-truncate"
                style="${titleStyles}"
                title="${this.escapeHtml(descripcion)}">${this.escapeHtml(descripcion)}</h4>
              <p class="forms-row-meta uk-margin-small-top uk-margin-small-bottom">
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
    const iconThemeStyles = this.getDesktopIconThemeStyle(form?.TEMA);

    return `
      <li
        class="uk-padding-small uk-padding-remove-top uk-padding-remove-bottom"
        data-clv="${this.escapeHtml(form?.CLV)}"
        data-item-number="${this.escapeHtml(form?.ITEM_NUMBER)}"
        data-tipo="${this.escapeHtml(form?.TIPO ?? form?.ID_TIPO)}"
        data-tema="${this.escapeHtml(form?.TEMA)}">
        <a href="#${detailPath}" data-route="${this.escapeHtml(detailPath)}" class="forms-row-link uk-display-block uk-border-rounded uk-padding-small">
          <div class="uk-flex uk-flex-middle uk-flex-between uk-grid-small" uk-grid>
            <div class="uk-width-expand">
              <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
                <div class="uk-width-auto">
                  <span class="forms-desktop-icon-pill" style="${iconThemeStyles}">
                    <span uk-icon="icon: file-text"></span>
                  </span>
                </div>
                <div class="uk-width-expand">
                  <h3
                    class="uk-margin-remove uk-text-truncate uk-text-default"
                    title="${this.escapeHtml(descripcion)}">${this.escapeHtml(descripcion)}</h3>
                </div>
              </div>
            </div>
            <div class="uk-width-auto">
              <span class="forms-row-meta uk-text-meta">Item: ${this.escapeHtml(form?.ITEM_NUMBER)}</span>
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

    return `background-color: ${theme.BARRA}; background-image: ${gradient}; color: ${theme.LETRA}; border-color: transparent;`;
  }

  getInlineThemeTitleStyle(idTema) {
    const theme = this.getThemeById(idTema);
    if (!theme) {
      return '';
    }

    return `color: ${theme.LETRA};`;
  }

  getDesktopIconThemeStyle(idTema) {
    const theme = this.getThemeById(idTema);
    if (!theme) {
      return '';
    }

    const fallbackGradient = 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 35%, rgba(0, 0, 0, 0.14) 100%)';
    const gradient = theme.GRADIENTE || fallbackGradient;

    return `background-color: ${theme.BARRA}; background-image: ${gradient}; color: ${theme.LETRA};`;
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
      .forms-row-link {
        color: inherit;
        text-decoration: none;
      }

      .forms-row-link:hover {
        color: inherit;
        text-decoration: none;
      }

      .forms-row-link [uk-icon] svg,
      .forms-row-link [uk-icon] {
        color: inherit;
      }

      .forms-row-meta {
        color: inherit;
        opacity: 0.9;
      }

      .forms-desktop-icon-pill {
        width: 2.15rem;
        height: 2.15rem;
        border-radius: 0.6rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .uk-visible\\@s .forms-row-link {
        transition: background-color 0.2s ease, border-color 0.2s ease;
        border-bottom: 1px solid var(--uk-border-color, #e5e5e5);
      }

      .uk-visible\\@s .forms-row-link:hover {
        /*background: var(--uk-muted-background, #f8f8f8);*/
        background: #f0f0f0;
        border-color: var(--uk-primary, #1e87f0);
      }

      .forms-page-title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 639px) {
        .forms-page-title-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          column-gap: 0.75rem;
          width: 100%;
        }

        .forms-page-title-text {
          text-align: right;
        }

        .forms-page-title-search-btn {
          justify-self: start;
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
