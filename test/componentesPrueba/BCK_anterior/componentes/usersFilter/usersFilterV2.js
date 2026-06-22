/**
 * Componente específico para filtrado de usuarios
 */
import FilterableListDialog from '../base/filterableListDialog.js';
import ServiceFactory from '../services/dataService.js';

class UsersFilter extends FilterableListDialog {
  constructor() {
    super();
    
    // Propiedades específicas para usuarios
    this.IDCLIENTE_U = 0;
    this.IDUSUARIO_U = 0;
    this.userService = ServiceFactory.getService('users');
  }

  static get observedAttributes() {
    return ['title', 'multiple'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.tituloComponenteGral = newValue;
    }
    if (name === 'multiple') {
      this.tipoComponenteSeleccion = newValue === 'true' ? 'checkbox' : 'radio';
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const styles = `
      :host {
        --primary-color: #1e87f0;
        --border-radius: 4px;
        --background-color: #f0f0f0;
      }

      .dialog {
        padding: 0;
        border-radius: var(--border-radius);
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
        border-bottom: 1px solid #e5e5e5;
      }

      .dialog-title {
        margin: 0;
        font-size: 1.4rem;
      }

      .dialog-body {
        padding: 1rem;
        overflow-y: auto;
        max-height: calc(80vh - 140px);
      }

      .dialog-footer {
        padding: 1rem;
        border-top: 1px solid #e5e5e5;
        text-align: right;
      }

      .search-input {
        width: 100%;
        padding: 0.5rem;
        font-size: 1.2rem;
        border-radius: var(--border-radius);
        border: 1px solid #ddd;
        background-color: var(--background-color);
        margin-bottom: 1rem;
      }

      .user-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .user-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border: 1px solid #ddd;
        margin-bottom: 0.5rem;
        border-radius: var(--border-radius);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 1rem;
      }

      .user-info {
        flex: 1;
      }

      .user-name {
        font-weight: bold;
        margin: 0;
      }

      .user-username {
        color: #666;
        margin: 0;
      }

      .button {
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        border: none;
        cursor: pointer;
        margin-left: 0.5rem;
      }

      .button-primary {
        background-color: var(--primary-color);
        color: white;
      }

      .button-default {
        background-color: #e5e5e5;
        color: #666;
      }

      .pagination {
        margin-top: 1rem;
        display: flex;
        justify-content: space-between;
      }

      .hidden {
        display: none;
      }
    `;

    const template = `
      <dialog class="dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">${this.tituloComponenteGral}</h3>
        </div>
        <div class="dialog-body">
          <input type="text" 
                 class="search-input" 
                 placeholder="Buscar ..." 
                 title="Escriba el nombre de un usuario o su nombre completo">
          <div class="user-list-container"></div>
        </div>
        <div class="dialog-footer">
          <button class="button button-default" data-action="close">Cerrar</button>
          <button class="button button-primary" data-action="add">Agregar usuario</button>
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
      if (value.length >= 3 || value.length === 0) {
        this.paginaActual = 0;
        this.filtroActual = value.length === 0 ? 'Ti9B' : this.b64EncodeUnicode(value);
        this.loadUsers();
      }
    }, 300));

    closeButton.addEventListener('click', () => {
      dialog.close();
    });

    addButton.addEventListener('click', () => {
      const selectedUsers = {};
      const inputs = this.shadowRoot.querySelectorAll(`input[name="user-select"]:checked`);
      
      if (inputs.length === 0) {
        this.showError('Error, seleccione por lo menos un Usuario del listado.');
        return;
      }

      inputs.forEach(input => {
        const userData = JSON.parse(input.dataset.user);
        selectedUsers[userData.ID_USUARIO] = userData;
      });

      dialog.close();
      this.dispatchEvent(new CustomEvent('userSelected', {
        detail: selectedUsers
      }));
    });
  }

  async show(idUsuario = 0, idCliente = 0, props = {}) {
    this.IDUSUARIO_U = idUsuario;
    this.IDCLIENTE_U = idCliente;
    this.objPropsComponente = props;
    
    if (props.tituloComponente) {
      this.tituloComponenteGral = props.tituloComponente;
      this.shadowRoot.querySelector('.dialog-title').textContent = this.tituloComponenteGral;
    }

    if (props.multiple === true) {
      this.tipoComponenteSeleccion = 'checkbox';
    }

    const dialog = this.shadowRoot.querySelector('dialog');
    dialog.showModal();
    
    await this.loadUsers();
  }

  async loadUsers() {
    const container = this.shadowRoot.querySelector('.user-list-container');
    container.innerHTML = '<div>Cargando...</div>';

    try {
      const start = this.paginaActual * this.registrosPorPagina + 1;
      const response = await this.userService.getUsers(
        this.IDCLIENTE_U, 
        this.filtroActual, 
        start, 
        this.registrosPorPagina,
        this.objPropsComponente
      );
      const result = JSON.parse(response);

      if (result.error === "1") {
        container.innerHTML = '<div class="error">No existen usuarios cargados.</div>';
        return;
      }

      const totalRegs = result.regs;
      const users = JSON.parse(result.data);
      const totalPaginas = Math.round(totalRegs / this.registrosPorPagina);

      this.renderUserList(container, users, totalRegs, totalPaginas);
    } catch (error) {
      container.innerHTML = '<div class="error">Error al cargar usuarios.</div>';
      console.error(error);
    }
  }

  renderUserList(container, users, totalRegs, totalPaginas) {
    const listHTML = document.createElement('div');
    listHTML.classList.add('user-list');

    users.forEach((user, index) => {
      const userItem = document.createElement('div');
      userItem.classList.add('user-item');
      userItem.innerHTML = `
        <input type="${this.tipoComponenteSeleccion}" 
               name="user-select" 
               id="user-${user.ID_USUARIO}"
               value="${user.ID_USUARIO}"
               data-user='${JSON.stringify(user)}'>
        <label for="user-${user.ID_USUARIO}" style="display: flex; align-items: center; width: 100%;">
          <img src="${user.FOTO}" class="user-avatar" alt="Foto de perfil">
          <div class="user-info">
            <p class="user-name">${user.NOMBRE}</p>
            <p class="user-username">${user.USUARIO}</p>
          </div>
        </label>
      `;
      listHTML.appendChild(userItem);
    });

    const paginationHTML = this.createPagination(totalPaginas);
    
    container.innerHTML = '';
    container.appendChild(listHTML);
    container.appendChild(paginationHTML);
  }

  createPagination(totalPaginas) {
    const pagination = document.createElement('div');
    pagination.classList.add('pagination');

    if (this.paginaActual > 0) {
      const prevButton = document.createElement('button');
      prevButton.classList.add('button', 'button-primary');
      prevButton.textContent = 'Anterior';
      prevButton.addEventListener('click', () => {
        this.paginaActual--;
        this.loadUsers();
      });
      pagination.appendChild(prevButton);
    }

    if (this.paginaActual < totalPaginas - 1) {
      const nextButton = document.createElement('button');
      nextButton.classList.add('button', 'button-primary');
      nextButton.textContent = 'Siguiente';
      nextButton.addEventListener('click', () => {
        this.paginaActual++;
        this.loadUsers();
      });
      pagination.appendChild(nextButton);
    }

    return pagination;
  }

  // La función getUsersCliente ha sido movida al servicio UsersService

  showError(message) {
    // Aquí podrías implementar tu propia lógica de mostrar errores
    alert(message);
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

  b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
      (match, p1) => String.fromCharCode('0x' + p1)));
  }
}

// Registrar el componente
customElements.define('users-filter', UsersFilter);

// Exportar la clase para su uso en módulos
export default UsersFilter;