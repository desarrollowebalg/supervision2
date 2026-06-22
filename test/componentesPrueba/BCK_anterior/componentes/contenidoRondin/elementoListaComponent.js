class ListaElementosComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();      
  }

  static get observedAttributes() {
    return ['hora', 'nombreUsuario', 'direccion', 'idEvidencia', 'fecha'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();          
    }
  }

  render() {
    const hora = this.getAttribute('hora') || '00:00:00';
		const fecha = this.getAttribute('fecha') || '0000-00-00';
    const nombreUsuario = this.getAttribute('nombreUsuario') || '';
    const direccion = this.getAttribute('direccion') || 'S/D';
    const idEvidencia = this.getAttribute('idEvidencia') || 'S/D';		
    const idEle="dire_"+idEvidencia;
    this.shadowRoot.innerHTML = `
        <style>
            :host {
              display: block;
							position: relative;
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
            .container {
              max-width: 1400px;
              width: 95%;
              margin: 0 auto;
            }
            .margenNombreUsuario{
              margin-top: 3px;
            }
            .estiloSinPesoTxt{
              font-weight: normal;
            }
            .timeline-item {
              padding: 3em 1em 1em 2rem;
              position: relative;
              color: rgba(0,0,0, .7);
              border-left: 2px solid #CCC;
              
              p {
                font-size: 1rem;
              }

              & .timeline-item_container{
                margin-top: 15px;
                border: 1px solid var(--color-divisor-linea2);
                border-radius: 8px;
                padding: 8px 10px;
                background-color: var(--color-divisor-linea);
              }

              & .timeline_titulo{
                border-bottom: 1px solid #CCC;
                margin-bottom: 5px;

                & .timeline_titulo_user{
                  display: inline-block;
                  margin-bottom: 10px;

                  & h3{
                    display: inline-block;
                    margin-bottom: 0;          
                  }

                  & .timeline_titulo_user_imgPerfil{
                    width: 32px;
                    height: 32px;
                    border: 1px solid var(--theme-color);
                    border-radius: 50%;
                    background-color: #FFF;
                    padding: 2px;
                    position: relative;
                    top: -2px;
                    margin-right: 15px;
                  }
                }

                & .timeline_titulo_grupo{
                  display: inline-block;
                  margin-left: 25px;
                  margin-bottom: 10px;
                  
                  & p{
                    font-size: .9rem;
                    color: var(--texto-secundario);
                  }
                }
              }
              
              & .timeline_direccion{
                margin: 10px 0 0 25px;
                border: 1px solid #e1e1e1;
                border-radius: 5px;
                background-color: #fafafa;
                padding: 5px;
              }

              & .containerOpts{
                margin: 25px 0 5px;
                & span{
                  display: inline-block;
                  margin-right: 15px;
                  margin-bottom: 15px;
                }
              }

              &::before {
                content: attr(date-is);
                position: absolute;
                left: 2em;
                font-weight: bold;
                top: 1em;
                display: block;
                font-family: 'Roboto', sans-serif;
                font-weight: 700;
                /* font-size: .785rem; */
                font-size: 1rem;
                background: green;
                padding: 5px 15px;
                color: #FFF;
                border-radius: 8px;
              }

              &::after {
                width: 15px;
                height: 15px;
                display: block;
                top: 1.5em;
                position: absolute;
                left: -9px;
                border-radius: 10px;
                content: '';
                border: 2px solid rgba(0,0,0, .3);
                background: greenyellow;
              }

              &:last-child {
                border-image: linear-gradient(
                  to bottom,
                  rgba(0,0,0, .3) 60%,
                  rgba(rgba(0,0,0, .3), 0)) 1 100%
                ;
              }
            }
            .enlaceListado{
              display: inline-block;
              margin: 0 15px;
              & a{
                color: #009688;
                text-decoration: none;
              }
            }
            .margenEnlaces{
              margin: 20px 10px 10px !important;
            }
            .noMostrarElemento{
              display: none;
            }
            .txtDireccion{
              margin: 5px;
              font-size: .9rem!important;
              font-weight: normal;
            }
        </style>
        <div class="container">
          <div class="timeline-item" date-is='${hora}'>
            <div class="timeline-item_container">
              <section class="timeline_titulo">
                <span class="timeline_titulo_user">
                  <h3 class="margenNombreUsuario estiloSinPesoTxt">
                    <slot name="avatar"></slot>
                    ${nombreUsuario}
                  </h3>
                </span>							
              </section>
              <section>                
                <slot name="consignas"></slot>
              </section>
              <section>                
                <slot name="condiciones"></slot>
              </section>						
              <section class="observaciones">                
                <slot name="observaciones"></slot>
              </section>
              <section>                
                <slot name="fotos"></slot>
              </section>
              <section class="margenEnlaces">
                <p class="enlaceListado">
                  <a href="#" id="${idEle}" class="verConsignas" data-punto="${direccion}">Ver dirección</a>
                </p>            
                <p class="enlaceListado">
                  <a href="https://app.movilizandome.net/modules/rEvidencia/Reporte_pdf.php?id=${idEvidencia}" target="_blank">Descargar PDF</a>
                </p>
              </section>						
            </div>
            <div id="${idEle}_d" class="timeline_direccion noMostrarElemento">
              <p class="estiloSinPesoTxt txtDireccion">Dirección: ${direccion}</p>
            </div>
          </div>          
        </div>				
    `;
    this.setupEventListeners();
  }
  setupEventListeners() {
    const verDireccionLink = this.shadowRoot.querySelector('.verConsignas');
    if (verDireccionLink) {
      verDireccionLink.addEventListener('click', this.toggleDireccion.bind(this));
    }
  }

  toggleDireccion(event) {
    event.preventDefault(); // Evita que el enlace navegue
    const idElementoDireccion = event.target.id + '_d';
    const elementoDireccion = this.shadowRoot.getElementById(idElementoDireccion);
    if (elementoDireccion) {
      elementoDireccion.classList.toggle('noMostrarElemento');
    }
  }
}

customElements.define('listado-elementos-component', ListaElementosComponent);
