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
    return this.getAttribute('nombre-cliente') || '';
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
        height: 4rem;
      }

      header-component .header-wrapper {        
        width: 100%;        
        padding: 0.4rem 1rem;                
        position: relative;
        box-shadow: 0 1px 0 rgba(15, 23, 42, 0.08);
        background-color: var(--app-header-bg, #ffffff);
        backdrop-filter: blur(12px);
        padding-left: 2rem;
        padding-right: 2rem;
        border-bottom: 1px solid var(--app-border, #f0f1f2);
        color: var(--app-text, #1f2937);
      }

      header-component .header-wrapper.is-offline {
        background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
      }

      header-component .header-wrapper > .uk-flex {
        /*max-width: 1400px;*/
        margin: 0 auto;
      }

      header-component .logo-section {
        gap: 0.5rem;
      }

      header-component .menu-toggle-btn {
        display: none;
        border: 0;
        background: var(--app-header-action, #64748b);
        border-radius: 8px;
        padding: 0.45rem;
        color: var(--app-primary-contrast, #fff);
        cursor: pointer;
      }

      header-component .menu-toggle-btn:hover {
        background: var(--app-header-action-hover, rgba(255, 255, 255, 0.15));
      }

      header-component .app-name {
        font-weight: 700;
        color: var(--app-text, #1f2937);
      }

      header-component .app-subtitle {        
        color: inherit;
        margin: 0;
        font-size: 0.75rem;
        line-height: 1rem;
        color: var(--app-text-muted, #6b7280);
      }

      header-component .offline-message {
        margin: 0.25rem 0 0;
        color: #f8fafc;
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
        color: var(--app-header-action, #334155);
      }

      header-component .action-btn:hover {
        background: var(--app-header-action-hover, rgba(148, 163, 184, 0.16));
      }

      header-component .notification-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: #fff;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 0.75rem;
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
        /*background: linear-gradient(145deg, #d8eafc 97%, #3f6f95 91%, #315f86 18%);*/        
      }

      header-component .user-info:hover,
      header-component .user-info.is-open {
        background: var(--app-header-user-hover, rgba(255, 255, 255, 0.8));
      }

      header-component .user-details {
        text-align: right;
        gap: 0.1rem;
      }

      header-component .user-name {        
        color: inherit;
        font-weight: 700;
        margin: 0;
        font-size: 0.75rem;
        line-height: 1rem;
        color: var(--app-text, #1f2937);
      }

      header-component .user-role {        
        color: inherit;
        text-transform: capitalize;
        letter-spacing: 0.5px;
        margin: 0;
        font-size: 10px;
        color: var(--app-text-soft, #9ca3af);
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
        background: var(--app-surface, #fff);
        border: 1px solid var(--app-border, #e5e7eb);
        border-radius: 10px;
        box-shadow: var(--app-shadow-soft, 0 8px 24px rgba(15, 23, 42, 0.15));
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
        color: var(--app-text, #1f2937);
        cursor: pointer;
      }

      header-component .context-item:hover {
        background: var(--app-surface-muted, #f1f5f9);
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
        header-component .actions-section {
          gap: 0.4rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    const showBadge = this.notificacionesCount ? `<span class="notification-badge">${this.notificacionesCount}</span>` : '';
    const showSubtitle = Boolean(this.razonSocial);
    const showOfflineMessage = this.isOffline;
    const headerStateClass = this.isOffline ? 'header-wrapper is-offline' : 'header-wrapper';

    this.innerHTML = `
      <div class="${headerStateClass}">
        <div class="uk-flex uk-flex-between uk-flex-middle">
          <div class="uk-flex uk-flex-middle logo-section">
            <button class="menu-toggle-btn" data-action="menu-toggle" title="Abrir menú">
              <span uk-icon="icon: menu; ratio: 1.1"></span>
            </button>
            <div class="uk-flex uk-flex-column">
              <h1 class="app-name uk-margin-remove uk-h4" data-nombre></h1>
              ${showSubtitle ? `<p class="app-subtitle uk-margin-remove uk-text-meta" data-razon></p>` : ''}
              ${showOfflineMessage ? '<p class="offline-message uk-margin-remove uk-text-meta">Sin conexion a internet</p>' : ''}
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
                  <span class="user-name uk-text-small" data-user-nombre></span>
                  <span class="user-role uk-text-meta uk-text-small" data-user-rol></span>
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
