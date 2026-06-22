import { apisMeGet } from './client.js';

function toSafeClv(clv) {
  if (clv === null || clv === undefined) {
    return '';
  }

  return String(clv).trim();
}

export async function getFormSchemaByClv(clv) {
  const safeClv = toSafeClv(clv);
  if (!safeClv) {
    return {
      ok: false,
      error: 'CLV invalido',
      schema: null
    };
  }

  const payload = await apisMeGet(`form-engine/index.php?idformulario=${encodeURIComponent(safeClv)}`);
  const hasForm = Boolean(payload?.form && Array.isArray(payload?.form?.fields));

  if (!hasForm) {
    return {
      ok: false,
      error: payload?.error || payload?.message || 'Respuesta invalida de form-engine',
      schema: null,
      raw: payload
    };
  }

  return {
    ok: true,
    error: null,
    schema: payload
  };
}
