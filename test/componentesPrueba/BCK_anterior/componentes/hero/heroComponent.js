class HeroComponent extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.render();
  }

  static get observedAttributes() {
      return ['background-position', 'saludo', 'foto-perfil', 'color-nombre', 'nombre-completo', 'nomusuario'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          this.render();
      }
  }

  render() {
    const backgroundPosition = this.getAttribute('background-position') || '50% 50%';
    const saludo = this.getAttribute('saludo') || '¡Hola!';
    const fotoPerfil = this.getAttribute('foto-perfil') || 'https://via.placeholder.com/120';
    const colorNombre = this.getAttribute('color-nombre') || 'rgba(33, 150, 243, .2)';
    const nombreCompleto = this.getAttribute('nombre-completo') || 'Usuario';
    const nomUsuario = this.getAttribute('nomusuario') || '@usuario';
    const heroImg = this.getAttribute('hero-img') || 'https://via.placeholder.com/120';

    this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                box-sizing: border-box;
                height: 300px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-size: cover !important;
                color: rgba(255,255,255,.7);
                background-position: ${backgroundPosition} !important;
                background-repeat: no-repeat !important;                
								background-image: url(${heroImg});
                overflow: hidden;
                background-color: #f5f5f5 !important;
            }
            .containerHero {
                display: flex;
                flex-wrap: wrap;
                margin-left: auto;
                margin-right: auto;
                width: 100%;
                max-width: 1400px;
            }
            .itemHero {
                margin: 0;
                padding-left: 15px;
                padding-right: 15px;
                width: 100%;
            }
            .saludoHero {
                font-size: 2rem;
                display: block;
                margin-top: 40px;
                color: #FFF;
            }
            .contentInfoUsuario {
                text-align: center;
                margin-bottom: 20px !important;
            }            
            .infoUsuarioTxt {
                font-size: 1.6rem;
                display: inline-block;
                font-weight: 400;
                color: #333;
                background-color: ${colorNombre};
                width: auto;
                border-radius: 8px;
                padding: 10px 25px;
								margin-top: 15px;
            }
        </style>
        
        <div class="containerHero">
					<div class="itemHero">
						<span class="saludoHero">${saludo}</span>
					</div>
					<div class="itemHero">
						<section class="contentInfoUsuario">                    
							<slot></slot>
							<div>
								<span class="infoUsuarioTxt">${nombreCompleto} (<span>${nomUsuario}</span>)</span>
							</div>
						</section>
					</div>
        </div>
    `;
  }
}

customElements.define('hero-component', HeroComponent);
