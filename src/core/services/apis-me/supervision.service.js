import { apisMeGet } from './client.js';

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
