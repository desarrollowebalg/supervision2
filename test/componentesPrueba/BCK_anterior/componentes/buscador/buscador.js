import { obtenerImagenesActivas } from '../extras/funciones.js';

class MiBuscador extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.debounceTimer = null;
    // this.searchContainerId = 'resultsRondinesList';
    this.searchContainerId = this.getAttribute('origen') || 'resultsRondinesList'; // Leer el atributo 'origen'
  }

  static get observedAttributes() {
    return ['origen'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'origen' && oldValue !== newValue) {
      this.searchContainerId = newValue;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        input[type="text"] {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
          box-sizing: border-box;
        }
        .estiloInputBuscador{
          border: 1px solid #CCC;
          padding: 8px;
          border-radius: 5px;
          font-size: 1.2rem;
          width: 100%;
          background-color: var(--color-divisor-linea);
          color: var(--enlace-primario);
        }
      </style>
      <input type="text" id="searchInput" class="estiloInputBuscador" placeholder="Buscar por hora (ej: 08:00 o 09:00 - 10:00) y/o texto">
    `;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById('searchInput');
    searchInput.addEventListener('input', this.handleInput.bind(this));
  }

  handleInput(event) {
    const query = event.target.value.trim().toLowerCase();
    this.debounceSearch(query);
  }

  debounceSearch(query) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  parseTimeToSeconds(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 3600 + m * 60;
  }

  resaltarTexto(texto, busqueda) {
    if (!busqueda) return texto;
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<span class="texto-resaltado">$1</span>');
  }

  formatearConsigna(consigna) {
    // Primero eliminamos cualquier caracter ` del string
    consigna = consigna.replace(/`/g, '');
    // Usamos una expresión regular para dividir el string en partes que comiencen con números seguidos de '- '
    let items = consigna.split(/(?=\d+- )/).map(item => item.trim()).filter(item => item);
    // Devolvemos el array con cada consigna en una nueva línea
    return items.join('<br>');
  }

  performSearch(query) {
    const resultsContainer = document.getElementById(this.searchContainerId);
    if (!resultsContainer) {
      console.error(`No se encontró el contenedor con ID: ${this.searchContainerId}`);
      return;
    }

    const listaElementos = resultsContainer.querySelectorAll('listado-elementos-component');
    const queryParts = query.split(',').map(part => part.trim());

    let timeRange = null;
    let textFilter = '';

    for (const part of queryParts) {
      const rangeMatch = part.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (rangeMatch) {
        const [_, startStr, endStr] = rangeMatch;
        timeRange = {
          start: this.parseTimeToSeconds(startStr),
          end: this.parseTimeToSeconds(endStr),
        };
      } else if (part.includes(':')) {
        const exactTimeMatch = part.match(/^(\d{2}:\d{2})$/);
        if (exactTimeMatch) {
          const exactTime = this.parseTimeToSeconds(exactTimeMatch[1]);
          timeRange = { start: exactTime, end: exactTime + 59 };
        } else {
          textFilter += (textFilter ? ' ' : '') + part;
        }
      } else if (part) {
        textFilter += (textFilter ? ' ' : '') + part;
      }
    }

    textFilter = textFilter.toLowerCase();

    listaElementos.forEach(elemento => {
      const shadowRoot = elemento.shadowRoot;
      const timelineItem = shadowRoot.querySelector('.timeline-item');
      const horaElemento = timelineItem ? timelineItem.getAttribute('date-is') : '';
      const observacionesSlot = shadowRoot.querySelector('slot[name="observaciones"]');
      let timeMatch = true;
      let textMatch = true;
      let shouldHighlight = false;

      // Filtrado por hora
      if (timeRange) {
        const itemTimeParts = horaElemento.split(':');
        const itemHourMinute = `${itemTimeParts[0]}:${itemTimeParts[1]}`;
        const itemTimeInSeconds = this.parseTimeToSeconds(itemHourMinute);
        timeMatch = itemTimeInSeconds >= timeRange.start && itemTimeInSeconds <= timeRange.end;
      }

      // Filtrado por texto y detección de si se debe resaltar
      if (textFilter && observacionesSlot) {
        const assignedNodes = observacionesSlot.assignedNodes({ flatten: true });
        let foundText = false;
        assignedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'pregres-component') {
            const respuesta = node.shadowRoot ? node.shadowRoot.querySelector('.itemRespuesta') : null;
            if (respuesta && respuesta.textContent.toLowerCase().includes(textFilter)) {
              foundText = true;
              shouldHighlight = true;
            }
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.toLowerCase().includes(textFilter)) {
            foundText = true;
          }
        });
        textMatch = foundText;
      }

      // Mostrar u ocultar el elemento
      elemento.style.display = timeMatch && textMatch ? 'block' : 'none';

      // Formatear y resaltar el texto de las respuestas visibles
      if (elemento.style.display === 'block' && observacionesSlot) {
        const assignedNodes = observacionesSlot.assignedNodes({ flatten: true });
        assignedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'pregres-component') {
            const respuesta = node.shadowRoot ? node.shadowRoot.querySelector('.itemRespuesta') : null;
            if (respuesta) {
              let respuestaOriginal = respuesta.textContent;
              let respuestaFormateada = this.formatearConsigna(respuestaOriginal);
              if (shouldHighlight && respuestaOriginal.toLowerCase().includes(textFilter)) {
                respuesta.innerHTML = this.resaltarTexto(respuestaFormateada, textFilter);
              } else {
                respuesta.innerHTML = respuestaFormateada;
              }
            }
          }
        });

        // se ejecuta la función externa que extrae las fotos que están visibles
        obtenerImagenesActivas(this.searchContainerId);
      }
    });
  }
}

customElements.define('mi-buscador', MiBuscador);