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

export function guardarEnLocalStorage(clave, valor) {
  try {
    const valorString = JSON.stringify(valor);
    localStorage.setItem(clave, valorString);
  } catch (error) {
    console.error(`Error al guardar '${clave}' en localStorage:`, error);
    localStorage.setItem(clave, String(valor)); // Intenta guardar como string si falla la conversión a JSON
  }
}

export function obtenerDeLocalStorage(clave) {
  const valorString = localStorage.getItem(clave);
  if (valorString === null) {
    return null;
  }
  try {
    return JSON.parse(valorString);
  } catch (error) {
    return valorString; // Si no es un JSON válido, devuelve el string tal cual
  }
}

export function eliminarDeLocalStorage(clave) {
  localStorage.removeItem(clave);
}

export function limpiarLocalStorage() {
  localStorage.clear();
}


export function guardarEnLocalStorageTime(nombreClave, datosJson) {
    const timestamp = new Date().toISOString(); // Marca de tiempo en formato ISO
    const dataConTimestamp = {
        timestamp,
        data: datosJson
    };
    localStorage.setItem(nombreClave, JSON.stringify(dataConTimestamp));
}
// Función para leer datos de localStorage
export function leerDeLocalStorageTime(nombreClave) {
    const dataConTimestamp = localStorage.getItem(nombreClave);
    if (!dataConTimestamp) {
        return null; // Retorna null si no hay datos almacenados con ese nombre
    }

    const { timestamp, data } = JSON.parse(dataConTimestamp);
    return { timestamp, data }; // Retorna un objeto con el timestamp y los datos JSON
}
export function verificaInfoLocalTime(nombreClave) {
  const dataConTimestamp = localStorage.getItem(nombreClave);
  if (!dataConTimestamp) {
    // No existe la clave, se requiere cargar desde la API
    return true;
  }
  const { timestamp } = JSON.parse(dataConTimestamp);
  const ultimoTimestamp = new Date(timestamp);
  const ahora = new Date();
  // Diferencia en minutos entre el último timestamp y el tiempo actual
  const diferenciaMinutos = (ahora - ultimoTimestamp) / (1000 * 60);
  // Si han pasado menos de 30 minutos, devolvemos `false` (no necesita carga desde la API)
  if (diferenciaMinutos < 60) {
    return false;
  }
  // Si han pasado 30 minutos o más, devolvemos `true` (necesita carga desde la API)
  return true;
}