class CommentBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.placeholderText = 'De clic para agregar comentarios';
        this.isActive = false;

        this.createInitialStructure();
        this.setupEventListeners();
        this.updateContent();
    }

    static get observedAttributes() {
        return ['user-id', 'user-name', 'nickname', 'user-photo'];
    }

    attributeChangedCallback() {
        this.updateContent();
    }

    createInitialStructure() {
        const styles = `
            :host {
                display: block;
                font-family: inherit;
                color: var(--app-text, #1f2937);
            }

            .comment-container {
                border: 1px solid var(--app-border, var(--app-border-color, #d0d7de));
                border-radius: 12px;
                padding: 0;
                transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                text-align: left;
                background: var(--app-surface-elevated, var(--app-surface, #ffffff));
                color: var(--app-text, #1f2937);
                overflow: hidden;
            }

            .comment-container:hover {
                border-color: var(--app-primary, #1e87f0);
            }

            .comment-container.active {
                border-color: var(--app-primary, #1e87f0);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-primary, #1e87f0) 18%, transparent);
            }

            .placeholder {
                padding: 0.9rem 1rem;
                cursor: pointer;
                border-radius: 12px;
                background: var(--app-surface, var(--app-input-bg, #f8fafc));
                color: var(--app-text-muted, var(--app-text-secondary, #64748b));
                transition: background 0.2s ease, color 0.2s ease;
            }

            .placeholder:hover {
                background: var(--app-surface-muted, var(--app-hover-bg, #eef2ff));
                color: var(--app-text, #1f2937);
            }

            .editor {
                display: none;
                flex-direction: column;
                gap: 0.9rem;
                padding: 1rem;
            }

            .editor.active {
                display: flex;
            }

            textarea {
                width: 100%;
                min-height: 110px;
                padding: 0.75rem 0.85rem;
                border: 1px solid var(--app-border, var(--app-border-color, #d0d7de));
                border-radius: 10px;
                box-sizing: border-box;
                resize: vertical;
                font-family: inherit;
                font-size: 0.95rem;
                line-height: 1.5;
                background: var(--app-surface, var(--app-active-bg, #ffffff));
                color: var(--app-text, var(--app-text-primary, #1f2937));
            }

            textarea:focus {
                outline: none;
                border-color: var(--app-primary, #1e87f0);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-primary, #1e87f0) 18%, transparent);
            }

            .buttons {
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
            }

            button {
                padding: 0.65rem 1rem;
                border: 1px solid transparent;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                font-family: inherit;
                transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
            }

            .save-btn {
                background: var(--app-primary, #1e87f0);
                color: var(--app-primary-contrast, #ffffff);
            }

            .save-btn:hover {
                background: var(--app-primary-hover, #0f7ae5);
            }

            .cancel-btn {
                background: var(--app-surface, #ffffff);
                border-color: var(--app-border, #d0d7de);
                color: var(--app-text, #1f2937);
            }

            .cancel-btn:hover {
                background: var(--app-surface-muted, #f1f5f9);
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .user-photo {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                background: var(--app-surface-muted, #e2e8f0);
                border: 1px solid var(--app-border, #d0d7de);
            }

            .user-details {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                font-weight: 700;
                color: var(--app-text, #1f2937);
            }

            .user-nickname {
                color: var(--app-text-muted, #64748b);
                font-size: 0.9em;
            }
        `;

        const container = document.createElement('div');
        container.className = 'comment-container';

        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        this.shadowRoot.appendChild(styleElement);

        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = this.placeholderText;

        const editor = document.createElement('div');
        editor.className = 'editor';
        editor.innerHTML = `
            <div class="user-info">
                <img class="user-photo">
                <div class="user-details">
                    <span class="user-name"></span>
                    <span class="user-nickname"></span>
                </div>
            </div>
            <textarea placeholder="Escribe tu comentario aqui..."></textarea>
            <div class="buttons">
                <button class="cancel-btn" type="button">Cancelar</button>
                <button class="save-btn" type="button">Guardar</button>
            </div>
        `;

        container.appendChild(placeholder);
        container.appendChild(editor);
        this.shadowRoot.appendChild(container);
    }

    updateContent() {
        const userName = this.getAttribute('user-name');
        const nickname = this.getAttribute('nickname');
        const userPhoto = this.getAttribute('user-photo');

        const container = this.shadowRoot.querySelector('.comment-container');
        const placeholder = this.shadowRoot.querySelector('.placeholder');
        const editor = this.shadowRoot.querySelector('.editor');
        const userPhotoImg = this.shadowRoot.querySelector('.user-photo');
        const userNameSpan = this.shadowRoot.querySelector('.user-name');
        const userNicknameSpan = this.shadowRoot.querySelector('.user-nickname');

        container.classList.toggle('active', this.isActive);
        editor.classList.toggle('active', this.isActive);
        placeholder.style.display = this.isActive ? 'none' : 'block';

        userPhotoImg.src = userPhoto || '';
        userPhotoImg.alt = userName || '';
        userNameSpan.textContent = userName || '';
        userNicknameSpan.textContent = nickname ? `@${nickname}` : '';
    }

    setupEventListeners() {
        this.shadowRoot.querySelector('.placeholder').addEventListener('click', () => {
            this.activate();
        });

        this.shadowRoot.querySelector('.cancel-btn').addEventListener('click', () => {
            this.deactivate();
        });

        this.shadowRoot.querySelector('.save-btn').addEventListener('click', () => {
            this.saveComment();
        });
    }

    activate() {
        this.isActive = true;
        this.updateContent();
        this.shadowRoot.querySelector('textarea').focus();
    }

    deactivate() {
        this.isActive = false;
        this.shadowRoot.querySelector('textarea').value = '';
        this.updateContent();
    }

    saveComment() {
        const textarea = this.shadowRoot.querySelector('textarea');
        const commentText = textarea.value.trim();

        if (commentText) {
            const comment = {
                userId: this.getAttribute('user-id'),
                userName: this.getAttribute('user-name'),
                nickname: this.getAttribute('nickname'),
                text: commentText,
                timestamp: new Date().toISOString()
            };

            this.dispatchEvent(new CustomEvent('comment-saved', {
                detail: comment,
                bubbles: true,
                composed: true
            }));

            this.deactivate();
        }
    }

    setPlaceholderText(text) {
        this.placeholderText = text;
        this.shadowRoot.querySelector('.placeholder').textContent = text;
    }
}

if (!customElements.get('comment-box')) {
    customElements.define('comment-box', CommentBox);
}
