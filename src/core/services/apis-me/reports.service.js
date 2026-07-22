import { apisMeGet } from './client.js';

function normalizeHeaderEntry(entry = {}) {
  return {
    ID_RES_CUESTIONARIO: Number(entry?.ID_RES_CUESTIONARIO ?? 0),
    ID_CUESTIONARIO: Number(entry?.ID_CUESTIONARIO ?? 0),
    FECHA: String(entry?.FECHA || '').trim(),
    LATITUD: String(entry?.LATITUD || '').trim(),
    LONGITUD: String(entry?.LONGITUD || '').trim(),
    BATERIA: Number(entry?.BATERIA ?? 0),
    FECHA_INICIO_CAPTURA: String(entry?.FECHA_INICIO_CAPTURA || '').trim(),
    FECHA_RECEPCION: String(entry?.FECHA_RECEPCION || '').trim(),
    COD_USER: String(entry?.COD_USER || '').trim(),
    USUARIO: String(entry?.USUARIO || '').trim(),
    NOMBRE_COMPLETO: String(entry?.NOMBRE_COMPLETO || '').trim(),
    URL_FOTO_PERFIL: String(entry?.URL_FOTO_PERFIL || '').trim(),
    CLV_GEO: String(entry?.CLV_GEO || '').trim(),
    DESCRIPCION: String(entry?.DESCRIPCION || '').trim(),
    ITEM_NUMBER: String(entry?.ITEM_NUMBER || '').trim()
  };
}

function normalizeDetailEntry(entry = {}) {
  return {
    ID_PREGUNTA: Number(entry?.ID_PREGUNTA ?? 0),
    ID_RES_CUESTIONARIO: Number(entry?.ID_RES_CUESTIONARIO ?? 0),
    ITEM_NUMBER: String(entry?.ITEM_NUMBER || '').trim(),
    DESCRIPCION: String(entry?.DESCRIPCION || '').trim(),
    RESPUESTA: String(entry?.RESPUESTA || '').trim()
  };
}

export async function getEvidenceReport(ide) {
  const safeIde = String(ide || '').trim();
  if (!/^\d+$/.test(safeIde)) {
    throw new Error('Identificador de evidencia invalido');
  }

  const response = await apisMeGet(`reports/evidence/${encodeURIComponent(safeIde)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar la evidencia'));
  }

  const headerRows = Array.isArray(response?.data?.header)
    ? response.data.header.map(normalizeHeaderEntry)
    : [];
  const detailRows = Array.isArray(response?.data?.detail)
    ? response.data.detail.map(normalizeDetailEntry)
    : [];

  return {
    header: headerRows[0] || null,
    detail: detailRows
  };
}

function normalizeHistoryEntry(entry = {}) {
  return {
    ID: Number(entry?.ID ?? 0),
    FECHA: String(entry?.FECHA || '').trim(),
    ID_INC: Number(entry?.ID_INC ?? entry?.IDI ?? 0),
    ESTATUS: String(entry?.ESTATUS || '').trim(),
    USUARIO: String(entry?.USUARIO || '').trim(),
    COMENTARIOS: String(entry?.COMENTARIOS || '').trim()
  };
}

function normalizeIncidentEntry(entry = {}) {
  return {
    ID: Number(entry?.ID ?? 0),
    CREADA_POR: Number(entry?.CREADA_POR ?? 0),
    ID_ESTATUS: Number(entry?.ID_ESTATUS ?? 0),
    ID_TIPO_INC: Number(entry?.ID_TIPO_INC ?? 0),
    ID_OBJECT_MAP: String(entry?.ID_OBJECT_MAP || '').trim(),
    ID_EVIDENCIA: Number(entry?.ID_EVIDENCIA ?? 0),
    NIVEL: Number(entry?.NIVEL ?? 0)
  };
}

export async function getIncidentReport(inc) {
  const safeInc = String(inc || '').trim();
  if (!/^\d+$/.test(safeInc)) {
    throw new Error('Identificador de incidencia invalido');
  }

  const response = await apisMeGet(`reports/incidence/${encodeURIComponent(safeInc)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar la incidencia'));
  }

  const rows = Array.isArray(response?.data)
    ? response.data.map(normalizeIncidentEntry)
    : [];

  return rows[0] || null;
}

export async function getHistoryReport(inc) {
  const safeInc = String(inc || '').trim();
  if (!/^\d+$/.test(safeInc)) {
    throw new Error('Identificador de incidencia invalido');
  }

  const response = await apisMeGet(`reports/history/${encodeURIComponent(safeInc)}/`);
  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible consultar el historial'));
  }

  return Array.isArray(response?.data)
    ? response.data.map(normalizeHistoryEntry)
    : [];
}
