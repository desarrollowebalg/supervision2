export async function loadResourcesV2(url, loaderHTML, tipoPeticion = "GET", responseType = "json", parametros = null, options = {}) {
  const mensajeCarga = "<div uk-spinner></div>";
  loaderHTML.innerHTML = mensajeCarga;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      "apiKey": "miApiKey"  // Asegúrate de reemplazarlo por tu clave real
    },
    cache: 'no-cache',
  };

  // Mezclamos las opciones por defecto con las opciones proporcionadas
  const fetchOptions = {
    method: tipoPeticion,
    headers: { ...defaultOptions.headers, ...(options.headers || {}) },
    cache: options.cache || defaultOptions.cache,
  };

  if (tipoPeticion !== "GET" && parametros) {
    fetchOptions.body = parametros;
  }

  try {
    const response = await fetch(url, fetchOptions);
    loaderHTML.innerHTML = "";

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    if (responseType === "json") {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    loaderHTML.innerHTML = `<div class="uk-alert-danger" uk-alert><p>Error al cargar la información</p></div>`;
    throw new Error(error);
  }
}
