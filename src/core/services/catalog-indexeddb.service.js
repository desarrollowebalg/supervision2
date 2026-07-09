import Dexie from 'dexie';

class CatalogDatabase extends Dexie {
  constructor() {
    super('appLiteSup');

    this.version(1).stores({
      catalogs: 'id, catalogKey, contextKey, updatedAt, expiresAt, version',
      syncMeta: 'id, catalogKey, contextKey, lastSyncAt, etag, hash'
    });
  }
}

class CatalogIndexedDbService {
  static instancia = null;

  constructor() {
    if (CatalogIndexedDbService.instancia) {
      return CatalogIndexedDbService.instancia;
    }

    this.db = new CatalogDatabase();
    CatalogIndexedDbService.instancia = this;
  }

  buildId(catalogKey, contextKey) {
    return `${catalogKey}:${contextKey}`;
  }

  async getCatalog({ catalogKey, contextKey }) {
    return this.db.catalogs.get(this.buildId(catalogKey, contextKey));
  }

  async saveCatalog({
    catalogKey,
    contextKey,
    data,
    version = null,
    ttlMs = 30 * 60 * 1000
  }) {
    const now = Date.now();
    const id = this.buildId(catalogKey, contextKey);

    await this.db.transaction('rw', this.db.catalogs, this.db.syncMeta, async () => {
      await this.db.catalogs.put({
        id,
        catalogKey,
        contextKey,
        data,
        version,
        updatedAt: now,
        expiresAt: now + ttlMs
      });

      await this.db.syncMeta.put({
        id,
        catalogKey,
        contextKey,
        lastSyncAt: now,
        etag: null,
        hash: null
      });
    });
  }

  async getOrSyncCatalog({
    catalogKey,
    contextKey,
    fetcher,
    ttlMs = 30 * 60 * 1000,
    forceRefresh = false
  }) {
    if (typeof fetcher !== 'function') {
      throw new Error('Catalog fetcher must be a function');
    }

    const cached = await this.getCatalog({ catalogKey, contextKey });
    const isFresh = Boolean(cached) && Number(cached.expiresAt || 0) > Date.now();

    if (!forceRefresh && cached && isFresh) {
      return {
        data: cached.data,
        source: 'cache',
        stale: false
      };
    }

    try {
      const networkData = await fetcher();
      const normalizedData = networkData;

      await this.saveCatalog({
        catalogKey,
        contextKey,
        data: normalizedData,
        ttlMs
      });

      return {
        data: normalizedData,
        source: 'network',
        stale: false
      };
    } catch (error) {
      if (cached) {
        return {
          data: cached.data,
          source: 'stale-cache',
          stale: true,
          error
        };
      }

      throw error;
    }
  }

  async clearCatalog({ catalogKey, contextKey }) {
    const id = this.buildId(catalogKey, contextKey);

    await this.db.transaction('rw', this.db.catalogs, this.db.syncMeta, async () => {
      await this.db.catalogs.delete(id);
      await this.db.syncMeta.delete(id);
    });
  }

  async clearAnonCatalogEntries({ catalogKeys = [] } = {}) {
    const normalizedKeys = Array.isArray(catalogKeys) ? catalogKeys.filter(Boolean) : [];
    if (!normalizedKeys.length) {
      return 0;
    }

    const idsToDelete = [];
    for (const catalogKey of normalizedKeys) {
      const prefix = `${catalogKey}:user_anon:`;
      const matches = await this.db.catalogs.where('id').startsWith(prefix).primaryKeys();
      idsToDelete.push(...matches);
    }

    const uniqueIds = Array.from(new Set(idsToDelete));
    if (!uniqueIds.length) {
      return 0;
    }

    await this.db.transaction('rw', this.db.catalogs, this.db.syncMeta, async () => {
      await this.db.catalogs.bulkDelete(uniqueIds);
      await this.db.syncMeta.bulkDelete(uniqueIds);
    });

    return uniqueIds.length;
  }
}

const catalogIndexedDbService = new CatalogIndexedDbService();
export default catalogIndexedDbService;
