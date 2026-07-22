class CommentHistoryItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['fecha', 'hora', 'usuario', 'nombre-completo', 'foto-usuario', 'comentario', 'variant'];
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

    isTimelineVariant() {
        return (this.getAttribute('variant') || '').trim().toLowerCase() === 'timeline';
    }

    getStyles() {
        if (this.isTimelineVariant()) {
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
                    }

                    .timeline-comment {
                        position: relative;
                        padding: 1rem;
                        border-radius: 14px;
                        margin-bottom: 1rem;
                        margin-left: 20px;
                        background: var(--history-card-bg);
                        border: 1px solid var(--history-card-border);
                        box-shadow: var(--history-card-shadow);
                        color: var(--app-text, #1f2937);
                    }

                    .timeline-comment::before {
                        content: '';
                        position: absolute;
                        left: -20px;
                        top: 0;
                        bottom: -20px;
                        width: 2px;
                        background: var(--history-line-color);
                        z-index: 1;
                    }

                    .timeline-comment::after {
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

                    .timestamp {
                        margin-bottom: 1rem;
                        padding-bottom: 0.65rem;
                        border-bottom: 1px solid var(--history-card-border);
                        font-size: 0.875rem;
                        color: var(--history-dot-color);
                        font-weight: 600;
                    }

                    .comment-header {
                        display: flex;
                        gap: 0.85rem;
                        align-items: center;
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

                    .user-content {
                        min-width: 0;
                        flex: 1;
                        display: grid;
                        gap: 0.2rem;
                    }

                    .user-name {
                        margin: 0;
                        color: var(--app-text, #1f2937);
                        font-size: 0.95rem;
                        font-weight: 700;
                    }

                    .comment-meta {
                        margin: 0;
                        color: var(--history-meta-color);
                        font-size: 0.82rem;
                    }

                    .comment-body {
                        margin: 1rem 0 0;
                        padding: 0.75rem 0.85rem;
                        border-radius: 10px;
                        background: var(--history-comment-bg);
                        border: 1px solid var(--history-comment-border);
                        color: var(--app-text, #1f2937);
                        font-size: 0.92rem;
                        line-height: 1.6;
                        white-space: pre-line;
                        word-break: break-word;
                    }

                    @media (max-width: 640px) {
                        .timeline-comment {
                            margin-left: 16px;
                            padding: 0.9rem;
                        }

                        .timeline-comment::before {
                            left: -16px;
                        }

                        .timeline-comment::after {
                            left: -21px;
                        }

                        .comment-header {
                            align-items: flex-start;
                        }
                    }
                </style>
            `;
        }

        return `
            <style>
                :host {
                    display: block;
                    font-family: inherit;
                    color: var(--app-text, #1f2937);
                }

                .comment-item {
                    display: grid;
                    gap: 0.75rem;
                    padding: 0.85rem 0;
                    border-bottom: 1px solid var(--app-border, #d0d7de);
                }

                .comment-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .comment-item:first-child {
                    padding-top: 0;
                }

                .comment-header {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                }

                .user-photo,
                .user-photo-fallback {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    flex: 0 0 auto;
                }

                .user-photo {
                    object-fit: cover;
                    border: 1px solid var(--app-border, #d0d7de);
                    background: var(--app-surface-muted, #e2e8f0);
                }

                .user-photo-fallback {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--app-surface-muted, #e2e8f0);
                    border: 1px solid var(--app-border, #d0d7de);
                    color: var(--app-text, #1f2937);
                    font-size: 0.76rem;
                    font-weight: 700;
                }

                .user-content {
                    min-width: 0;
                    flex: 1;
                    display: grid;
                    gap: 0.2rem;
                }

                .user-name {
                    margin: 0;
                    color: var(--app-text, #1f2937);
                    font-size: 0.92rem;
                    font-weight: 700;
                }

                .comment-meta {
                    margin: 0;
                    color: var(--app-text-muted, #64748b);
                    font-size: 0.78rem;
                }

                .comment-body {
                    margin: 0;
                    color: var(--app-text, #1f2937);
                    font-size: 0.9rem;
                    line-height: 1.55;
                    white-space: pre-line;
                    word-break: break-word;
                }
            </style>
        `;
    }

    render() {
        const fecha = this.getAttribute('fecha') || '';
        const hora = this.getAttribute('hora') || '';
        const usuario = this.getAttribute('usuario') || '';
        const nombreCompleto = this.getAttribute('nombre-completo') || '';
        const fotoUsuario = this.getAttribute('foto-usuario') || '';
        const comentario = this.getAttribute('comentario') || '';
        const safeNombreCompleto = this.escapeHtml(nombreCompleto || 'Usuario');
        const safeUsuario = this.escapeHtml(usuario);
        const safeComentario = this.escapeHtml(comentario);
        const safePhotoUrl = this.escapeHtml(fotoUsuario);
        const formattedDateTime = this.escapeHtml(this.formatDateTime(fecha, hora));
        const photoMarkup = fotoUsuario
            ? `<img class="user-photo" src="${safePhotoUrl}" alt="${safeNombreCompleto}" loading="lazy">`
            : `<span class="user-photo-fallback" aria-hidden="true">${this.escapeHtml(this.buildInitials(nombreCompleto || usuario))}</span>`;
        const isTimelineVariant = this.isTimelineVariant();

        if (isTimelineVariant) {
            this.shadowRoot.innerHTML = `
                ${this.getStyles()}
                <article class="timeline-comment">
                    <div class="timestamp">${formattedDateTime || 'Fecha no disponible'}</div>
                    <div class="comment-header">
                        ${photoMarkup}
                        <div class="user-content">
                            <p class="user-name">${safeNombreCompleto}</p>
                            <p class="comment-meta">${safeUsuario ? `@${safeUsuario}` : 'Usuario sin alias'}</p>
                        </div>
                    </div>
                    <p class="comment-body">${safeComentario || 'Sin comentario.'}</p>
                </article>
            `;
            return;
        }

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <article class="comment-item">
                <div class="comment-header">
                    ${photoMarkup}
                    <div class="user-content">
                        <p class="user-name">${safeNombreCompleto}</p>
                        <p class="comment-meta">${formattedDateTime}${safeUsuario ? ` · @${safeUsuario}` : ''}</p>
                    </div>
                </div>
                <p class="comment-body">${safeComentario || 'Sin comentario.'}</p>
            </article>
        `;
    }
}

if (!customElements.get('comment-history-item')) {
    customElements.define('comment-history-item', CommentHistoryItem);
}
