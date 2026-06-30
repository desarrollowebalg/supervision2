import { CatalogListPageBase } from '../shared/catalog-list-page.base.js';
import { getClientCuadrantes } from '../../core/services/apis-me/cuadrantes.service.js';

export default class Cuadrantes extends CatalogListPageBase {
  static instancia = null;

  constructor() {
    if (Cuadrantes.instancia) {
      return Cuadrantes.instancia;
    }

    super();
    Cuadrantes.instancia = this;
    this.allCuadrantes = [];
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.ensureCuadrantesStyles();

    this.renderCatalogListPage(container, {
      title: 'Cuadrantes',
      description: 'Consulta la informacion del catalogo de cuadrantes.',
      searchPlaceholder: 'Buscar por descripcion, item o subgrupo',
      searchInputId: 'cuadrantesSearchInput',
      stateContainerId: 'cuadrantesStateContainer'
    });

    this.bindCatalogMobileSearchToggle(container);
    this.bindSearch(container);
    this.loadCuadrantes(container);
  }

  bindSearch(container) {
    const searchInput = container.querySelector('#cuadrantesSearchInput');
    const stateContainer = container.querySelector('#cuadrantesStateContainer');
    if (!searchInput || !stateContainer) {
      return;
    }

    searchInput.addEventListener('input', () => {
      const query = String(searchInput.value || '').trim().toLowerCase();
      const filtered = this.allCuadrantes.filter((item) => {
        const description = String(item?.DESCRIPCION || '').toLowerCase();
        const itemNumber = String(item?.ITEM_NUMBER || '').toLowerCase();
        const subgroup = String(item?.SUBGRUPO || '').toLowerCase();
        return description.includes(query) || itemNumber.includes(query) || subgroup.includes(query);
      });

      this.renderCuadrantesList(stateContainer, filtered);
    });
  }

  async loadCuadrantes(container) {
    const stateContainer = container.querySelector('#cuadrantesStateContainer');
    if (!stateContainer) {
      return;
    }

    stateContainer.innerHTML = `
      <div class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner></div>
      </div>
    `;

    try {
      const cuadrantes = await getClientCuadrantes();
      this.allCuadrantes = Array.isArray(cuadrantes) ? cuadrantes : [];
      this.renderCuadrantesList(stateContainer, this.allCuadrantes);
    } catch (error) {
      stateContainer.innerHTML = `
        <div class="uk-alert-danger" uk-alert>
          <p>No fue posible cargar los cuadrantes.</p>
        </div>
      `;
    }
  }

  renderCuadrantesList(container, items) {
    this.renderCatalogList(container, {
      items,
      emptyMessage: 'No hay cuadrantes para mostrar.',
      mobileCounterLabel: 'Total de resultados',
      desktopHeaderLabel: 'Descripcion / Item Number / Subgrupo',
      renderMobileItem: (item) => this.renderMobileItem(item),
      renderDesktopItem: (item) => this.renderDesktopRow(item)
    });
  }

  renderMobileItem(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripcion');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');
    const subgroup = this.escapeHtml(item?.SUBGRUPO || '-');

    return `
      <li class="catalog-list__item">
        <article class="catalog-row catalog-row--mobile uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-small">
          <h3 class="uk-margin-remove-bottom uk-text-bold uk-text-truncate uk-text-default catalog-row__title" title="${description}">${description}</h3>
          <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Item: ${itemNumber}</p>
          <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Subgrupo: ${subgroup}</p>
        </article>
      </li>
    `;
  }

  renderDesktopRow(item) {
    const description = this.escapeHtml(item?.DESCRIPCION || 'Sin descripcion');
    const itemNumber = this.escapeHtml(item?.ITEM_NUMBER || '-');
    const subgroup = this.escapeHtml(item?.SUBGRUPO || '-');

    return `
      <li class="catalog-list__item uk-padding-small uk-padding-remove-top uk-padding-remove-bottom">
        <article class="catalog-row catalog-row--desktop uk-border-rounded uk-padding-small">
          <div class="uk-grid-small uk-flex-middle cuadrantes-row-grid" uk-grid>
            <div class="uk-width-expand">
              <h3 class="uk-margin-remove uk-text-truncate uk-text-default catalog-row__title" title="${description}">${description}</h3>
            </div>
            <div class="uk-width-auto cuadrantes-row-grid__meta">
              <p class="uk-margin-remove catalog-row__meta">Item: ${itemNumber}</p>
            </div>
            <div class="uk-width-auto cuadrantes-row-grid__meta">
              <p class="uk-margin-remove catalog-row__meta">Subgrupo: ${subgroup}</p>
            </div>
          </div>
        </article>
      </li>
    `;
  }

  ensureCuadrantesStyles() {
    if (document.getElementById('cuadrantes-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'cuadrantes-page-styles';
    style.textContent = `
      .cuadrantes-row-grid__meta {
        min-width: 10rem;
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }
}
