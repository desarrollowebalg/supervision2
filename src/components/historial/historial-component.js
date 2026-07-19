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

    escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    buildInitials(name) {
        const normalized = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');

        return normalized || '?';
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    font-family: inherit;
                    color: var(--app-text, #1f2937);
                    color-scheme: light dark;
                    --history-card-bg: var(--app-surface-elevated, #ffffff);
                    --history-card-border: var(--app-border, #d0d7de);
                    --history-card-shadow: var(--app-shadow-soft, none);
                    --history-line-color: var(--app-border, #d0d7de);
                    --history-dot-color: var(--app-primary, #1e87f0);
                    --history-dot-ring: var(--app-surface, #ffffff);
                    --history-meta-color: var(--app-text-muted, #64748b);
                    --history-avatar-bg: var(--app-surface-muted, #e2e8f0);
                    --history-comment-bg: var(--app-surface, var(--app-input-bg, #f8fafc));
                    --history-comment-border: var(--app-border, #d0d7de);
                    --history-badge-success-bg: color-mix(in srgb, var(--app-success, #16a34a) 18%, transparent);
                    --history-badge-success-color: var(--app-success, #16a34a);
                    --history-badge-warning-bg: color-mix(in srgb, var(--app-warning, #d97706) 18%, transparent);
                    --history-badge-warning-color: var(--app-warning, #d97706);
                    --history-badge-danger-bg: color-mix(in srgb, var(--app-danger, #dc2626) 18%, transparent);
                    --history-badge-danger-color: var(--app-danger, #dc2626);
                    --history-badge-info-bg: color-mix(in srgb, var(--app-primary, #1e87f0) 18%, transparent);
                    --history-badge-info-color: var(--app-primary, #1e87f0);
                    --history-badge-default-bg: var(--app-surface-muted, #e2e8f0);
                    --history-badge-default-color: var(--app-text-muted, #64748b);
                }

                .historial-container {
                    position: relative;
                    padding: 1rem;
                    border-radius: 14px;
                    margin-bottom: 1rem;
                    margin-left: 20px;
                    background: var(--history-card-bg);
                    border: 1px solid var(--history-card-border);
                    box-shadow: var(--history-card-shadow);
                    color: var(--app-text, #1f2937);
                    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
                }

                .historial-container::before {
                    content: '';
                    position: absolute;
                    left: -20px;
                    top: 0;
                    bottom: -20px;
                    width: 2px;
                    background: var(--history-line-color);
                    z-index: 1;
                }

                .historial-container::after {
                    content: '';
                    position: absolute;
                    left: -25px;
                    top: 30px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--history-dot-color);
                    border: 2px solid var(--history-dot-ring);
                    z-index: 2;
                }

                .timestamp-container {
                    margin-bottom: 1rem;
                    padding-bottom: 0.65rem;
                    border-bottom: 1px solid var(--history-card-border);
                }

                .timestamp {
                    font-size: 0.875rem;
                    color: var(--history-dot-color);
                    font-weight: 600;
                }

                .historial-header {
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    margin-bottom: 0.85rem;
                }

                .user-photo,
                .user-photo-fallback {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    flex: 0 0 auto;
                }

                .user-photo {
                    object-fit: cover;
                    border: 1px solid var(--history-card-border);
                    background: var(--history-avatar-bg);
                }

                .user-photo-fallback {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--history-avatar-bg);
                    border: 1px solid var(--history-card-border);
                    color: var(--app-text, #1f2937);
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .user-info {
                    flex-grow: 1;
                    min-width: 0;
                }

                .user-name {
                    font-weight: 700;
                    margin: 0;
                    font-size: 0.95rem;
                    color: var(--app-text, #1f2937);
                }

                .user-username {
                    color: var(--history-meta-color);
                    font-size: 0.82rem;
                    margin: 0.2rem 0 0;
                }

                .badge {
                    padding: 0.28rem 0.7rem;
                    border-radius: 999px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    display: inline-block;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                    border: 1px solid transparent;
                    white-space: nowrap;
                }

                .badge.success {
                    background: var(--history-badge-success-bg);
                    color: var(--history-badge-success-color);
                }

                .badge.warning {
                    background: var(--history-badge-warning-bg);
                    color: var(--history-badge-warning-color);
                }

                .badge.danger {
                    background: var(--history-badge-danger-bg);
                    color: var(--history-badge-danger-color);
                }

                .badge.info {
                    background: var(--history-badge-info-bg);
                    color: var(--history-badge-info-color);
                }

                .badge.default {
                    background: var(--history-badge-default-bg);
                    color: var(--history-badge-default-color);
                }

                .comentario {
                    margin-top: 1rem;
                    font-size: 0.92rem;
                    line-height: 1.6;
                    padding: 0.75rem 0.85rem;
                    border-radius: 10px;
                    background: var(--history-comment-bg);
                    border: 1px solid var(--history-comment-border);
                    color: var(--app-text, #1f2937);
                    white-space: pre-line;
                    word-break: break-word;
                    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
                }

                .comentario.collapsed {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .toggle-comment {
                    color: var(--history-dot-color);
                    text-decoration: none;
                    cursor: pointer;
                    display: inline-block;
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .toggle-comment:hover {
                    text-decoration: underline;
                }

                @media (max-width: 640px) {
                    .historial-container {
                        margin-left: 16px;
                        padding: 0.9rem;
                    }

                    .historial-container::before {
                        left: -16px;
                    }

                    .historial-container::after {
                        left: -21px;
                    }

                    .historial-header {
                        align-items: flex-start;
                    }
                }
            </style>
        `;
    }

    getBadgeClass(estatus) {
        const normalizedStatus = String(estatus || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const statusMap = {
            completado: 'success',
            atendido: 'info',
            pendiente: 'warning',
            error: 'danger',
            'en-proceso': 'info',
            leido: 'default'
        };
        return statusMap[normalizedStatus] || 'default';
    }

    formatDateTime(fecha, hora) {
        const timestamp = [fecha, hora].filter(Boolean).join(' ').trim();
        if (!timestamp) {
            return '';
        }

        const normalized = timestamp.replace(' ', 'T');
        const parsedDate = new Date(normalized);
        if (Number.isNaN(parsedDate.getTime())) {
            return timestamp;
        }

        const formattedDate = parsedDate.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        const formattedTime = parsedDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${formattedDate} ${formattedTime}`;
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
        const safeNombreCompleto = this.escapeHtml(nombreCompleto);
        const safeUsuario = this.escapeHtml(usuario);
        const safeEstatus = this.escapeHtml(estatus);
        const safeComentario = this.escapeHtml(comentario);
        const safePhotoUrl = this.escapeHtml(fotoUsuario);
        const photoMarkup = fotoUsuario
            ? `<img class="user-photo" src="${safePhotoUrl}" alt="${safeNombreCompleto}" loading="lazy">`
            : `<span class="user-photo-fallback" aria-hidden="true">${this.escapeHtml(this.buildInitials(nombreCompleto || usuario))}</span>`;

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="historial-container">
                <div class="timestamp-container">
                    <span class="timestamp">${this.escapeHtml(this.formatDateTime(fecha, hora))}</span>
                </div>
                <div class="historial-header">
                    ${photoMarkup}
                    <div class="user-info">
                        <p class="user-name">${safeNombreCompleto || 'Sin nombre'}</p>
                        <p class="user-username">@${safeUsuario || 'sin-usuario'}</p>
                    </div>
                    <span class="badge ${this.getBadgeClass(estatus)}">${safeEstatus}</span>
                </div>
                ${comentario ? `
                    <div class="comentario ${comentario.length > 300 && !this.isCommentExpanded ? 'collapsed' : ''}">${safeComentario}</div>
                    ${comentario.length > 300 ? `
                        <a class="toggle-comment" data-action="toggle-comment">
                            ${this.isCommentExpanded ? 'Ver menos' : 'Ver mas'}
                        </a>
                    ` : ''}
                ` : ''}
            </div>
        `;

        const toggleButton = this.shadowRoot.querySelector('[data-action="toggle-comment"]');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleComment());
        }
    }
}

if (!customElements.get('historial-component')) {
    customElements.define('historial-component', HistorialComponent);
}
