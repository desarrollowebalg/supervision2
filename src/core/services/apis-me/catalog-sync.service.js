import { fetchAndStoreFormsConfig, syncClientUsers } from './usuarios.service.js';
import { syncClientCuadrantes } from './cuadrantes.service.js';
import { getSessionCatalogContext } from './session-catalog-context.service.js';
import catalogIndexedDbService from '../catalog-indexeddb.service.js';

const CATALOG_KEYS = ['usuarios', 'cuadrantes'];

export async function syncAllCatalogs({ refreshMaxDays = true } = {}) {
  const sessionContext = getSessionCatalogContext();
  if (sessionContext.hasStableIdentity) {
    await catalogIndexedDbService.clearAnonCatalogEntries({ catalogKeys: CATALOG_KEYS });
  }

  const [users, cuadrantes, confForms] = await Promise.all([
    syncClientUsers(),
    syncClientCuadrantes(),
    fetchAndStoreFormsConfig()
  ]);

  return {
    skipped: !sessionContext.hasStableIdentity,
    reason: sessionContext.hasStableIdentity ? null : 'missing_user_id',
    users,
    cuadrantes,
    confForms
  };
}
