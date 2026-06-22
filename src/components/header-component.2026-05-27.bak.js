import './userAvatar.js';
import { storageService } from '../core/services/storage.service.js';

/**
 * Header Component - Web Component
 */
class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this._outsideClickHandler = null;
  }

  _confirmLogout() {
    return window.confirm('Vas a salir de la aplicacion. ¿Deseas continuar?');
  }

  static get observedAttributes() {
    return [
      'nombre-cliente',
      'razon-social',
      'nombre-usuario',
      'rol-usuario',
      'avatar-url',
      'notificaciones-count',
      'offline'
    ];
  }

  connectedCallback() {
    this.render();
    this._addStyles();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get nombreCliente() {
    return this.getAttribute('nombre-cliente') || 'App';
  }

  get razonSocial() {
    return this.getAttribute('razon-social') || '';
  }

  get nombreUsuario() {
    return this.getAttribute('nombre-usuario') || 'Usuario';
  }

  get rolUsuario() {
    return this.getAttribute('rol-usuario') || 'Sin rol';
  }

  get avatarUrl() {
    return storageService.getItem('fotoPerfil')
      || this.getAttribute('avatar-url')
      || 'https://app.movilizandome.net/public/images/userDesc.png';
  }

  get notificacionesCount() {
    const count = parseInt(this.getAttribute('notificaciones-count') || '0', 10);
    return count > 0 ? count : null;
  }

  get isOffline() {
    return this.getAttribute('offline') === 'true';
  }

  _addStyles() {
    if (document.getElementById('header-component-styles')) return;

    const style = document.createElement('style');
    style.id = 'header-component-styles';
    style.textContent = `
      header-component {
        display: block;
        width: 100%;
        height: 68px;
      }

      header-component .header-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 40;
        width: 100%;
        background: linear-gradient(135deg, #1e87f0 0%, #38b6ff 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        padding: 0.6rem 1rem;
      }

      header-component .header-wrapper.is-offline {
        background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
      }

      header-component .header-wrapper > .uk-flex {
        max-width: 1400px;
        margin: 0 auto;
      }

      header-component .logo-section {
        gap: 0.5rem;
      }

      header-component .menu-toggle-btn {
        display: none;
        border: 0;
        background: transparent;
        border-radius: 8px;
        padding: 0.45rem;
        color: #fff;
        cursor: pointer;
      }

      header-component .menu-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      header-component .app-name {
        color: #fff;
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        line-height: 1.2;
      }

      header-component .app-subtitle {
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.8rem;
        margin: 0;
      }

      header-component .offline-message {
        margin: 0.25rem 0 0;
        color: #f8fafc;
        font-size: 0.74rem;
        font-weight: 600;
      }

      header-component .actions-section {
        gap: 0.8rem;
        align-items: center;
      }

      header-component .action-btn {
        position: relative;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.45rem;
        border-radius: 999px;
        transition: background 0.2s;
        color: #fff;
      }

      header-component .action-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      header-component .notification-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: #fff;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 0.7rem;
        font-weight: 700;
        min-width: 18px;
        text-align: center;
        line-height: 1;
      }

      header-component .user-wrapper {
        position: relative;
      }

      header-component .user-info {
        gap: 0.75rem;
        align-items: center;
        cursor: pointer;
        padding: 0.35rem 0.6rem;
        border-radius: 10px;
        transition: background 0.2s;
      }

      header-component .user-info:hover,
      header-component .user-info.is-open {
        background: rgba(255, 255, 255, 0.15);
      }

      header-component .user-details {
        text-align: right;
        gap: 0.1rem;
      }

      header-component .user-name {
        color: #fff;
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
      }

      header-component .user-role {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }

      header-component .user-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      header-component .user-context-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 190px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
        padding: 6px;
        display: none;
        z-index: 60;
      }

      header-component .user-context-menu.is-open {
        display: block;
      }

      header-component .context-item {
        width: 100%;
        border: 0;
        background: transparent;
        text-align: left;
        border-radius: 8px;
        padding: 9px 10px;
        color: #1f2937;
        cursor: pointer;
      }

      header-component .context-item:hover {
        background: #f1f5f9;
      }

      @media (max-width: 1199px) {
        header-component .menu-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }

      @media (max-width: 960px) {
        header-component .header-wrapper {
          padding: 0.5rem 0.85rem;
        }

        header-component .app-subtitle,
        header-component .user-details,
        header-component .action-btn[data-action="settings"] {
          display: none;
        }
      }

      @media (max-width: 640px) {
        header-component .app-name {
          font-size: 1.1rem;
        }

        header-component .actions-section {
          gap: 0.4rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    const showBadge = this.notificacionesCount ? `<span class="notification-badge">${this.notificacionesCount}</span>` : '';
    const showSubtitle = this.razonSocial ? `<p class="app-subtitle" data-razon></p>` : '';
    const showOfflineMessage = this.isOffline ? '<p class="offline-message">Sin conexion a internet</p>' : '';
    const headerStateClass = this.isOffline ? 'header-wrapper is-offline' : 'header-wrapper';

    this.innerHTML = `
      <div class="${headerStateClass}">
        <div class="uk-flex uk-flex-between uk-flex-middle">
          <div class="uk-flex uk-flex-middle logo-section">
            <button class="menu-toggle-btn" data-action="menu-toggle" title="Abrir menú">
              <span uk-icon="icon: menu; ratio: 1.1"></span>
            </button>
            <div class="uk-flex uk-flex-column">
              <h1 class="app-name" data-nombre></h1>
              ${showSubtitle}
              ${showOfflineMessage}
            </div>
          </div>

          <div class="uk-flex actions-section">
            <!--<button class="action-btn" data-action="notifications" title="Notificaciones">
              <span uk-icon="icon: bell; ratio: 1.1"></span>
              ${showBadge}
            </button>-->

            <!--<button class="action-btn" data-action="settings" title="Configuración">
              <span uk-icon="icon: cog; ratio: 1.1"></span>
            </button>-->

            <div class="user-wrapper">
              <div class="user-info uk-flex" data-action="user-menu">
                <div class="uk-flex uk-flex-column user-details">
                  <span class="user-name" data-user-nombre></span>
                  <span class="user-role" data-user-rol></span>
                </div>
                <user-avatar-enhanced class="user-avatar" data-avatar></user-avatar-enhanced>
              </div>

              <div class="user-context-menu" data-user-context>
                <button class="context-item" data-action="user-profile">Perfil</button>
                <button class="context-item" data-action="user-settings">Configuración</button>
                <button class="context-item" data-action="user-logout">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const nombreElement = this.querySelector('[data-nombre]');
    const razonElement = this.querySelector('[data-razon]');
    const userNombreElement = this.querySelector('[data-user-nombre]');
    const userRolElement = this.querySelector('[data-user-rol]');
    const avatarElement = this.querySelector('[data-avatar]');

    if (nombreElement) nombreElement.textContent = this.nombreCliente;
    if (razonElement) razonElement.textContent = this.razonSocial;
    if (userNombreElement) userNombreElement.textContent = this.nombreUsuario;
    if (userRolElement) userRolElement.textContent = this.rolUsuario;
    if (avatarElement) {
      avatarElement.setAttribute('url', this.avatarUrl);
      avatarElement.setAttribute('nombre', this.nombreUsuario);
      avatarElement.setAttribute('size', '40px');
      avatarElement.setAttribute('fallback-url', 'https://app.movilizandome.net/public/images/userDesc.png');
    }

    this._bindEvents();
  }

  _bindEvents() {
    const notifBtn = this.querySelector('[data-action="notifications"]');
    const settingsBtn = this.querySelector('[data-action="settings"]');
    const menuToggleBtn = this.querySelector('[data-action="menu-toggle"]');
    const userMenu = this.querySelector('[data-action="user-menu"]');
    const userContext = this.querySelector('[data-user-context]');

    const setContextMenu = (open) => {
      userContext?.classList.toggle('is-open', open);
      userMenu?.classList.toggle('is-open', open);
    };

    menuToggleBtn?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('menu-toggle-click', { bubbles: true }));
    });

    notifBtn?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('notifications-click', {
        bubbles: true,
        detail: { count: this.notificacionesCount }
      }));
    });

    settingsBtn?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('settings-click', { bubbles: true }));
    });

    userMenu?.addEventListener('click', (event) => {
      event.stopPropagation();
      const shouldOpen = !userContext?.classList.contains('is-open');
      setContextMenu(shouldOpen);
      this.dispatchEvent(new CustomEvent('user-menu-click', {
        bubbles: true,
        detail: { nombre: this.nombreUsuario, rol: this.rolUsuario, open: shouldOpen }
      }));
    });

    this.querySelector('[data-action="user-profile"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('user-profile-click', { bubbles: true }));
      setContextMenu(false);
    });

    this.querySelector('[data-action="user-settings"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('user-settings-click', { bubbles: true }));
      setContextMenu(false);
    });

    this.querySelector('[data-action="user-logout"]')?.addEventListener('click', async () => {
      if (!this._confirmLogout()) {
        setContextMenu(false);
        return;
      }

      this.dispatchEvent(new CustomEvent('user-logout-click', { bubbles: true }));
      setContextMenu(false);
    });

    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
    }

    this._outsideClickHandler = (event) => {
      if (!this.contains(event.target)) {
        setContextMenu(false);
        return;
      }
      const insideUser = event.target.closest('.user-wrapper');
      if (!insideUser) setContextMenu(false);
    };

    document.addEventListener('click', this._outsideClickHandler);
  }

  disconnectedCallback() {
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  }
}

customElements.define('header-component', HeaderComponent);

export default HeaderComponent;
