class UserAvatar extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
      return ['url', 'nombre', 'size'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          this.render();
      }
  }

  connectedCallback() {
      this.render();
      this.shadowRoot.querySelector('img').addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('user-click', {
              detail: { nombre: this.getAttribute('nombre') },
              bubbles: true,
              composed: true
          }));
      });
  }

  render() {
      const url = this.getAttribute('url') || '';
      const nombre = this.getAttribute('nombre') || 'Usuario';
      const size = this.getAttribute('size') || '100px';

      this.shadowRoot.innerHTML = `
          <style>
              .avatar {
                text-align: center !important;                                  
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
                border-radius: 50%;
                box-shadow: 0 14px 25px rgba(0, 0, 0, .16);
                margin-left: auto;
                margin-right: auto;
                border: 2px solid #ccc;
                padding: 2px;
              }               
          </style>
          <div class="avatar">
              <img src="${url}" alt="${nombre}" title="${nombre}">
          </div>
      `;
  }
}
{/* <script>
        document.querySelectorAll('user-avatar').forEach(avatar => {
            avatar.addEventListener('user-click', (event) => {
                console.log('Usuario clickeado:', event.detail.nombre);
            });
        });
    </script> */}
customElements.define('user-avatar', UserAvatar);