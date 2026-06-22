class HistorialComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isCommentExpanded = false;
    }

    static get observedAttributes() {
        return ['fecha', 'hora', 'usuario', 'nombre-completo', 'foto-usuario', 'estatus', 'comentario'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }

                .historial-container {
                    position: relative;
                    padding: 1rem;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    margin-left: 20px;
                    background-color: #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .historial-container::before {
                    content: '';
                    position: absolute;
                    left: -20px;
                    top: 0;
                    bottom: -20px;
                    width: 2px;
                    background-color: #e5e5e5;
                    z-index: 1;
                }

                .historial-container::after {
                    content: '';
                    position: absolute;
                    left: -24px;
                    top: 30px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: #0366d6;
                    z-index: 2;
                }

                .timestamp-container {
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #e5e5e5;
                }

                .timestamp {
                    font-size: 0.875rem;
                    color: #0366d6;
                    font-weight: 500;
                }

                .historial-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .user-photo {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .user-info {
                    flex-grow: 1;
                }

                .user-name {
                    font-weight: 600;
                    margin: 0;
                    font-size: .9rem;
                    color: #24292e;
                }

                .user-username {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0.25rem 0;
                }

                .datetime {
                    font-size: 0.875rem;
                    color: #666;
                }

                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: inline-block;
                }

                /* Variables CSS para los estilos de los badges */
                :host {
                    --badge-success-bg: #28a745;
                    --badge-success-color: white;
                    --badge-warning-bg: #ffc107;
                    --badge-warning-color: #000;
                    --badge-danger-bg: #dc3545;
                    --badge-danger-color: white;
                    --badge-info-bg: #17a2b8;
                    --badge-info-color: white;
                    --badge-default-bg: #6c757d;
                    --badge-default-color: white;
                }

                .badge.success {
                    background-color: var(--badge-success-bg);
                    color: var(--badge-success-color);
                }

                .badge.warning {
                    background-color: var(--badge-warning-bg);
                    color: var(--badge-warning-color);
                }

                .badge.danger {
                    background-color: var(--badge-danger-bg);
                    color: var(--badge-danger-color);
                }

                .badge.info {
                    background-color: var(--badge-info-bg);
                    color: var(--badge-info-color);
                }

                .badge.default {
                    background-color: var(--badge-default-bg);
                    color: var(--badge-default-color);
                }

                .comentario {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: #24292e;
                    padding: 0.5rem;
                    background-color: #f6f8fa;
                    border-radius: 4px;
                }

                .comentario.collapsed {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .toggle-comment {
                    color: #0366d6;
                    text-decoration: none;
                    cursor: pointer;
                    display: inline-block;
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                }

                .toggle-comment:hover {
                    text-decoration: underline;
                }
            </style>
        `;
    }

    getBadgeClass(estatus) {
        const statusMap = {
            'completado': 'success',
            'pendiente': 'warning',
            'error': 'danger',
            'en-proceso': 'info'
        };
        return statusMap[estatus.toLowerCase()] || 'default';
    }

    formatDateTime(fecha, hora) {
        if (!fecha) return '';
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        return hora ? `${fechaFormateada} ${hora}` : fechaFormateada;
    }

    toggleComment() {
        this.isCommentExpanded = !this.isCommentExpanded;
        this.render();
    }

    render() {
        const fecha = this.getAttribute('fecha') || '';
        const hora = this.getAttribute('hora') || '';
        const usuario = this.getAttribute('usuario') || '';
        const nombreCompleto = this.getAttribute('nombre-completo') || '';
        const fotoUsuario = this.getAttribute('foto-usuario') || '';
        const estatus = this.getAttribute('estatus') || 'default';
        const comentario = this.getAttribute('comentario') || '';

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="historial-container">
                <div class="timestamp-container">
                    <span class="timestamp">${this.formatDateTime(fecha, hora)}</span>
                </div>
                <div class="historial-header">
                    <img class="user-photo" src="${fotoUsuario}" alt="${nombreCompleto}">
                    <div class="user-info">
                        <p class="user-name">${nombreCompleto}</p>
                        <p class="user-username">@${usuario}</p>
                    </div>
                    <span class="badge ${this.getBadgeClass(estatus)}">${estatus}</span>
                </div>
                ${comentario ? `
                    <div class="comentario ${comentario.length > 300 && !this.isCommentExpanded ? 'collapsed' : ''}">${comentario}</div>
                    ${comentario.length > 300 ? `
                        <a class="toggle-comment" data-action="toggle-comment">
                            ${this.isCommentExpanded ? 'Ver menos' : 'Ver más'}
                        </a>
                    ` : ''}
                ` : ''}
            </div>
        `;

        // Agregar event listener para el botón de toggle
        const toggleButton = this.shadowRoot.querySelector('[data-action="toggle-comment"]');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleComment());
        }
    }
}

customElements.define('historial-component', HistorialComponent);
