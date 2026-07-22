class CommentHistoryItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['fecha', 'hora', 'usuario', 'nombre-completo', 'foto-usuario', 'comentario'];
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

    getStyles() {
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
