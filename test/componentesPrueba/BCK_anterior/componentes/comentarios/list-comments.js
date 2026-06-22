class ListComments extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isExpanded = false;
    }

    static get observedAttributes() {
        return ['fullname', 'username', 'user-photo', 'comment-date', 'comment'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    toggleComment() {
        this.isExpanded = !this.isExpanded;
        this.render();
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .comment-container {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e5e5;
                    margin-bottom: 10px;
                    background-color: #f6f8fa;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .user-photo {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-right: 1rem;
                }
                .user-details {
                    flex-grow: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .user-info-main {
                    flex-grow: 1;
                }
                .fullname {
                    font-weight: bold;
                    margin: 0;
                    font-size: .9em;
                }
                .username {
                    color: #666;
                    font-size: 0.9em;
                    margin: 0;
                    display: inline-block;
                    font-size: .9em;
                }
                .comment-date {
                    color: #666;
                    font-size: 0.7em;
                    margin-left: 8px;
                }
                .comment-text {
                    margin-top: 0.5rem;
                    line-height: 1.5;
                    font-size: .9em;
                }
                .comment-text.collapsed {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .toggle-button {
                    background: none;
                    border: none;
                    color: #0366d6;
                    padding: 0;
                    margin-top: 0.5rem;
                    cursor: pointer;
                    font-size: 0.9em;
                }
                .toggle-button:hover {
                    text-decoration: underline;
                }
            </style>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
    }

    render() {
        const fullname = this.getAttribute('fullname') || '';
        const username = this.getAttribute('username') || '';
        const userPhoto = this.getAttribute('user-photo') || '';
        const commentDate = this.formatDate(this.getAttribute('comment-date')) || '';
        const comment = this.getAttribute('comment') || '';

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="comment-container">
                <div class="user-info">
                    <img class="user-photo" src="${userPhoto}" alt="${fullname}">
                    <div class="user-details">
                        <div class="user-info-main">
                            <p class="fullname">${fullname}</p>
                            <p class="username">@${username}</p>
                        </div>
                        <span class="comment-date">${commentDate}</span>
                    </div>
                </div>
                <div class="comment-text ${!this.isExpanded ? 'collapsed' : ''}">${comment}</div>
                ${comment.length > 300 ? `
                    <button class="toggle-button" @click="toggleComment">
                        ${this.isExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                ` : ''}
            </div>
        `;

        // Agregar el event listener para el botón de toggle
        const toggleButton = this.shadowRoot.querySelector('.toggle-button');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleComment());
        }
    }
}

customElements.define('list-comments', ListComments);
