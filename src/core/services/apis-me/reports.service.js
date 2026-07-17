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
