import { CatalogListPageBase } from '../shared/catalog-list-page.base.js';
import { getAssignedPdis } from '../../core/services/apis-me/pdis.service.js';

export default class PuntosInteres extends CatalogListPageBase {
  static instancia = null;

  constructor() {
    if (PuntosInteres.instancia) {
      return PuntosInteres.instancia;
    }

    super();
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
    this.renderCatalogListPage(container, {
      title: 'Puntos de interés',
      description: 'Consulta información de los puntos de interés.',
      searchPlaceholder: 'Buscar por descripción',
      searchInputId: 'poiSearchInput',
      stateContainerId: 'poiStateContainer'
    });

    this.bindCatalogMobileSearchToggle(container);
    this.bindSearch(container);
    this.loadPdis(container);
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

    this.renderCatalogList(container, {
      items,
      emptyMessage: 'No hay puntos de interés para mostrar.',
      mobileCounterLabel: 'Total de resultados',
      desktopHeaderLabel: 'Descripción / Item Number',
      renderMobileItem: (item) => this.renderMobileItem(item),
      renderDesktopItem: (item) => this.renderDesktopRow(item)
    });
  }

  renderMobileItem(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripción');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');

    return `
      <li class="catalog-list__item">
        <article class="catalog-row catalog-row--mobile uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-small">
          <h3 class="uk-margin-remove-bottom uk-text-bold uk-text-truncate uk-text-default catalog-row__title" title="${description}">${description}</h3>
          <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Item: ${itemNumber}</p>
        </article>
      </li>
    `;
  }

  renderDesktopRow(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripción');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');

    return `
      <li class="catalog-list__item uk-padding-small uk-padding-remove-top uk-padding-remove-bottom">
        <article class="catalog-row catalog-row--desktop uk-border-rounded uk-padding-small">
          <h3 class="uk-margin-remove-bottom uk-text-truncate uk-text-default catalog-row__title" title="${description}">${description}</h3>
          <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Item: ${itemNumber}</p>
        </article>
      </li>
    `;
  }
}
