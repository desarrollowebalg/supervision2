/**
 * Componente base para listas filtrables con paginación
 */
class FilterableListDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Propiedades base
    this.currentPage = 0;
    this.itemsPerPage = 30;
    this.currentFilter = '';
    this.config = {
      title: 'Seleccionar item',
      multiple: false,
      searchPlaceholder: 'Buscar...',
      searchMinLength: 3,
      addButtonText: 'Agregar selección',
      closeButtonText: 'Cerrar',
      noResultsText: 'No hay resultados',
      loadingText: 'Cargando...',
      errorText: 'Error al cargar datos'
    };
  }

  static get observedAttributes() {
    return ['title', 'multiple'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.config.title = newValue;
      const titleElement = this.shadowRoot?.querySelector('.dialog-title');
      if (titleElement) titleElement.textContent = newValue;
    }
    if (name === 'multiple') {
      this.config.multiple = newValue === 'true';
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const styles = `
      :host {
        --fl-primary-color: #1e87f0;
        --fl-border-radius: 4px;
        --fl-background-color: #f0f0f0;
        --fl-border-color: #e5e5e5;
        --fl-text-color: #333;
        --fl-text-secondary: #666;
      }

      .dialog {
        padding: 0;
        border-radius: var(--fl-border-radius);
        border: none;
        width: 80vw;
        max-width: 600px;
        max-height: 80vh;
      }

      .dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }

      .dialog-header {
        padding: 1rem;
        border-bottom: 1px solid var(--fl-border-color);
      }

      .dialog-title {
        margin: 0;
        font-size: 1.4rem;
        color: var(--fl-text-color);
      }

      .dialog-body {
        padding: 1rem;
        overflow-y: auto;
        max-height: calc(80vh - 140px);
      }

      .dialog-footer {
        padding: 1rem;
        border-top: 1px solid var(--fl-border-color);
        text-align: right;
      }

      .search-input {
        width: 100%;
        padding: 0.5rem;
        font-size: 1.2rem;
        border-radius: var(--fl-border-radius);
        border: 1px solid var(--fl-border-color);
        background-color: var(--fl-background-color);
        margin-bottom: 1rem;
      }

      .items-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .list-item {
        padding: 0.5rem;
        border: 1px solid var(--fl-border-color);
        margin-bottom: 0.5rem;
        border-radius: var(--fl-border-radius);
      }

      .button {
        padding: 0.5rem 1rem;
        border-radius: var(--fl-border-radius);
        border: none;
        cursor: pointer;
        margin-left: 0.5rem;
      }

      .button-primary {
        background-color: var(--fl-primary-color);
        color: white;
      }

      .button-default {
        background-color: var(--fl-background-color);
        color: var(--fl-text-secondary);
      }

      .pagination {
        margin-top: 1rem;
        display: flex;
        justify-content: space-between;
      }

      .error, .no-results {
        color: var(--fl-text-secondary);
        text-align: center;
        padding: 1rem;
      }

      .hidden {
        display: none;
      }
    `;

    const template = `
      <dialog class="dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">${this.config.title}</h3>
        </div>
        <div class="dialog-body">
          <input type="text" 
                 class="search-input" 
                 placeholder="${this.config.searchPlaceholder}">
          <div class="items-container"></div>
        </div>
        <div class="dialog-footer">
          <button class="button button-default" data-action="close">
            ${this.config.closeButtonText}
          </button>
          <button class="button button-primary" data-action="add">
            ${this.config.addButtonText}
          </button>
        </div>
      </dialog>
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${template}
    `;
  }

  setupEventListeners() {
    const dialog = this.shadowRoot.querySelector('dialog');
    const searchInput = this.shadowRoot.querySelector('.search-input');
    const closeButton = this.shadowRoot.querySelector('[data-action="close"]');
    const addButton = this.shadowRoot.querySelector('[data-action="add"]');

    searchInput.addEventListener('input', this.debounce(() => {
      const value = searchInput.value;
      if (value.length >= this.config.searchMinLength || value.length === 0) {
        this.currentPage = 0;
        this.currentFilter = value;
        this.loadItems();
      }
    }, 300));

    closeButton.addEventListener('click', () => {
      dialog.close();
      this.dispatchEvent(new CustomEvent('dialogClosed'));
    });

    addButton.addEventListener('click', () => {
      const selectedItems = this.getSelectedItems();
      if (selectedItems.size === 0) {
        this.showError(this.config.noSelectionText);
        return;
      }

      dialog.close();
      this.dispatchEvent(new CustomEvent('itemsSelected', {
        detail: Array.from(selectedItems)
      }));
    });
  }

  // Método a ser implementado por las clases hijas
  async fetchItems(filter, start, limit) {
    throw new Error('fetchItems debe ser implementado por la clase hija');
  }

  // Método a ser implementado por las clases hijas
  renderItem(item) {
    throw new Error('renderItem debe ser implementado por la clase hija');
  }

  async loadItems() {
    const container = this.shadowRoot.querySelector('.items-container');
    container.innerHTML = `<div class="loading">${this.config.loadingText}</div>`;

    try {
      const start = this.currentPage * this.itemsPerPage;
      const items = await this.fetchItems(this.currentFilter, start, this.itemsPerPage);
      
      if (!items || items.length === 0) {
        container.innerHTML = `<div class="no-results">${this.config.noResultsText}</div>`;
        return;
      }

      this.renderItems(container, items);
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="error">${this.config.errorText}</div>`;
    }
  }

  renderItems(container, items) {
    const listContainer = document.createElement('div');
    listContainer.classList.add('items-list');

    items.forEach(item => {
      const itemElement = this.renderItem(item);
      if (itemElement) {
        listContainer.appendChild(itemElement);
      }
    });

    container.innerHTML = '';
    container.appendChild(listContainer);
    
    // Agregar paginación si es necesario
    if (items.totalPages > 1) {
      container.appendChild(this.createPagination(items.totalPages));
    }
  }

  createPagination(totalPages) {
    const pagination = document.createElement('div');
    pagination.classList.add('pagination');

    if (this.currentPage > 0) {
      const prevButton = document.createElement('button');
      prevButton.classList.add('button', 'button-primary');
      prevButton.textContent = 'Anterior';
      prevButton.addEventListener('click', () => {
        this.currentPage--;
        this.loadItems();
      });
      pagination.appendChild(prevButton);
    }

    if (this.currentPage < totalPages - 1) {
      const nextButton = document.createElement('button');
      nextButton.classList.add('button', 'button-primary');
      nextButton.textContent = 'Siguiente';
      nextButton.addEventListener('click', () => {
        this.currentPage++;
        this.loadItems();
      });
      pagination.appendChild(nextButton);
    }

    return pagination;
  }

  getSelectedItems() {
    const selectedInputs = this.shadowRoot.querySelectorAll('input[name="item-select"]:checked');
    return new Set(Array.from(selectedInputs).map(input => JSON.parse(input.dataset.item)));
  }

  showError(message) {
    // Implementación básica de error, puede ser sobrescrita
    alert(message);
  }

  show(config = {}) {
    this.config = { ...this.config, ...config };
    const dialog = this.shadowRoot.querySelector('dialog');
    dialog.showModal();
    this.loadItems();
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Registrar el componente base
customElements.define('filterable-list-dialog', FilterableListDialog);

export default FilterableListDialog;