import catalogIndexedDbService from '../catalog-indexeddb.service.js';
import { getSessionCatalogContext } from './session-catalog-context.service.js';

const TASK_STATUS_STATE_CATALOG_KEY = 'task_status_state';
const TASK_STATUS_STATE_TTL_MS = 24 * 60 * 60 * 1000;

export const TASK_STATUS_ACTIONS = {
  salida: {
    statusId: 16,
    statusText: 'Salida a tarea'
  },
  arribo: {
    statusId: 13,
    statusText: 'Notificacion de arribo'
  },
  inicioOperaciones: {
    statusId: 17,
    statusText: 'Inicio de operaciones'
  },
  terminada: {
    statusId: 3,
    statusText: 'Tarea terminada'
  }
};

class TaskStatusStateService {
  static instancia = null;

  constructor() {
    if (TaskStatusStateService.instancia) {
      return TaskStatusStateService.instancia;
    }

    TaskStatusStateService.instancia = this;
  }

  async getAllTransitions() {
    const { contextKey } = getSessionCatalogContext();
    const cached = await catalogIndexedDbService.getCatalog({
      catalogKey: TASK_STATUS_STATE_CATALOG_KEY,
      contextKey
    });

    return Array.isArray(cached?.data) ? cached.data : [];
  }

  async getTaskTransition(taskId) {
    const normalizedTaskId = String(taskId ?? '');
    if (!normalizedTaskId) {
      return null;
    }

    const transitions = await this.getAllTransitions();
    return transitions.find((item) => String(item?.taskId) === normalizedTaskId) || null;
  }

  async setPendingTransition({ taskId, previousStatus, nextStatus, nextText }) {
    const normalizedTaskId = String(taskId ?? '');
    if (!normalizedTaskId) {
      return null;
    }

    const transitions = await this.getAllTransitions();
    const withoutCurrent = transitions.filter((item) => String(item?.taskId) !== normalizedTaskId);
    const transition = {
      taskId: normalizedTaskId,
      previousStatus: String(previousStatus ?? ''),
      nextStatus: Number(nextStatus) || null,
      nextText: String(nextText ?? ''),
      pending: true,
      updatedAt: Date.now()
    };

    await this.saveTransitions([...withoutCurrent, transition]);
    return transition;
  }

  async confirmTransition(taskId) {
    const normalizedTaskId = String(taskId ?? '');
    if (!normalizedTaskId) {
      return;
    }

    const transitions = await this.getAllTransitions();
    const withoutCurrent = transitions.filter((item) => String(item?.taskId) !== normalizedTaskId);
    await this.saveTransitions(withoutCurrent);
  }

  async rollbackTransition(taskId) {
    const normalizedTaskId = String(taskId ?? '');
    if (!normalizedTaskId) {
      return null;
    }

    const transitions = await this.getAllTransitions();
    const current = transitions.find((item) => String(item?.taskId) === normalizedTaskId) || null;
    const withoutCurrent = transitions.filter((item) => String(item?.taskId) !== normalizedTaskId);
    await this.saveTransitions(withoutCurrent);
    return current;
  }

  resolveDisplayStatus(task, transition = null) {
    const baseStatus = String(task?.ESTATUS ?? task?.ID_STATUS ?? 'N/D');
    const baseStatusId = Number(task?.ID_STATUS);

    if (transition && (transition.pending || transition.nextText)) {
      return {
        statusText: transition.nextText || baseStatus,
        statusId: Number(transition.nextStatus) || baseStatusId || null,
        isOptimistic: Boolean(transition.pending)
      };
    }

    return {
      statusText: baseStatus,
      statusId: Number.isFinite(baseStatusId) ? baseStatusId : null,
      isOptimistic: false
    };
  }

  async saveTransitions(transitions) {
    const { contextKey } = getSessionCatalogContext();
    await catalogIndexedDbService.saveCatalog({
      catalogKey: TASK_STATUS_STATE_CATALOG_KEY,
      contextKey,
      data: Array.isArray(transitions) ? transitions : [],
      ttlMs: TASK_STATUS_STATE_TTL_MS
    });
  }
}

const taskStatusStateService = new TaskStatusStateService();
export default taskStatusStateService;
