class UsuarioIncidencias extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });      
  }

  connectedCallback() {
    this.render();
    this.setupClickListener();
  }

  static get observedAttributes() {
    return ["data-id","data-nombre","foto","total-inc"];
  }

  attributeChangedCallback() {
    this.render();
  }

  render(){
    const userId = this.getAttribute("data-id") || "";
    const userName = this.getAttribute("data-nombre") || "";     
    const totalInc = this.getAttribute("total-inc") || "";

    this.shadowRoot.innerHTML = `
        <style>
          :host {
            margin: 0;
            padding-left: 15px;
            padding-right: 15px;
            width: 50%;
          }
          .contenedor {	
            display: flex;	
            flex-wrap: wrap;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            width: 100%;
          }
          .caja{
            margin: 0;
            padding-left: 15px;
            padding-right: 15px;
            width: 100%;	
          }
          .base-80{
            width: 80%;
          }
          .base-70{
            width: 70%;
          }
          .base-50{
            width: 50%;
          }
          .base-30{
            width: 30%;
          }
          .base-20{
            width: 20%;
          }
          .base-10{
            width: 10%;
          }
          .no-padding{
            padding-left: 0;
            padding-right: 0;
          }
          .borde{
            border-bottom: 1px solid #eee;
            /*border-radius:8px;*/
            /*box-shadow: 0 5px 12px rgba(0, 0, 0, .15);*/
            padding: 8px 0;
          }
          .centrar{
            text-align:center;
          }
          .alinearImagen{
            margin: 5px 0;
            line-height:10px;
          }
          .enlaceUserInc_p{
            display: block;padding: 5px;
          }
          .contenedorInfo{
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 90%;
            display: block;
          }
          .nombreUsuario{
            margin: 0 10px;
            display:block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 90%;
            display: block;
          }
          .numRegs{
            margin: 0 10px;
          }
          /*@media (min-width: 480px) {
            :host{
              width: 50%;
            }
          }
          @media (min-width: 768px) {
            :host{
              width: 33.33%;
            }
          }
          @media (min-width: 1024px) {
            :host{
              width: 25%;
            }
          }*/
        </style>        

        <div class="caja no-padding">
          <a href="#" class="enlaceUserInc_p" data-id="${userId}" data-nombre="${userName}">
            <div class="contenedor borde">
              <div class="caja base-20 no-padding centrar">
                <slot></slot>
              </div>
              <div class="caja base-80 no-padding">
                <span class="contenedorInfo">
                  <span class="nombreUsuario">${userName}</span>
                  <small class="numRegs">${totalInc} registros</small>
                </span>
              </div>
            </div>																						
          </a>		
        </div>
    `;
  }  
  setupClickListener() {
    this.shadowRoot.querySelector("a").addEventListener("click", (event) => {
        event.preventDefault();
        const supId = this.getAttribute("data-id");
        console.log(`Clic en usuario ID: ${supId}`);
        this.dispatchEvent(new CustomEvent("userincidencia-click", {
            detail: { id: supId },
            bubbles: true,
            composed: true
        }));
    });
  }

}

customElements.define("usuario-incidencia", UsuarioIncidencias);