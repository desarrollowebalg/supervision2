class PreguntaRespuestaComponent extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.render();
  }

  static get observedAttributes() {
      return ['pregunta', 'respuesta','sizepregunta','sizerespuesta','sinpaddingpreg','sinpaddingizqpreg','sinpaddingderpreg','sinpaddingres','sinpaddingizqres','sinpaddingderres'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          this.render();
      }
  }

  render() {
    const pregunta = this.getAttribute('pregunta') || '';
    const respuesta = this.getAttribute('respuesta') || '';
		const sizePregunta = this.getAttribute('sizepregunta') || '100';
		const sizeRespuesta = this.getAttribute('sizerespuesta') || '100';
		const sinPaddingPreg = this.getAttribute('sinpaddingpreg') || false;
		const sinPaddingIzqPreg = this.getAttribute('sinpaddingizqpreg') || false;
		const sinPaddingDerPreg = this.getAttribute('sinpaddingderpreg') || false;
		const sinPaddingRes = this.getAttribute('sinpaddingres') || false;
		const sinPaddingIzqRes = this.getAttribute('sinpaddingizqres') || false;
		const sinPaddingDerRes = this.getAttribute('sinpaddingderres') || false;

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
					.itemPregunta {
						font-size: 1rem;
						font-weight: 600;
						/*margin: 0 0 15px 0;*/
						margin: 0;
						display: block;
						line-height: 2.5rem;
					}
					.itemRespuesta{
						font-size: 1rem;
						display: block;
						margin: 0 0 15px 0;
						border: 1px solid #e1e1e1;
						border-radius: 5px;
						padding: 8px 10px;
						background: #fafafa;
						box-shadow: 0 5px 15px rgba(0, 0, 0, .08);
					}
					.base-5{
						width: 5%;
					}
					.base-10{
						width: 10%;
					}
					.base-15{
						width: 15%;
					}
					.base-20{
						width: 20%;
					}
					.base-25{
						width: 25%;
					}
					.base-30{
						width: 30%;
					}
					.base-35{
						width: 35%;
					}
					.base-40{
						width: 40%;
					}
					.base-45{
						width: 45%;
					}
					.base-50{
						width: 50%;
					}
					.base-60{
						width: 60%;
					}
					.base-65{
						width: 65%;
					}
					.base-70{
						width: 70%;
					}
					.base-75{
						width: 75%;
					}
					.base-80{
						width: 80%;
					}
					.base-85{
						width: 85%;
					}
					.base-90{
						width: 90%;
					}
					.base-95{
						width: 95%;
					}
					.base-100{
						width: 100%;
					}
					.sin-padding{
						padding-left:0!important;
						padding-right:0!important;
					}
					.sin-padding-derecho{
						padding-right:0!important;
					}
					.sin-padding-izquierdo{
						padding-left:0!important;
					}
					.texto-resaltado {
            background-color: yellow!important;
            font-weight: bold!important;
          }
        </style>
        
        <div class="containerHero">
					<div class="itemHero base-${sizePregunta} ${(sinPaddingPreg) ? 'sin-padding' : ''} ${(sinPaddingIzqPreg) ? 'sin-padding-izquierdo' : ''} ${(sinPaddingDerPreg) ? 'sin-padding-derecho' : ''}">
						<p class="itemPregunta">${pregunta}</p>
					</div>
					<div class="itemHero base-${sizeRespuesta} ${(sinPaddingRes) ? 'sin-padding' : ''} ${(sinPaddingIzqRes) ? 'sin-padding-izquierdo' : ''} ${(sinPaddingDerRes) ? 'sin-padding-derecho' : ''}">
						<p class="itemRespuesta">
							${respuesta}
						</p>
					</div>
        </div>
    `;
  }
}

customElements.define('pregres-component', PreguntaRespuestaComponent);
