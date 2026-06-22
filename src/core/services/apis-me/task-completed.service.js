import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import { getSessionCatalogContext } from './session-catalog-context.service.js';

const TASK_COMPLETED_CATALOG_KEY = 'task_completed';
const TASK_COMPLETED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class TaskCompletedService {
  static instancia = null;

  constructor() {
    if (TaskCompletedService.instancia) {
      return TaskCompletedService.instancia;
    }

    TaskCompletedService.instancia = this;
  }

  async appendCompletedTasks(tasks = []) {
    const completedTasks = Array.isArray(tasks)
      ? tasks.filter((task) => Number(task?.ID_STATUS) === 3)
      : [];
    if (!completedTasks.length) {
      return;
    }

    const { contextKey } = getSessionCatalogContext();
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: TASK_COMPLETED_CATALOG_KEY,
      contextKey
    });
    const current = Array.isArray(cached?.data) ? cached.data : [];
    const merged = [...current];

    completedTasks.forEach((task) => {
      const taskId = String(task?.ID_TAREA ?? '');
      if (!taskId) {
        return;
      }

      const existingIndex = merged.findIndex((item) => String(item?.ID_TAREA ?? '') === taskId);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...task };
      } else {
        merged.push(task);
      }
    });

    await catalogIndexedDbService.saveCatalog({
      catalogKey: TASK_COMPLETED_CATALOG_KEY,
      contextKey,
      data: merged,
      ttlMs: TASK_COMPLETED_TTL_MS
    });
  }
}

const taskCompletedService = new TaskCompletedService();
export default taskCompletedService;
