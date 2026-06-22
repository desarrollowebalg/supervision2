export class LoadLayout {
  constructor(pathTemplates) {
    this.template = pathTemplates;
  }

  // Método para ejecutar los scripts
  executeScripts(element) {
    const scripts = element.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        // Añadir parámetro único a los scripts para evitar caché
        const cacheBustedSrc = script.src + '?_=' + new Date().getTime();
        newScript.src = cacheBustedSrc;
        newScript.type = script.type;
        newScript.async = true; // o false dependiendo de si necesitas que cargue de forma sincrónica
        document.body.appendChild(newScript);
      } else {
        newScript.text = script.textContent;
        document.body.appendChild(newScript);
      }
    });
  }

  // Método para realizar la petición y cargar el layout
  async fetchLayoutHTML(destino) {
    // Añadir parámetro único a la URL del layout para evitar caché
    let url = `${this.template}/${this.path}?_=${new Date().getTime()}`;
    let destinoElement = typeof destino === 'string' ? document.querySelector("#" + destino) : destino;

    if (!destinoElement) {
      console.error("Elemento destino no encontrado.");
      return;
    }

    let headers = new Headers();
    headers.append('Content-Type', 'text/html; charset=utf-8');
    
    const options = {
      method: 'GET',
      headers: headers,
      cache: 'no-cache' // Controlar la caché mediante `fetch`
    };
    
    try {
      const response = await fetch(url, options);
      const data = await response.text();

      let html = data;
      html = html.replace("{PATH}", this.script || "");
      html = html.replace("{TIME}", this.time || new Date().toISOString());
      html = html.replace("{STYLES}", this.styles || "");

      destinoElement.innerHTML = html;
      this.executeScripts(destinoElement);

    } catch (error) {
      console.error("Error en la petición", error);
    }
  }

  // Método para cargar un layout y devolver una promesa cuando se haya completado
  async loadLayoutHTML(path, destino, script = "", styles = "", time = "") {
    this.path = path;
    this.script = script;
    this.styles = styles;
    this.time = time;

    // Cargar el layout en el destino especificado y devolver una promesa
    await this.fetchLayoutHTML(destino);
    return true;  // Indicar que la carga ha sido completada
  }
}
