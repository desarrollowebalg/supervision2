import { renderInicioLayout } from '../inicio-layout.js';
import {
  getAssignedTasksFromLocal,
  patchTaskStatusInLocalCatalog,
  updateTaskStatus
} from '../../core/services/apis-me/tareas.service.js';
import { getAssignedForms } from '../../core/services/apis-me/forms.service.js';
import taskActiveService from '../../core/services/apis-me/task-active.service.js';
import taskStatusStateService, { TASK_STATUS_ACTIONS } from '../../core/services/apis-me/task-status-state.service.js';
import { geolocationService } from '../../core/services/geolocation.service.js';

export default class TareaDetalle {
  static instancia = null;

  constructor(navigationContext = {}) {
    if (TareaDetalle.instancia) {
      TareaDetalle.instancia.navigationContext = navigationContext;
      return TareaDetalle.instancia;
    }

    this.navigationContext = navigationContext;
    TareaDetalle.instancia = this;
  }

  render(container, params = {}) {
    this.container = container;
    this.params = params;
    this.ensureTaskDetailStyles();

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="task-detail-page">
        <div class="uk-margin-small-bottom uk-flex uk-flex-between uk-flex-middle">
          <button id="taskDetailBackBtn" class="uk-button uk-button-default uk-hidden uk-border-rounded" type="button" aria-label="Regresar">
            <span uk-icon="arrow-left"></span>
          </button>
          <button id="taskDetailRefreshBtn" class="uk-button uk-button-default uk-hidden" type="button" aria-label="Actualizar detalle">
            <span uk-icon="refresh"></span>
          </button>
        </div>
        <div id="taskDetailState"></div>
        </section>
      `
    });

    container.querySelector('.inicio-padding-card > h1.uk-card-title')?.remove();
    this.bindEvents(container);
    this.loadTaskDetail(container);
  }

  bindEvents(container) {
    container.querySelector('#taskDetailBackBtn')?.addEventListener('click', () => {
      window.history.back();
    });

    container.querySelector('#taskDetailRefreshBtn')?.addEventListener('click', () => {
      this.loadTaskDetail(container);
    });
  }

  async loadTaskDetail(container) {
    const stateNode = container.querySelector('#taskDetailState');
    if (!stateNode) {
      return;
    }

    stateNode.innerHTML = '<div class="uk-flex uk-flex-center uk-padding"><div uk-spinner></div></div>';

    try {
      const tasks = await getAssignedTasksFromLocal();
      await taskActiveService.syncFromTasks(tasks);
      const task = this.resolveTaskByParam(tasks, this.params?.taskId);
      const transition = await taskStatusStateService.getTaskTransition(task?.ID_TAREA);
      const displayStatus = taskStatusStateService.resolveDisplayStatus(task, transition);
      const activeTask = await taskActiveService.getActiveTask();
      const hasTaskInProgress = Boolean(activeTask?.ID_TAREA);
      const currentTaskId = String(task?.ID_TAREA ?? '');
      const activeTaskId = String(activeTask?.ID_TAREA ?? '');
      const isOtherTaskActive = hasTaskInProgress && currentTaskId !== activeTaskId;
      const buttonState = this.resolveWorkflowButtonsState({
        statusId: displayStatus.statusId,
        isOtherTaskActive
      });

      const taskTitle = this.escapeHtml(task?.NOMBRE_TAREA || 'Tarea sin titulo');
      const taskStatus = this.escapeHtml(displayStatus.statusText || 'Sin estatus');
      const taskStatusClass = this.resolveStatusLabelClass(displayStatus.statusText, displayStatus.statusId);
      const taskDescription = this.escapeHtml(task?.DESCRIPCION || 'Sin descripcion');
      const taskScheduledAt = this.escapeHtml(this.formatScheduledDate(task?.FECHA_PROGRAMADA));
      const taskPlace = this.escapeHtml(task?.ITEM_NUMBER_PDI || 'Sin lugar asociado');
      const taskAddress = this.escapeHtml(task?.DIRECCION || '');
      const taskItemNumber = this.escapeHtml(task?.ITEM_NUMBER || 'Sin item number');
      const activeElapsed = this.resolveActiveElapsed(activeTask, task);
      const lockMessage = isOtherTaskActive
        ? `<div class="uk-alert-warning uk-border-rounded uk-margin-small-bottom task-detail-alert task-detail-alert--warning" uk-alert>
            <p>Hay una tarea activa en progreso. Debes finalizarla antes de continuar con esta tarea.</p>
          </div>`
        : '';

      stateNode.innerHTML = `
        <article class="uk-card uk-card-default uk-card-body uk-border-rounded task-detail-card">
          ${lockMessage}
          <div class="uk-grid-medium uk-flex-middle" uk-grid>
            <div class="uk-width-expand@m">
              <div class="uk-card uk-card-muted uk-border-rounded uk-padding-small task-detail-summary-card">
                <div class="uk-margin-small-bottom">
                  <p class="uk-margin-remove-bottom uk-margin-small-bottom">
                    <span class="uk-label ${taskStatusClass}">${taskStatus}</span>
                  </p>
                  <h1 class="uk-card-title uk-margin-remove-bottom">${taskTitle}</h1>
                </div>                
                <div class="uk-grid-small uk-child-width-1-2@s" uk-grid>
                  <div>                    
                    <p class="uk-margin-small-top uk-margin-remove-bottom">${taskDescription}</p>
                  </div>
                  <div>
                    <p class="uk-text-meta uk-margin-remove-bottom">🗓️ Programada</p>
                    <p class="uk-margin-small-top uk-margin-remove-bottom">${taskScheduledAt}</p>
                  </div>
                </div>
                <hr class="uk-margin-small-top uk-margin-small-bottom">
                <p class="uk-text-meta uk-margin-remove-bottom">📍 Ubicación</p>
                <p class="uk-margin-small-top uk-margin-remove-bottom">${taskPlace}</p>
                ${taskAddress ? `<p class="uk-margin-small-top uk-text-meta uk-margin-remove-bottom">${taskAddress}</p>` : ''}
                <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom uk-hidden">Item number</p>
                <p class="uk-margin-small-top uk-margin-remove-bottom uk-hidden">${taskItemNumber}</p>
                ${activeElapsed ? `<p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">⏱️ Tiempo activa: ${this.escapeHtml(activeElapsed)}</p>` : ''}
              </div>
            </div>
            <div class="uk-width-1-3@m">
              <div class="uk-flex uk-flex-column uk-flex-middle uk-grid-small" uk-grid>
                <div class="uk-width-1-1">
                  <button id="taskSalidaBtn" class="uk-button uk-button-primary uk-width-1-1 uk-border-rounded" type="button" ${buttonState.salida.disabled ? 'disabled' : ''}>Salida a tarea</button>
                </div>
                <div class="uk-width-1-1">
                  <button id="taskArriboBtn" class="uk-button uk-button-primary uk-width-1-1 uk-border-rounded" type="button" ${buttonState.arribo.disabled ? 'disabled' : ''}>Notificacion de arribo</button>
                </div>
                <div class="uk-width-1-1">
                  <button id="taskInicioBtn" class="uk-button uk-button-primary uk-width-1-1 uk-border-rounded" type="button" ${buttonState.inicioOperaciones.disabled ? 'disabled' : ''}>Inicio de operaciones</button>
                </div>
                <div class="uk-width-1-1">
                  <button id="taskDocumentarBtn" class="uk-button ${buttonState.documentar.disabled ? 'uk-button-default' : 'uk-button-success'} uk-width-1-1 uk-border-rounded" type="button" ${buttonState.documentar.disabled ? 'disabled' : ''}>Documentar</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;

      this.bindTaskWorkflowActions(stateNode, task, buttonState);
    } catch (error) {
      stateNode.innerHTML = `
        <div class="uk-alert-danger uk-border-rounded task-detail-alert task-detail-alert--danger" uk-alert>
          <p>No fue posible cargar el detalle de la tarea.</p>
        </div>
      `;
    }
  }

  bindTaskWorkflowActions(stateNode, task, buttonState) {
    if (!task) {
      return;
    }

    const buttonMap = [
      { id: '#taskSalidaBtn', action: 'salida' },
      { id: '#taskArriboBtn', action: 'arribo' },
      { id: '#taskInicioBtn', action: 'inicioOperaciones' }
    ];

    buttonMap.forEach((entry) => {
      const button = stateNode.querySelector(entry.id);
      if (!button || buttonState?.[entry.action]?.disabled) {
        return;
      }

      button.addEventListener('click', async () => {
        await this.executeStatusTransition(task, entry.action);
      });
    });

    const documentarButton = stateNode.querySelector('#taskDocumentarBtn');
    if (documentarButton && !buttonState?.documentar?.disabled) {
      documentarButton.addEventListener('click', async () => {
        await this.openTaskForm(task);
      });
    }
  }

  async openTaskForm(task) {
    const taskFormId = Number(task?.ID_FORMULARIO);
    if (!Number.isFinite(taskFormId) || taskFormId <= 0) {
      this.notifyTaskFormError('La tarea no tiene formulario valido asociado.');
      return;
    }

    const forms = await getAssignedForms();
    const formMatch = Array.isArray(forms)
      ? forms.find((form) => Number(form?.CLV) === taskFormId)
      : null;

    if (!formMatch) {
      this.notifyTaskFormError('No se encontro el formulario asociado en tus catalogos.');
      return;
    }

    const indicator = String(formMatch?.ITEM_NUMBER || '').trim();
    const clv = String(formMatch?.CLV || '').trim();
    const taskId = String(task?.ID_TAREA || '').trim();
    const taskClvCaptura = String(task?.CLV_CAPTURA || '').trim();
    const taskStatus = '3';

    if (!indicator || !clv || !taskId || !taskClvCaptura) {
      this.notifyTaskFormError('No se pudo preparar la apertura del formulario de la tarea.');
      return;
    }

    const targetHash = `#/formularios/${encodeURIComponent(indicator)}?clv=${encodeURIComponent(clv)}&source=task&taskId=${encodeURIComponent(taskId)}&taskClvCaptura=${encodeURIComponent(taskClvCaptura)}&taskStatus=${encodeURIComponent(taskStatus)}`;
    window.location.hash = targetHash;
  }

  notifyTaskFormError(message) {
    if (window.UIkit?.notification) {
      window.UIkit.notification({
        message: this.escapeHtml(String(message || 'No fue posible abrir el formulario asociado.')),
        status: 'danger',
        pos: 'top-center',
        timeout: 3500
      });
      return;
    }

    window.alert(String(message || 'No fue posible abrir el formulario asociado.'));
  }

  async executeStatusTransition(task, actionKey) {
    const actionConfig = TASK_STATUS_ACTIONS[actionKey];
    if (!actionConfig) {
      return;
    }

    const taskId = task?.ID_TAREA ?? null;
    const taskClvCaptura = task?.CLV_CAPTURA ?? null;
    const previousStatus = task?.ESTATUS ?? '';
    const locationSnapshot = await this.captureCurrentTaskCoordinates();
    if (!locationSnapshot) {
      return;
    }

    const taskWithCurrentLocation = {
      ...task,
      LATITUDE: locationSnapshot.latitude,
      LONGITUDE: locationSnapshot.longitude
    };

    if (actionKey === 'salida') {
      await taskActiveService.setActiveTask(taskWithCurrentLocation);
    }

    await taskStatusStateService.setPendingTransition({
      taskId,
      previousStatus,
      nextStatus: actionConfig.statusId,
      nextText: actionConfig.statusText
    });
    await patchTaskStatusInLocalCatalog({
      taskId,
      statusId: actionConfig.statusId,
      statusText: actionConfig.statusText
    });
    this.loadTaskDetail(this.container);

    try {
      await updateTaskStatus({
        taskClvCaptura,
        statusId: actionConfig.statusId,
        latitud: locationSnapshot.latitude,
        longitud: locationSnapshot.longitude
      });
      await taskStatusStateService.confirmTransition(taskId);
      await taskActiveService.registerStatusChange({
        task: {
          ...taskWithCurrentLocation,
          ID_STATUS: actionConfig.statusId,
          ESTATUS: actionConfig.statusText
        },
        statusId: actionConfig.statusId
      });

    } catch (error) {
      const rollbackTransition = await taskStatusStateService.rollbackTransition(taskId);
      await patchTaskStatusInLocalCatalog({
        taskId,
        statusId: task?.ID_STATUS ?? null,
        statusText: rollbackTransition?.previousStatus || previousStatus
      });
    }

    this.loadTaskDetail(this.container);
  }

  async captureCurrentTaskCoordinates() {
    const locationResult = await geolocationService.ensurePermissionAndCapture();
    if (!locationResult?.ok || !locationResult?.snapshot) {
      const message = locationResult?.error || 'No fue posible obtener la ubicacion actual.';
      if (window.UIkit?.notification) {
        window.UIkit.notification({
          message: this.escapeHtml(String(message)),
          status: 'warning',
          pos: 'top-center',
          timeout: 3500
        });
      } else {
        window.alert(String(message));
      }
      return null;
    }

    const latitude = Number(locationResult.snapshot.latitude);
    const longitude = Number(locationResult.snapshot.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      if (window.UIkit?.notification) {
        window.UIkit.notification({
          message: 'No fue posible obtener coordenadas validas.',
          status: 'warning',
          pos: 'top-center',
          timeout: 3500
        });
      } else {
        window.alert('No fue posible obtener coordenadas validas.');
      }
      return null;
    }

    return { latitude, longitude };
  }

  resolveWorkflowButtonsState({ statusId, isOtherTaskActive }) {
    const normalizedStatusId = Number(statusId);
    const baseState = {
      salida: { disabled: true },
      arribo: { disabled: true },
      inicioOperaciones: { disabled: true },
      documentar: { disabled: true }
    };

    if (isOtherTaskActive) {
      return baseState;
    }

    if (normalizedStatusId === 16) {
      return {
        ...baseState,
        arribo: { disabled: false }
      };
    }

    if (normalizedStatusId === 13) {
      return {
        ...baseState,
        inicioOperaciones: { disabled: false }
      };
    }

    if (normalizedStatusId === 17) {
      return {
        ...baseState,
        documentar: { disabled: false }
      };
    }

    return {
      ...baseState,
      salida: { disabled: false }
    };
  }

  resolveActiveElapsed(activeTask, task) {
    const activeTaskId = String(activeTask?.ID_TAREA ?? '');
    const currentTaskId = String(task?.ID_TAREA ?? '');
    if (!activeTaskId || activeTaskId !== currentTaskId) {
      return '';
    }

    const startedAt = Number(activeTask?.meta?.startedAt);
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      return '';
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  resolveTaskByParam(tasks, taskIdParam) {
    if (!Array.isArray(tasks) || !taskIdParam) {
      return null;
    }

    return tasks.find((task, index) => {
      const rawId = task?.ID_TAREA;
      const normalizedId = String(rawId ?? `idx-${index}`);
      return normalizedId === String(taskIdParam);
    }) || null;
  }

  escapeHtml(value) {
    if (value === null || value === undefined) {
      return '-';
    }

    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  formatScheduledDate(rawValue) {
    if (!rawValue) {
      return 'Sin fecha programada';
    }

    const normalized = String(rawValue).replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return String(rawValue);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  resolveStatusLabelClass(rawStatus, rawStatusId = null) {
    const statusId = Number(rawStatusId);
    if ([4, 13, 16, 17, 18].includes(statusId)) {
      return 'uk-label-warning';
    }
    if (statusId === 12 || statusId === 3) {
      return 'uk-label-success';
    }

    const status = String(rawStatus || '').toLowerCase();
    if (status.includes('complet') || status.includes('terminad') || status.includes('cerrad')) {
      return 'uk-label-success';
    }
    if (status.includes('proceso') || status.includes('curso') || status.includes('operacion') || status.includes('salida')) {
      return 'uk-label-warning';
    }
    if (status.includes('cancel') || status.includes('rechaz') || status.includes('error')) {
      return 'uk-label-danger';
    }
    return '';
  }

  ensureTaskDetailStyles() {
    if (document.getElementById('task-detail-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'task-detail-page-styles';
    style.textContent = `
      .task-detail-page {
        --task-detail-accent: var(--app-primary, #1e87f0);
        --task-detail-surface: var(--app-surface, #ffffff);
        --task-detail-surface-muted: var(--app-surface-muted, #f3f4f6);
        --task-detail-border: var(--app-border, #e5e7eb);
        --task-detail-border-strong: var(--app-border-strong, #cbd5e1);
        --task-detail-text: var(--app-text, #1f2937);
        --task-detail-text-muted: var(--app-text-muted, #6b7280);
        --task-detail-warning-bg: color-mix(in srgb, var(--task-detail-surface) 84%, #f59e0b 16%);
        --task-detail-warning-text: color-mix(in srgb, var(--task-detail-text) 72%, #b45309 28%);
        --task-detail-warning-border: color-mix(in srgb, var(--task-detail-border) 58%, #f59e0b 42%);
        --task-detail-danger-bg: color-mix(in srgb, var(--task-detail-surface) 84%, #ef4444 16%);
        --task-detail-danger-text: color-mix(in srgb, var(--task-detail-text) 72%, #b91c1c 28%);
        --task-detail-danger-border: color-mix(in srgb, var(--task-detail-border) 58%, #ef4444 42%);
      }

      html[data-theme='dark'] .task-detail-page {
        --task-detail-warning-bg: color-mix(in srgb, var(--task-detail-surface-muted) 82%, #f59e0b 18%);
        --task-detail-warning-text: #fcd34d;
        --task-detail-warning-border: color-mix(in srgb, var(--task-detail-border-strong) 60%, #f59e0b 40%);
        --task-detail-danger-bg: color-mix(in srgb, var(--task-detail-surface-muted) 82%, #ef4444 18%);
        --task-detail-danger-text: #fca5a5;
        --task-detail-danger-border: color-mix(in srgb, var(--task-detail-border-strong) 60%, #ef4444 40%);
      }

      .task-detail-card,
      .task-detail-summary-card {
        border-color: var(--task-detail-border);
      }

      .task-detail-summary-card {
        background: var(--task-detail-surface-muted);
      }

      .task-detail-alert {
        border: 1px solid var(--task-detail-warning-border);
      }

      .task-detail-alert--warning {
        background: var(--task-detail-warning-bg);
        color: var(--task-detail-warning-text);
        border-color: var(--task-detail-warning-border);
      }

      .task-detail-alert--danger {
        background: var(--task-detail-danger-bg);
        color: var(--task-detail-danger-text);
        border-color: var(--task-detail-danger-border);
      }

      .task-detail-alert p {
        color: inherit;
      }
    `;
    document.head.appendChild(style);
  }
}
