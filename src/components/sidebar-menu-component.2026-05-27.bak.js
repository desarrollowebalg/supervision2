import './userAvatar.js';
import { storageService } from '../core/services/storage.service.js';

class SidebarMenuComponent extends HTMLElement {
  static COLLAPSE_STORAGE_KEY = 'sidebarCollapsed';

  static get observedAttributes() {
    return ['collapsed'];
  }

  constructor() {
    super();
    this._onHashChange = () => this._syncActiveRoute();
  }

  connectedCallback() {
    this._hydrateCollapsedFromStorage();
    this._ensureStyles();
    this.render();
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && name === 'collapsed') {
      this._syncCollapsedState();
    }
  }

  get items() {
    return [
      { path: '/inicio', label: 'Inicio', icon: 'home' },
      { path: '/formularios', label: 'Formularios', icon: 'file-text' },
      { path: '/puntos-interes', label: 'Puntos de interes', icon: 'location' },
      { path: '/tareas', label: 'Tareas', icon: 'check' }
    ];
  }

  get sentItems() {
    return [
      { path: '/timeline', label: 'Bandeja de salida', icon: 'clock' }
    ];
  }

  get syncItem() {
    return { label: 'Descargar datos', icon: 'download' };
  }

  get collapsed() {
    return this.getAttribute('collapsed') === 'true';
  }

  get logoClienteUrl() {
    return storageService.getItem('logoCliente') || this.getAttribute('logo-cliente-url') || '';
  }

  get nombreCliente() {
    return this.getAttribute('nombre-cliente') || 'Cliente';
  }

  set collapsed(value) {
    this.setAttribute('collapsed', value ? 'true' : 'false');
  }

  _ensureStyles() {
    if (document.getElementById('sidebar-menu-component-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'sidebar-menu-component-styles';
    style.textContent = `
      sidebar-menu-component {
        display: block;
        height: 100%;
      }

      .sidebar-menu-button-icon{
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 1px solid #c1c1c1;
        color: #fff!important;
        padding: 0;
        background: #888;
      }

      sidebar-menu-component [data-role='brand-avatar-wrap'] {
        position: relative;
      }

      sidebar-menu-component [data-role='desktop-toggle'] {
        position: absolute;
        top: 0;
        right: 0;
      }

      sidebar-menu-component[data-collapsed='true'] [data-role='desktop-toggle'] {
        position: static;
        margin-top: 0.9rem;
        display: flex;
        justify-content: center;
      }

      sidebar-menu-component[data-collapsed='true'] .sidebar-menu-button-icon {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1 / 1;
        line-height: 1;
      }

      sidebar-menu-component [data-role='panel'] {
        height: 100%;
        border-radius: 14px;
        background: var(--uk-muted-background, #f8f8f8);
        border: 1px solid var(--uk-border-color, #e5e5e5);
        box-shadow: 0 10px 24px rgba(20, 20, 20, 0.06);
      }

      sidebar-menu-component [data-role='brand-icon'] {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        background: rgba(153, 153, 153, 0.16);
      }

      sidebar-menu-component [data-role='brand-avatar'] {
        display: flex;
        justify-content: center;
      }

      sidebar-menu-component [data-role='nav-link'] {
        color: #111827;
        font-weight: 500;
        border-radius: 0.75rem;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      sidebar-menu-component [data-role='nav-list'] > li + li {
        margin-top: 0.7rem;
      }

      sidebar-menu-component [data-role='section-title'] {
        color: #475569;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      sidebar-menu-component [data-role='nav-link']:hover,
      sidebar-menu-component [data-role='nav-list'] > li.uk-active > [data-role='nav-link'] {
        background: rgba(102, 173, 244, 0.16);
        color: #0f172a;
      }

      sidebar-menu-component [data-role='nav-list'] > li.uk-active > [data-role='nav-link'] {
        border: 1px solid rgba(30, 135, 240, 0.28);
      }

      sidebar-menu-component [data-role='icon-slot'] {
        width: 1.5rem;
      }

      sidebar-menu-component [data-role='profile-card'] {
        border-top: 1px solid var(--uk-border-color, #e5e5e5);
      }

      sidebar-menu-component[data-collapsed='true'] [data-role='brand-text'],
      sidebar-menu-component[data-collapsed='true'] [data-role='nav-text'],
      sidebar-menu-component[data-collapsed='true'] [data-role='section-title'],
      sidebar-menu-component[data-collapsed='true'] [data-role='profile-meta'],
      sidebar-menu-component[data-collapsed='true'] [data-role='logout-text'] {
        display: none;
      }

      sidebar-menu-component[data-collapsed='true'] [data-role='brand-row'],
      sidebar-menu-component[data-collapsed='true'] [data-role='nav-link'],
      sidebar-menu-component[data-collapsed='true'] [data-role='profile-card'] {
        justify-content: center;
      }

      sidebar-menu-component[data-collapsed='true'] [data-role='profile-card'] {
        padding-left: 0;
        padding-right: 0;
      }

      @media (max-width: 1199px) {
        sidebar-menu-component [data-role='desktop-toggle'] {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  render() {
    this.innerHTML = `
      <div class="uk-card uk-card-body uk-padding-small uk-flex uk-flex-column" data-role="panel">
        <div class="uk-margin-small-bottom" data-role="brand-avatar-wrap">
          <div data-role="brand-avatar">
            <user-avatar-enhanced
              data-role="client-avatar"
              nombre="${this.nombreCliente}"
              size="120px"
              shape="rounded"
              show-name="false">
            </user-avatar-enhanced>
          </div>

          <div data-role="desktop-toggle" class="uk-visible@s">
            <button type="button" class="uk-button uk-icon-button sidebar-menu-button-icon" data-action="toggle-sidebar" title="Expandir o colapsar menu">
              <span uk-icon="icon: chevron-left"></span>
            </button>
          </div>
        </div>

        <div class="uk-flex uk-flex-middle uk-flex-between uk-margin-small-bottom uk-margin-small-top">
          <div class="uk-flex uk-flex-middle uk-grid-small" data-role="brand-row" uk-grid>
            <div class="uk-width-auto">
              <!--<span class="uk-flex uk-flex-center uk-flex-middle" data-role="brand-icon">
                <span uk-icon="icon: grid; ratio: 1"></span>
              </span>-->
            </div>
            <div class="uk-width-expand" data-role="brand-text">
              <div class="uk-text-bold">Movilzandome</div>
              <div class="uk-text-meta uk-hidden">Módulos</div>
            </div>
          </div>

          <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
            <div class="uk-width-auto uk-hidden@l">
              <button type="button" class="uk-icon-button" data-action="close-sidebar" title="Cerrar menu">
                <span uk-icon="icon: close"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="uk-margin-small-top uk-hidden">
          <div class="uk-margin-small-bottom uk-padding-small-left" data-role="section-title">Perfil</div>
          
        </div>

        <div class="uk-margin-small-top">
          <div class="uk-margin-small-bottom uk-padding-small-left" data-role="section-title">Menú</div>
          <ul class="uk-nav uk-nav-default uk-margin-remove" data-role="nav-list">
            ${this.items.map((item) => `
              <li data-role="nav-item">
                <a class="uk-flex uk-flex-middle uk-padding-small" data-role="nav-link" href="#${item.path}" data-route="${item.path}" title="${item.label}">
                  <span class="uk-inline uk-text-center" data-role="icon-slot" uk-icon="icon: ${item.icon}; ratio: 1.4"></span>
                  <span class="uk-margin-small-left" data-role="nav-text">${item.label}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="uk-margin-medium-top">
          <div class="uk-margin-small-bottom uk-padding-small-left" data-role="section-title">Enviados</div>
          <ul class="uk-nav uk-nav-default uk-margin-remove" data-role="nav-list">
            ${this.sentItems.map((item) => `
              <li data-role="nav-item">
                <a class="uk-flex uk-flex-middle uk-padding-small" data-role="nav-link" href="#${item.path}" data-route="${item.path}" title="${item.label}">
                  <span class="uk-inline uk-text-center" data-role="icon-slot" uk-icon="icon: ${item.icon}; ratio: 1"></span>
                  <span class="uk-margin-small-left" data-role="nav-text">${item.label}</span>
                </a>
              </li>
            `).join('')}
            <li data-role="nav-item">
              <!-- <button class="uk-button uk-button-text uk-flex uk-flex-middle uk-padding-small uk-width-1-1" data-role="nav-link" data-action="manual-sync" type="button" title="${this.syncItem.label}">
                <span class="uk-inline uk-text-center" data-role="icon-slot" uk-icon="icon: ${this.syncItem.icon}; ratio: 1"></span>
                <span class="uk-margin-small-left" data-role="nav-text">${this.syncItem.label}</span>
              </button> -->
              <a class="uk-flex uk-flex-middle uk-padding-small" data-role="nav-link" data-action="manual-sync" title="${this.syncItem.label}">
                <span class="uk-inline uk-text-center" data-role="icon-slot" uk-icon="icon: ${this.syncItem.icon}; ratio: 1"></span>
                <span class="uk-margin-small-left" data-role="nav-text">${this.syncItem.label}</span>
              </a>
            </li>
          </ul>
        </div>

        <!--<div class="uk-margin-auto-top uk-padding-small-top uk-flex uk-flex-middle uk-grid-small" data-role="profile-card" uk-grid>
          <div class="uk-width-expand" data-role="profile-meta">
            <div class="uk-text-small uk-text-bold">AdminElim</div>
            <div class="uk-text-meta uk-light">admin@movilizandome</div>
          </div>
          <div class="uk-width-auto">
            <button type="button" class="uk-button uk-button-text uk-light" data-action="logout" title="Cerrar sesion">
              <span class="uk-flex uk-flex-middle">
                <span uk-icon="icon: sign-out"></span>
                <span class="uk-margin-small-left" data-role="logout-text">Salir</span>
              </span>
            </button>
          </div>
        </div>-->
      </div>
    `;

    const clientAvatarElement = this.querySelector('[data-role="client-avatar"]');
    if (clientAvatarElement) {
      clientAvatarElement.setAttribute('url', this.logoClienteUrl);
      clientAvatarElement.setAttribute('fallback-url', 'https://app.movilizandome.net/public/images/userDesc.png');
      clientAvatarElement.setAttribute('nombre', this.nombreCliente);
    }

    this._bindEvents();
    this._syncCollapsedState();
    this._syncActiveRoute();
  }

  _bindEvents() {
    this.querySelector('[data-action="toggle-sidebar"]')?.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      storageService.setItem(SidebarMenuComponent.COLLAPSE_STORAGE_KEY, this.collapsed);
      this.dispatchEvent(new CustomEvent('sidebar-collapsed-change', {
        bubbles: true,
        detail: { collapsed: this.collapsed }
      }));
    });

    this.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sidebar-logout-click', { bubbles: true }));
    });

    this.querySelector('[data-action="close-sidebar"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sidebar-close-click', { bubbles: true }));
    });

    this.querySelector('[data-action="manual-sync"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sidebar-manual-sync-click', { bubbles: true }));
    });
  }

  _syncCollapsedState() {
    this.setAttribute('data-collapsed', this.collapsed ? 'true' : 'false');

    const toggleIcon = this.querySelector('[data-action="toggle-sidebar"] [uk-icon]');
    if (toggleIcon) {
      toggleIcon.setAttribute('uk-icon', `icon: ${this.collapsed ? 'chevron-right' : 'chevron-left'}`);
    }
  }

  _hydrateCollapsedFromStorage() {
    const storedCollapsed = storageService.getItem(SidebarMenuComponent.COLLAPSE_STORAGE_KEY);
    const normalizedValue = storedCollapsed === true || storedCollapsed === 'true'
      ? true
      : storedCollapsed === false || storedCollapsed === 'false'
        ? false
        : null;

    if (normalizedValue !== null) {
      this.collapsed = normalizedValue;
    }
  }

  _syncActiveRoute() {
    const currentPath = window.location.hash.slice(1).split('?')[0] || '/inicio';
    const links = this.querySelectorAll('[data-route]');

    links.forEach((link) => {
      const isActive = link.getAttribute('data-route') === currentPath;
      const item = link.closest('[data-role="nav-item"]');
      item?.classList.toggle('uk-active', isActive);
    });
  }
}

customElements.define('sidebar-menu-component', SidebarMenuComponent);

export default SidebarMenuComponent;
