import { syncAssignedForms } from './forms.service.js';
import { syncAssignedTasks } from './tareas.service.js';
import { syncPayloadsCatalogs } from './payloads.service.js';
import { syncAssignedPdis } from './pdis.service.js';
import { fetchAndStoreMaxDays, getStoredMaxDays } from './usuarios.service.js';
import { getSessionCatalogContext } from './session-catalog-context.service.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';

const CATALOG_KEYS = ['formularios', 'tareas', 'pdis', 'payloads', 'payloadsTasks'];

export async function syncAllCatalogs({ refreshMaxDays = true } = {}) {
  const sessionContext = getSessionCatalogContext();
  if (sessionContext.hasStableIdentity) {
    await catalogIndexedDbService.clearAnonCatalogEntries({ catalogKeys: CATALOG_KEYS });
  }

  const maxdays = refreshMaxDays && sessionContext.hasStableIdentity
    ? await fetchAndStoreMaxDays()
    : getStoredMaxDays();

  const [forms, tasks, payloads, pdis] = await Promise.all([
    syncAssignedForms(),
    syncAssignedTasks({ maxdays }),
    syncPayloadsCatalogs({ maxdays }),
    syncAssignedPdis()
  ]);

  return {
    maxdays,
    skipped: !sessionContext.hasStableIdentity,
    reason: sessionContext.hasStableIdentity ? null : 'missing_user_id',
    forms,
    tasks,
    payloads,
    pdis
  };
}
