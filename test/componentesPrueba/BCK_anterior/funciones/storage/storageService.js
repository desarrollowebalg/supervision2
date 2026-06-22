// Este módulo proporciona funciones para interactuar con sessionStorage
// y manejar datos de manera eficiente. Incluye funciones para guardar, obtener,
// eliminar y limpiar datos en sessionStorage, así como para manejar errores
// de conversión a JSON. También incluye una función para eliminar caracteres
// no deseados de cadenas de texto.
//
export function guardarEnSessionStorage(clave, valor) {
  try {
    const valorString = JSON.stringify(valor);
    sessionStorage.setItem(clave, valorString);
  } catch (error) {
    console.error(`Error al guardar '${clave}' en sessionStorage:`, error);
    sessionStorage.setItem(clave, String(valor)); // Intenta guardar como string si falla la conversión a JSON
  }
}

export function obtenerDeSessionStorage(clave) {
  const valorString = sessionStorage.getItem(clave);
  if (valorString === null) {
    return null;
  }
  try {
    return JSON.parse(valorString);
  } catch (error) {
    return valorString; // Si no es un JSON válido, devuelve el string tal cual
  }
}

export function eliminarDeSessionStorage(clave) {
  sessionStorage.removeItem(clave);
}

export function limpiarSessionStorage() {
  sessionStorage.clear();
}