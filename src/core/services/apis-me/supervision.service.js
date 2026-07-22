import { apisMeGet, apisMePut } from './client.js';

function normalizeIncidentCreationResponse(payload = {}) {
  return {
    status: Number(payload?.status ?? 0),
    success: Boolean(payload?.success),
    message: String(payload?.message || '').trim(),
    incidentId: Number(payload?.data?.ID ?? 0)
  };
}

export async function markEvidenceAsReadAndCreateIncident(idResCuestionario, itemNumber) {
  const safeEvidenceId = String(idResCuestionario || '').trim();
  const safeItemNumber = String(itemNumber || '').trim();

  if (!/^\d+$/.test(safeEvidenceId)) {
    throw new Error('Identificador de evidencia invalido para crear la incidencia');
  }

  if (!safeItemNumber) {
    throw new Error('Item number invalido para crear la incidencia');
  }

  const response = await apisMeGet(
    `supervision/leer/${encodeURIComponent(safeEvidenceId)}/${encodeURIComponent(safeItemNumber)}/`
  );

  const normalizedResponse = normalizeIncidentCreationResponse(response);
  if (!normalizedResponse.success) {
    throw new Error(normalizedResponse.message || 'No fue posible generar la incidencia');
  }

  if (!Number.isFinite(normalizedResponse.incidentId) || normalizedResponse.incidentId <= 0) {
    throw new Error('La API no devolvio un identificador de incidencia valido');
  }

  return normalizedResponse.incidentId;
}

export async function updateIncidentComment(incidentId, tipoAtencion, observaciones) {
  const safeIncidentId = String(incidentId || '').trim();
  const safeTipoAtencion = String(tipoAtencion || '').trim();
  const safeObservaciones = String(observaciones || '').trim();

  if (!/^\d+$/.test(safeIncidentId)) {
    throw new Error('Identificador de incidencia invalido para guardar el comentario');
  }

  if (!/^\d+$/.test(safeTipoAtencion)) {
    throw new Error('Tipo de atencion invalido para guardar el comentario');
  }

  if (!safeObservaciones) {
    throw new Error('Escribe un comentario antes de guardar');
  }

  const response = await apisMePut(
    `supervision/incidenceAct/${encodeURIComponent(safeIncidentId)}/${encodeURIComponent(safeTipoAtencion)}/`,
    { obs: safeObservaciones }
  );

  if (!response?.success) {
    throw new Error(String(response?.message || 'No fue posible guardar el comentario'));
  }

  return response;
}
