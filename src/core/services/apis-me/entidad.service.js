import { apisMeGet } from './client.js';

export async function fetchEntidadEntity() {
  return apisMeGet('entidad/entity/');
}

function resolveEntityData(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const { data } = response;
  if (Array.isArray(data)) {
    return data[0] && typeof data[0] === 'object' ? data[0] : null;
  }

  if (data && typeof data === 'object') {
    return data;
  }

  return null;
}

export function hasValidCodEntity(response) {
  if (!response || response.success === false) {
    return false;
  }

  const entityData = resolveEntityData(response);
  if (!entityData) {
    return false;
  }

  const codEntity = Number(entityData.COD_ENTITY);
  return Number.isFinite(codEntity) && codEntity > 0;
}

export function getEntidadValidationErrorMessage(response) {
  if (!response || typeof response !== 'object') {
    return 'No fue posible validar la unidad asignada.';
  }

  if (response.success === false && response.message) {
    return String(response.message);
  }

  return 'No tiene ninguna unidad asignada para enviar evidencias\n\nContacte a su administrador';
}
