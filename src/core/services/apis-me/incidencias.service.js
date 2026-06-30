import { apisMeGet } from './client.js';

function extractBodyRows(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((entry) => {
    if (Array.isArray(entry?.body)) {
      return entry.body;
    }

    return [];
  });
}

export function normalizeIncidenciasList(response) {
  return extractBodyRows(response?.data).map((row) => ({
    FECHA: row?.FECHA || '',
    NIVEL: Number(row?.NIVEL ?? 0),
    TOTAL: Number(row?.TOTAL ?? 0),
    LEIDOS: Number(row?.LEIDOS ?? 0),
    USUARIO: row?.USUARIO || '',
    NO_LEIDOS: Number(row?.NO_LEIDOS ?? 0),
    ID_USUARIO: Number(row?.ID_USUARIO ?? 0)
  }));
}

export async function fetchIncidenciasByDate(date) {
  const safeDate = String(date || '').trim();
  if (!safeDate) {
    return [];
  }

  const response = await apisMeGet(`incidencias/listar/${encodeURIComponent(safeDate)}/`);
  return normalizeIncidenciasList(response);
}
