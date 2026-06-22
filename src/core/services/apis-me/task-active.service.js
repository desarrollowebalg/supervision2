import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import { getSessionCatalogContext } from './session-catalog-context.service.js';

const TASK_ACTIVE_CATALOG_KEY = 'task_active';
const TASK_ACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUS_PRIORITY = [17, 13, 16];
const STATUS_TIMELINE_KEYS = {
  16: 'salidaAt',
  13: 'arriboAt',
  17: 'inicioOperacionesAt',
  3: 'terminadaAt'
};

class TaskActiveService {
  static instancia = null;

  constructor() {
    if (TaskActiveService.instancia) {
      return TaskActiveService.instancia;
    }

    TaskActiveService.instancia = this;
  }

  async getActiveTask() {
    const { contextKey } = getSessionCatalogContext();
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: TASK_ACTIVE_CATALOG_KEY,
      contextKey
    });

    if (!Array.isArray(cached?.data) || !cached.data.length) {
      return null;
    }

    return cached.data[0] || null;
  }

  async setActiveTask(task) {
    const { contextKey } = getSessionCatalogContext();
    const now = Date.now();
    const normalizedTask = task && typeof task === 'object'
      ? {
        ...task,
        LATITUDE: Number.isFinite(Number(task?.LATITUDE)) ? Number(task?.LATITUDE) : null,
        LONGITUDE: Number.isFinite(Number(task?.LONGITUDE)) ? Number(task?.LONGITUDE) : null,
        meta: {
          startedAt: task?.meta?.startedAt || now,
          sourceDevice: task?.meta?.sourceDevice || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
          lastSyncAt: now,
          timeline: {
            ...(task?.meta?.timeline || {}),
            ...(Number(task?.ID_STATUS) === 16 ? { salidaAt: now } : {})
          }
        }
      }
      : null;

    await catalogIndexedDbService.saveCatalog({
      catalogKey: TASK_ACTIVE_CATALOG_KEY,
      contextKey,
      data: normalizedTask ? [normalizedTask] : [],
      ttlMs: TASK_ACTIVE_TTL_MS
    });
  }

  async clearActiveTask() {
    const { contextKey } = getSessionCatalogContext();
    await catalogIndexedDbService.clearCatalog({
      catalogKey: TASK_ACTIVE_CATALOG_KEY,
      contextKey
    });
  }

  async syncFromTasks(tasks = []) {
    const taskList = Array.isArray(tasks) ? tasks : [];
    const activeCandidates = taskList.filter((task) => ACTIVE_STATUS_PRIORITY.includes(Number(task?.ID_STATUS)));

    if (!activeCandidates.length) {
      await this.clearActiveTask();
      return null;
    }

    const activeTask = activeCandidates.sort((left, right) => {
      const leftPriority = ACTIVE_STATUS_PRIORITY.indexOf(Number(left?.ID_STATUS));
      const rightPriority = ACTIVE_STATUS_PRIORITY.indexOf(Number(right?.ID_STATUS));
      return leftPriority - rightPriority;
    })[0] || null;
    const currentActiveTask = await this.getActiveTask();
    const currentActiveTaskId = String(currentActiveTask?.ID_TAREA ?? '');
    const activeTaskId = String(activeTask?.ID_TAREA ?? '');

    if (currentActiveTaskId !== activeTaskId) {
      await this.setActiveTask(activeTask);
      return activeTask;
    }

    await this.setActiveTask({
      ...currentActiveTask,
      ...activeTask
    });
    return activeTask;
  }

  async registerStatusChange({ task, statusId }) {
    const normalizedStatusId = Number(statusId);
    const timelineKey = STATUS_TIMELINE_KEYS[normalizedStatusId];
    if (!task || !timelineKey) {
      return;
    }

    const current = await this.getActiveTask();
    const currentId = String(current?.ID_TAREA ?? '');
    const taskId = String(task?.ID_TAREA ?? '');
    if (!taskId || (currentId && currentId !== taskId)) {
      return;
    }

    const now = Date.now();
    const mergedTask = {
      ...(current || {}),
      ...task,
      ID_STATUS: normalizedStatusId,
      LATITUDE: Number.isFinite(Number(task?.LATITUDE)) ? Number(task?.LATITUDE) : Number(current?.LATITUDE),
      LONGITUDE: Number.isFinite(Number(task?.LONGITUDE)) ? Number(task?.LONGITUDE) : Number(current?.LONGITUDE),
      meta: {
        startedAt: current?.meta?.startedAt || now,
        sourceDevice: current?.meta?.sourceDevice || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
        lastSyncAt: now,
        timeline: {
          ...(current?.meta?.timeline || {}),
          [timelineKey]: now
        }
      }
    };

    if (normalizedStatusId === 3) {
      await this.clearActiveTask();
      return;
    }

    await this.setActiveTask(mergedTask);
  }
}

const taskActiveService = new TaskActiveService();
export default taskActiveService;
