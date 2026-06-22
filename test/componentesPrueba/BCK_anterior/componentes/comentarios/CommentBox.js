class CommentBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Variables configurables
        this.placeholderText = 'De clic para agregar comentarios';
        
        // Estado inicial
        this.isActive = false;
        
        // Crear la estructura inicial
        this.createInitialStructure();
        // Configurar los event listeners
        this.setupEventListeners();
        // Realizar el render inicial
        this.updateContent();
    }

    static get observedAttributes() {
        return ['user-id', 'user-name', 'nickname', 'user-photo'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateContent();
    }

    createInitialStructure() {
        const styles = `
            :host {
                display: block;
                font-family: Arial, sans-serif;
                margin: 10px;
            }

            .comment-container {
                border: 1px solid #e1e1e1;
                border-radius: 8px;
                padding: 10px;
                transition: all 0.3s ease;
                text-align: center;
            }

            .comment-container:hover {
                border-color: #f5f5f5;
            }

            .comment-container.active {
                /*border-color: #007bff;*/
                box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
            }

            .placeholder {
                color: #666;
                padding: 10px;
                cursor: pointer;
                background-color: #f0f0f0;
                border-radius: 6px;
            }

            .editor {
                display: none;
                flex-direction: column;
                gap: 10px;
            }

            .editor.active {
                display: flex;
            }

            textarea {
                width: 95%;
                min-height: 100px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                resize: vertical;
                font-family: inherit;
            }

            .buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }

            .save-btn {
                background-color: #007bff;
                color: white;
            }

            .save-btn:hover {
                background-color: #0056b3;
            }

            .cancel-btn {
                background-color: #6c757d;
                color: white;
            }

            .cancel-btn:hover {
                background-color: #545b62;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }

            .user-photo {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
            }

            .user-details {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                font-weight: bold;
            }

            .user-nickname {
                color: #666;
                font-size: 0.9em;
            }
        `;

        const userId = this.getAttribute('user-id');
        const userName = this.getAttribute('user-name');
        const nickname = this.getAttribute('nickname');
        const userPhoto = this.getAttribute('user-photo');

        // Crear el contenedor principal
        const container = document.createElement('div');
        container.className = 'comment-container';
        
        // Agregar estilos
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        this.shadowRoot.appendChild(styleElement);
        
        // Crear placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = this.placeholderText;
        
        // Crear editor
        const editor = document.createElement('div');
        editor.className = 'editor';
        
        // Crear estructura del editor
        editor.innerHTML = `
            <div class="user-info">
                <img class="user-photo">
                <div class="user-details">
                    <span class="user-name"></span>
                    <span class="user-nickname"></span>
                </div>
            </div>
            <textarea placeholder="Escribe tu comentario aquí..." class="uk-background-muted"></textarea>
            <div class="buttons">
                <button class="cancel-btn">Cancelar</button>
                <button class="save-btn">Guardar</button>
            </div>
        `;
        
        // Agregar elementos al container
        container.appendChild(placeholder);
        container.appendChild(editor);
        
        // Agregar container al shadow root
        this.shadowRoot.appendChild(container);
    }
    
    updateContent() {
        const userId = this.getAttribute('user-id');
        const userName = this.getAttribute('user-name');
        const nickname = this.getAttribute('nickname');
        const userPhoto = this.getAttribute('user-photo');
        
        const container = this.shadowRoot.querySelector('.comment-container');
        const placeholder = this.shadowRoot.querySelector('.placeholder');
        const editor = this.shadowRoot.querySelector('.editor');
        const userPhotoImg = this.shadowRoot.querySelector('.user-photo');
        const userNameSpan = this.shadowRoot.querySelector('.user-name');
        const userNicknameSpan = this.shadowRoot.querySelector('.user-nickname');
        
        // Actualizar clases según el estado
        container.classList.toggle('active', this.isActive);
        editor.classList.toggle('active', this.isActive);
        placeholder.style.display = this.isActive ? 'none' : 'block';
        
        // Actualizar información del usuario
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

            // Disparar evento personalizado con el comentario
            this.dispatchEvent(new CustomEvent('comment-saved', {
                detail: comment,
                bubbles: true,
                composed: true
            }));

            // Limpiar y cerrar el editor
            this.deactivate();
        }
    }

    // Método público para cambiar el texto del placeholder
    setPlaceholderText(text) {
        this.placeholderText = text;
        this.shadowRoot.querySelector('.placeholder').textContent = text;
    }
}

// Registrar el componente
customElements.define('comment-box', CommentBox);
