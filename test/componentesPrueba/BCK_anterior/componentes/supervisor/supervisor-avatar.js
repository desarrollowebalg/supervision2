class SupervisorAvatar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });      
  }

  connectedCallback() {
    this.render();
    this.setupClickListener();
  }

  static get observedAttributes() {
    return ["data-sup","foto","nombre"];
  }

  attributeChangedCallback() {
    this.render();
  }

  render(){
    const supId = this.getAttribute("data-sup") || "";
    const foto = this.getAttribute("foto") || "";
    const nombre = this.getAttribute("nombre") || "Sin Nombre";

    this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: inline-block;
                margin: 5px;
            }
            a {
                display: block;
                text-decoration: none;
            }
            .user-list-img{
		          margin: 0 5px;
		          display: inline-block;
            }
            .imgSup{ border-color: #007bff!important; }
            .bordePos2{ border: 3px solid var(--fondoItem2)!important;}
            .imgSupervision{ height: 60px!important; width: 60px!important; }
            img {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                cursor: pointer;
            }
        </style>
        <div id="user-list-imgP1" class="user-list-img">
          <a href="#" class="enlaceFotoSupervisor uk-display-block" data-sup="${supId}">
            <slot></slot>         
          </a>        
        </div>
    `;
  }
  // <img src="${foto}" class="imgSup uk-border-circle uk-box-shadow-large bordePos2 imgSupervision" alt="Imagen de ${nombre}" uk-tooltip="${nombre}"></img>
  setupClickListener() {
    this.shadowRoot.querySelector("a").addEventListener("click", (event) => {
        event.preventDefault();
        const supId = this.getAttribute("data-sup");
        console.log(`Clic en supervisor ID: ${supId}`);
        this.dispatchEvent(new CustomEvent("supervisor-click", {
            detail: { id: supId },
            bubbles: true,
            composed: true
        }));
    });
  }

}

customElements.define("supervisor-avatar", SupervisorAvatar);