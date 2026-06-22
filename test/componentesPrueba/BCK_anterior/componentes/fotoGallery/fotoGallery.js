class FotoGallery extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['fotos'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'fotos' && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const fotosAttr = this.getAttribute('fotos');
    let fotos = [];

    try {
      fotos = JSON.parse(fotosAttr) || [];
    } catch (e) {
      console.warn('Formato inválido en atributo fotos');
    }

    if (!Array.isArray(fotos)) fotos = [];

    const content = document.createElement('div');

    if (fotos.length === 0) {
      content.innerHTML = `
        <div class="uk-text-muted uk-margin-small-left">Sin fotografías</div>
      `;
    } else {
      content.innerHTML = `
        <section style="margin-left: 15px !important;">
          <div class="uk-child-width-1-2@m" uk-grid uk-lightbox="nav: thumbnav; slidenav: false">
            ${fotos.map((foto, index) => {
              const url = foto.url || '';
              const caption = foto.caption || `Foto ${index + 1}`;
              return `
                <div>
                  <a class="uk-inline uk-border-rounded" href="${url}" data-caption="${caption}">
                    <img src="${url}" class="uk-border-rounded uk-box-shadow-medium" width="1800" height="1200" alt="${caption}">
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }

    this.innerHTML = ''; // Limpia el contenido previo
    this.appendChild(content); // light DOM
  }
}

customElements.define('foto-gallery', FotoGallery);