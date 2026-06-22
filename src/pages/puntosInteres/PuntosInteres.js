import { renderInicioLayout } from '../inicio-layout.js';
import { getAssignedPdis } from '../../core/services/apis-me/pdis.service.js';

export default class PuntosInteres {
  static instancia = null;

  constructor() {
    if (PuntosInteres.instancia) {
      return PuntosInteres.instancia;
    }

    PuntosInteres.instancia = this;
    this.allPdis = [];
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.ensurePuntosInteresStyles();

    renderInicioLayout(container, {
      title: `
        <span class="poi-page-title-row">
          <span class="poi-page-title-text uk-text-left">Puntos de interés</span>
          <button
            type="button"
            class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-hidden@s poi-page-title-search-btn"
            data-poi-mobile-search-toggle
            aria-label="Mostrar buscador"
            aria-expanded="false">
            <span uk-icon="icon: search"></span>
          </button>
        </span>
      `,
      description: 'Consulta información de los puntos de interés.',
      contentHtml: `
        <div class="uk-grid-small uk-margin-small-bottom uk-flex-middle poi-search-row" uk-grid data-poi-search-row>
          <div class="uk-width-1-1 uk-width-expand@s">
            <div class="uk-inline uk-width-1-1 uk-width-medium@s uk-width-1-3@l">
              <span class="uk-form-icon" uk-icon="icon: search"></span>
              <input
                class="uk-input uk-background-muted uk-border-rounded inputTxtFrm"
                id="poiSearchInput"
                type="search"
                placeholder="Buscar por descripción">
            </div>
          </div>
        </div>
        <div id="poiStateContainer"></div>
      `
    });

    this.bindMobileSearchToggle(container);
    this.bindSearch(container);
    this.loadPdis(container);
  }

  bindMobileSearchToggle(container) {
    const toggleButton = container.querySelector('[data-poi-mobile-search-toggle]');
    const searchRow = container.querySelector('[data-poi-search-row]');
    if (!toggleButton || !searchRow) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const isOpen = searchRow.classList.toggle('is-mobile-search-open');
      toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  bindSearch(container) {
    const searchInput = container.querySelector('#poiSearchInput');
    const stateContainer = container.querySelector('#poiStateContainer');
    if (!searchInput || !stateContainer) {
      return;
    }

    searchInput.addEventListener('input', () => {
      const query = String(searchInput.value || '').trim().toLowerCase();
      const filtered = this.allPdis.filter((item) => {
        const description = String(item?.DESCRIPCION || '').toLowerCase();
        const itemNumber = String(item?.ITEM_NUMBER || '').toLowerCase();
        return description.includes(query) || itemNumber.includes(query);
      });

      this.renderPdisList(stateContainer, filtered);
    });
  }

  async loadPdis(container) {
    const stateContainer = container.querySelector('#poiStateContainer');
    if (!stateContainer) {
      return;
    }

    stateContainer.innerHTML = `
      <div class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner></div>
      </div>
    `;

    try {
      const pdis = await getAssignedPdis();
      this.allPdis = Array.isArray(pdis) ? pdis : [];
      this.renderPdisList(stateContainer, this.allPdis);
    } catch (error) {
      stateContainer.innerHTML = `
        <div class="uk-alert-danger" uk-alert>
          <p>No fue posible cargar los puntos de interés.</p>
        </div>
      `;
    }
  }

  renderPdisList(container, items) {
    if (!items.length) {
      container.innerHTML = `
        <div class="uk-alert-warning" uk-alert>
          <p>No hay puntos de interés para mostrar.</p>
        </div>
      `;
      return;
    }

    const mobileItems = items.map((item) => this.renderMobileItem(item)).join('');
    const desktopRows = items.map((item) => this.renderDesktopRow(item)).join('');

    container.innerHTML = `
      <div class="uk-hidden@s">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-top uk-margin-bottom">
          <span class="uk-text-meta">Total</span>
          <span class="uk-label">${items.length}</span>
        </div>
        <ul class="uk-list uk-margin-remove">
          ${mobileItems}
        </ul>
      </div>
      <div class="uk-visible@s">
        <div class="uk-margin-top">
          <div class="uk-flex uk-flex-between uk-flex-middle uk-padding-small uk-background-muted uk-border-rounded">
            <span class="uk-text-meta">Descripción / Item Number</span>
            <span class="uk-label">${items.length}</span>
          </div>
          <ul class="uk-list uk-margin-remove">
            ${desktopRows}
          </ul>
        </div>
      </div>
    `;
  }

  renderMobileItem(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripción');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');

    return `
      <li>
        <article class="poi-row uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-small">
          <h3 class="uk-margin-remove-bottom uk-text-bold uk-text-truncate uk-text-default poi-row__title" title="${description}">${description}</h3>
          <p class="uk-margin-small-top uk-margin-remove-bottom poi-row__meta">Item: ${itemNumber}</p>
        </article>
      </li>
    `;
  }

  renderDesktopRow(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripción');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');

    return `
      <li class="uk-padding-small uk-padding-remove-top uk-padding-remove-bottom">
        <article class="poi-row uk-border-rounded uk-padding-small">
          <h3 class="uk-margin-remove-bottom uk-text-truncate uk-text-default poi-row__title" title="${description}">${description}</h3>
          <p class="uk-margin-small-top uk-margin-remove-bottom poi-row__meta">Item: ${itemNumber}</p>
        </article>
      </li>
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

  ensurePuntosInteresStyles() {
    if (document.getElementById('poi-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'poi-page-styles';
    style.textContent = `
      .poi-row {
        border-bottom: 1px solid var(--uk-border-color, #e5e5e5);
        /*background: var(--uk-card-default-background, #fff);*/
      }
      
      .poi-row:hover {        
        background: #f0f0f0;
        border-color: var(--uk-primary, #1e87f0);
        cursor: pointer;
      }

      .poi-row__meta {
        color: #64748b;
      }

      .poi-page-title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 639px) {
        .poi-page-title-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          column-gap: 0.75rem;
          width: 100%;
        }

        .poi-page-title-text {
          text-align: left;
        }

        .poi-page-title-search-btn {
          justify-self: end;
        }

        .poi-search-row {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          margin-top: 0;
          margin-bottom: 0;
          transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease, margin 0.22s ease;
        }

        .poi-search-row.is-mobile-search-open {
          max-height: 120px;
          opacity: 1;
          transform: translateY(0);
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
      }

      @media (min-width: 640px) {
        .poi-search-row {
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
