class UserAvatarEnhanced extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._defaultImage = 'https://app.movilizandome.net/public/images/userDesc.png';
    this._states = {
      online: 'online',
      offline: 'offline',
      away: 'away'
    };
  }

  static get observedAttributes() {
    return [
      'url',
      'nombre',
      'size',
      'shape',
      'status',
      'notifications',
      'fallback-url',
      'show-name',
      'name-position'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.setupEventListeners();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  validateUrl(url) {
    if (!url) return this._defaultImage;
    try {
      new URL(url);
      return url;
    } catch {
      return this._defaultImage;
    }
  }

  getStatusColor(status) {
    const colors = {
      online: '#4CAF50',
      offline: '#9E9E9E',
      away: '#FFC107'
    };
    return colors[status] || colors.offline;
  }

  getStatusBorderColor(status) {
    const colors = {
      online: '#2E7D32',
      offline: '#616161',
      away: '#FFA000'
    };
    return colors[status] || colors.offline;
  }

  setupEventListeners() {
    const img = this.shadowRoot.querySelector('img');
    if (img) {
      img.addEventListener('click', this.handleClick.bind(this));
      img.addEventListener('error', this.handleImageError.bind(this));
    }

    // Soporte para teclado
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleClick(e);
      }
    });
  }

  handleClick(event) {
    const detail = {
      nombre: this.getAttribute('nombre'),
      url: this.getAttribute('url'),
      status: this.getAttribute('status'),
      notifications: this.getAttribute('notifications')
    };

    this.dispatchEvent(new CustomEvent('user-click', {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  handleImageError() {
    const fallbackUrl = this.getAttribute('fallback-url') || this._defaultImage;
    const img = this.shadowRoot.querySelector('img');
    if (img) {
      img.src = fallbackUrl;
    }
  }

  render() {
    const url = this.validateUrl(this.getAttribute('url'));
    const nombre = this.getAttribute('nombre') || 'Usuario';
    const size = this.getAttribute('size') || '100px';
    const shape = this.getAttribute('shape') || 'circle';
    const status = this.getAttribute('status');
    const notifications = this.getAttribute('notifications') || '0';
    const statusColor = status ? this.getStatusColor(status) : null;
    const statusBorderColor = status ? this.getStatusBorderColor(status) : null;
    const showName = this.getAttribute('show-name') === 'true';
    const namePosition = this.getAttribute('name-position') || 'bottom';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .avatar-container {
          position: relative;
          display: inline-flex;
          flex-direction: ${namePosition === 'left' ? 'row' : namePosition === 'right' ? 'row-reverse' : 'column'};
          align-items: center;
          gap: 10px;
        }

        .avatar {
          text-align: center !important;
          position: relative;
        }

        .avatar img {
          width: ${size};
          height: ${size};
          max-width: 100%;
          height: auto;
          box-sizing: border-box;
          vertical-align: middle;
          aspect-ratio: auto 100 / 100;
          overflow-clip-margin: content-box;
          overflow: clip;
          border-radius: ${shape === 'circle' ? '50%' : shape === 'rounded' ? '10px' : '0'};
          box-shadow: 0 14px 25px rgba(0, 0, 0, .16);
          margin-left: auto;
          margin-right: auto;
          ${status ? `border: 3px solid ${statusBorderColor};` : ''}
          padding: 2px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;          
        }

        .avatar img:hover {
          transform: scale(1.05);
          box-shadow: 0 16px 30px rgba(0, 0, 0, .2);
          ${status ? `border-color: ${statusColor};` : ''}
        }

        ${status ? `
        .status-indicator {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${statusColor};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        ` : ''}

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #f44336;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: bold;
          min-width: 18px;
          text-align: center;
          display: ${notifications !== '0' ? 'block' : 'none'};
        }

        .user-name {
          font-size: 14px;
          color: #333;
          margin-top: ${namePosition === 'bottom' ? '8px' : '0'};
          text-align: center;
          max-width: ${size};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tooltip {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .avatar-container:hover .tooltip {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .avatar img {
            /*width: calc(${size} * 0.8);*/
            /*height: calc(${size} * 0.8);*/
          }
        }
      </style>
      <div class="avatar-container">
        <div class="avatar">
          <img 
            src="${url}" 
            alt="${nombre}" 
            title="${nombre}"
            tabindex="0"
            role="button"
            aria-label="Ver perfil de ${nombre}"
          >
          ${status ? `<div class="status-indicator"></div>` : ''}
          <div class="notification-badge">${notifications}</div>
        </div>
        ${showName ? `<div class="user-name">${nombre}</div>` : ''}
        <div class="tooltip">
          ${nombre}
          ${status ? ` (${status})` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('user-avatar-enhanced', UserAvatarEnhanced); 