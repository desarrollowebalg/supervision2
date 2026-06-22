import { renderInicioLayout } from '../inicio-layout.js';
import { getCachedFormByIndicator } from '../../core/services/apis-me/forms.service.js';
import { getFormSchemaByClv } from '../../core/services/apis-me/form-engine.service.js';
import {
  closeTask,
  getAssignedTasksFromLocal,
  patchTaskStatusInLocalCatalog,
  syncAssignedTasks
} from '../../core/services/apis-me/tareas.service.js';
import taskActiveService from '../../core/services/apis-me/task-active.service.js';
import taskCompletedService from '../../core/services/apis-me/task-completed.service.js';
import { renderSchemaForm } from './schema-renderer/schema-form.renderer.js';
import { geolocationService } from '../../core/services/geolocation.service.js';

export default class FormEvidencia {
  static instancia = null;
  static ACTIVE_FORM_PREFIX = 'forms_active_';
  static ACTIVE_FORM_POINTER_KEY = 'forms_active_current';

  constructor(context = {}) {
    if (FormEvidencia.instancia) {
      return FormEvidencia.instancia;
    }

    this.context = context;
    this._exitGuard = null;
    FormEvidencia.instancia = this;
  }

  async inicializar(container, params = {}) {
    if (container) {
      await this.render(container, params);
    }

    return this;
  }

  async render(container, params = {}, query = {}) {
    this.teardownExitGuard();
    this.ensureFormEvidenceStyles();
    const taskFlowContext = this.resolveTaskFlowContext(query);
    const indicator = decodeURIComponent(params.indicator || '');
    const form = await getCachedFormByIndicator(indicator);
    const queryClv = this.getQueryClv(query);
    const clv = queryClv || this.resolveClvFromForm(form);
    const formName = this.cleanDescription(form?.DESCRIPCION || indicator || 'Formulario');
    const formRef = this.buildFormRef(indicator, clv, formName, form);

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <div class="uk-flex uk-flex-center">
          <div class="uk-width-1-1 uk-width-5-6@m uk-width-2-3@l">
            <div class="uk-margin-small-bottom">
              <a href="#/formularios" data-route="/formularios" class="uk-button uk-button-default uk-border-rounded">
                <span uk-icon="icon: arrow-left" class="uk-margin-small-right"></span>Volver al listado
              </a>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-small">
              <h2 class="uk-margin-remove">${this.escapeHtml(formName)}</h2>
              <p id="formAutosaveStatus" class="uk-text-meta uk-text-small uk-margin-small-top uk-margin-small-bottom">Sin guardado automatico</p>
              <p id="formSubmitResult" class="uk-text-meta uk-text-small uk-margin-small-top uk-margin-small-bottom"></p>
              <div id="formSchemaStateContainer" class="uk-margin-top"></div>
              <p class="uk-margin-large-top uk-text-center uk-text-right@m form-powered-by">
                Powered by <span class="uk-text-primary form-powered-by-brand">movilizandome</span>
              </p>
            </div>
          </div>
        </div>
      `
    });

    this.renderAutosaveStatus(formRef);
    this.setupExitGuard(formRef);
    await this.loadSchemaWithGpsGuard(clv, formRef, taskFlowContext);
  }

  async loadSchemaWithGpsGuard(clv, formRef, taskFlowContext = null) {
    const stateContainer = document.querySelector('#formSchemaStateContainer');
    if (!stateContainer) {
      return;
    }

    const result = await geolocationService.ensurePermissionAndCapture();
    if (!result?.ok || !result?.snapshot) {
      this.renderGpsOverlay(stateContainer, result?.error || 'Permiso de geolocalizacion requerido.', async () => {
        await this.loadSchemaWithGpsGuard(clv, formRef, taskFlowContext);
      });
      return;
    }

    await this.loadSchema(clv, formRef, result.snapshot, taskFlowContext);
  }

  async loadSchema(clv, formRef, gpsSnapshot = null, taskFlowContext = null) {
    const stateContainer = document.querySelector('#formSchemaStateContainer');
    if (!stateContainer) {
      return;
    }

    if (!clv) {
      stateContainer.innerHTML = `
        <div class="uk-alert-warning" uk-alert>
          <p>No se encontro CLV para este formulario.</p>
        </div>
      `;
      return;
    }

    stateContainer.innerHTML = `
      <div class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner></div>
      </div>
    `;

    const result = await getFormSchemaByClv(clv);
    if (!result?.ok || !result?.schema) {
      stateContainer.innerHTML = `
        <div class="uk-alert-danger" uk-alert>
          <p>No fue posible cargar el esquema del formulario.</p>
          <p class="uk-text-meta">${this.escapeHtml(result?.error || 'Error desconocido')}</p>
        </div>
      `;
      return;
    }

    this.registerActiveForm(result.schema, formRef, gpsSnapshot);
    await renderSchemaForm(result.schema, stateContainer, {
      readOnlyMode: false,
      respectFieldDisabled: false,
      showSubmitButton: true,
      persistence: {
        storageKey: this.getStorageKey(formRef),
        formRef,
        gpsSnapshot
      },
      onAutosave: (savedAt) => this.renderAutosaveStatus(formRef, savedAt),
      onSubmitResult: (submitResult) => this.renderSubmitResult(submitResult),
      onSubmitFinished: async (submitResult) => this.handleSubmitFinished(formRef, submitResult, taskFlowContext)
    });
  }

  buildFormRef(indicator, clv, formName, form = null) {
    return {
      indicator: String(indicator || '').trim(),
      clv: String(clv || '').trim(),
      formName: String(formName || '').trim(),
      descripcion: String(form?.DESCRIPCION || formName || '').replaceAll('*', '').trim(),
      itemNumber: String(form?.ITEM_NUMBER || indicator || '').trim()
    };
  }

  getStorageKey(formRef) {
    const indicator = encodeURIComponent(formRef.indicator || 'sin-indicator');
    const clv = encodeURIComponent(formRef.clv || 'sin-clv');
    return `${FormEvidencia.ACTIVE_FORM_PREFIX}${indicator}_${clv}`;
  }

  registerActiveForm(schema, formRef, gpsSnapshot = null) {
    const storageKey = this.getStorageKey(formRef);
    this.clearOtherActiveForms(storageKey);
    const nowIso = new Date().toISOString();
    const previous = this.getJson(storageKey);
    const safeGpsSnapshot = gpsSnapshot && typeof gpsSnapshot === 'object'
      ? gpsSnapshot
      : (previous?.gpsSnapshot || null);
    const record = {
      formRef,
      schema,
      openedAt: previous?.openedAt || nowIso,
      updatedAt: nowIso,
      answers: previous?.answers && typeof previous.answers === 'object' ? previous.answers : {},
      lastSavedAt: previous?.lastSavedAt || '',
      gpsSnapshot: safeGpsSnapshot
    };

    this.setJson(storageKey, record);
    this.setJson(FormEvidencia.ACTIVE_FORM_POINTER_KEY, {
      storageKey,
      formRef,
      updatedAt: nowIso
    });
  }

  clearOtherActiveForms(currentStorageKey) {
    const keysToRemove = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) {
        continue;
      }

      if (!key.startsWith(FormEvidencia.ACTIVE_FORM_PREFIX)) {
        continue;
      }

      if (key === currentStorageKey || key === FormEvidencia.ACTIVE_FORM_POINTER_KEY) {
        continue;
      }

      keysToRemove.push(key);
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  }

  getJson(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || 'null');
    } catch (error) {
      console.warn('No se pudo leer localStorage', key, error);
      return null;
    }
  }

  setJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  renderAutosaveStatus(formRef, savedAt = '') {
    const label = document.querySelector('#formAutosaveStatus');
    if (!label) {
      return;
    }

    const current = savedAt || this.getJson(this.getStorageKey(formRef))?.lastSavedAt || '';
    if (!current) {
      label.className = 'uk-text-meta uk-text-small uk-margin-small-top uk-margin-small-bottom';
      label.textContent = 'Sin guardado automatico';
      return;
    }

    const time = new Date(current);
    const formatted = Number.isNaN(time.getTime())
      ? current
      : time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    label.className = 'uk-text-success uk-text-small uk-margin-small-top uk-margin-small-bottom';
    label.textContent = `Guardado automatico: ${formatted}`;
  }

  getQueryClv(query = {}) {
    const clv = query?.clv;
    if (clv === null || clv === undefined) {
      return '';
    }

    return String(clv).trim();
  }

  resolveClvFromForm(form) {
    if (form?.CLV === null || form?.CLV === undefined) {
      return '';
    }

    return String(form.CLV).trim();
  }

  escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  cleanDescription(value) {
    return String(value || '').replaceAll('*', '').trim();
  }

  renderSubmitResult(result = {}) {
    const label = document.querySelector('#formSubmitResult');
    if (!label) {
      return;
    }

    if (!result?.ok) {
      const message = String(result?.error || 'No fue posible enviar evidencia.');
      label.className = 'uk-text-danger uk-text-small uk-margin-small-top uk-margin-small-bottom';
      label.textContent = message;
      return;
    }

    label.className = 'uk-text-success uk-text-small uk-margin-small-top uk-margin-small-bottom';
    const idrc = String(result?.idrc || '').trim();
    label.textContent = idrc
      ? `${result.textMessage}. IDRC: ${idrc}.`
      : `${result.textMessage}.`;
  }

  renderGpsOverlay(stateContainer, message, onRetry) {
    stateContainer.innerHTML = `
      <div class="uk-position-relative uk-border-rounded form-gps-overlay-wrap">
        <div class="uk-position-cover uk-flex uk-flex-center uk-flex-middle form-gps-overlay-cover">
          <div class="uk-card uk-card-default uk-card-body uk-width-large uk-border-rounded">
            <h3 class="uk-margin-small-bottom">Permiso de ubicacion requerido</h3>
            <p class="uk-margin-small-top uk-margin-bottom">
              No puedes abrir ni enviar formularios hasta habilitar el permiso de GPS.
            </p>
            <p class="uk-text-meta uk-margin-small-top uk-margin-medium-bottom">${this.escapeHtml(message)}</p>
            <button type="button" id="gpsRetryButton" class="uk-button uk-button-primary uk-border-rounded">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    `;

    const retryButton = stateContainer.querySelector('#gpsRetryButton');
    if (retryButton && typeof onRetry === 'function') {
      retryButton.addEventListener('click', () => onRetry());
    }
  }

  ensureFormEvidenceStyles() {
    if (document.getElementById('form-evidencia-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'form-evidencia-page-styles';
    style.textContent = `
      .form-gps-overlay-wrap {
        min-height: 220px;
      }

      .form-gps-overlay-cover {
        background: rgba(0, 0, 0, 0.65);
        z-index: 10;
      }
    `;
    document.head.appendChild(style);
  }

  setupExitGuard(formRef) {
    const confirmationMessage = 'Se restablecera el formulario y no se guardaran respuestas previas, si esto fue un error de clic en Cancelar,\nsi da clic en Aceptar volvera al listado de formularios. ¿Desea continuar?';
    const guard = {
      active: true,
      previousHash: window.location.hash || '',
      suppressHashChange: false,
      allowNextHashChange: false
    };

    const confirmExitAndClear = () => {
      if (!this.hasCapturedAnswers(formRef)) {
        this.clearActiveFormRecord(formRef);
        return true;
      }

      const accepted = window.confirm(confirmationMessage);
      if (!accepted) {
        return false;
      }
      this.clearActiveFormRecord(formRef);
      return true;
    };

    const onDocumentClickCapture = (event) => {
      if (!guard.active) {
        return;
      }
      if (!this.isEvidenceRouteHash(window.location.hash || '')) {
        this.teardownExitGuard();
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const link = target.closest('a[href^="#"], a[data-route]');
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      const href = String(link.getAttribute('href') || '').trim();
      const dataRoute = String(link.getAttribute('data-route') || '').trim();
      const nextHash = href.startsWith('#')
        ? href
        : (dataRoute.startsWith('/') ? `#${dataRoute}` : '');

      if (!nextHash || nextHash === guard.previousHash) {
        return;
      }

      const accepted = confirmExitAndClear();
      if (!accepted) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      guard.allowNextHashChange = true;
      guard.previousHash = nextHash;
    };

    const onHashChange = () => {
      if (!guard.active) {
        return;
      }
      if (guard.suppressHashChange) {
        return;
      }

      const nextHash = window.location.hash || '';
      if (!this.isEvidenceRouteHash(nextHash)) {
        this.teardownExitGuard();
        return;
      }
      if (nextHash === guard.previousHash) {
        return;
      }

      if (guard.allowNextHashChange) {
        guard.allowNextHashChange = false;
        guard.previousHash = nextHash;
        return;
      }

      const accepted = confirmExitAndClear();
      if (accepted) {
        guard.previousHash = nextHash;
        return;
      }

      guard.suppressHashChange = true;
      window.location.hash = guard.previousHash;
      window.setTimeout(() => {
        guard.suppressHashChange = false;
      }, 0);
    };

    document.addEventListener('click', onDocumentClickCapture, true);
    window.addEventListener('hashchange', onHashChange);
    this._exitGuard = {
      guard,
      onDocumentClickCapture,
      onHashChange
    };
  }

  teardownExitGuard() {
    if (!this._exitGuard) {
      return;
    }

    const { guard, onDocumentClickCapture, onHashChange } = this._exitGuard;
    guard.active = false;
    document.removeEventListener('click', onDocumentClickCapture, true);
    window.removeEventListener('hashchange', onHashChange);
    this._exitGuard = null;
  }

  clearActiveFormRecord(formRef) {
    const storageKey = this.getStorageKey(formRef);
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(FormEvidencia.ACTIVE_FORM_POINTER_KEY);
  }

  isEvidenceRouteHash(hashValue = '') {
    const normalized = String(hashValue || '').trim();
    return /^#\/formularios\/[^/]+/i.test(normalized);
  }

  hasCapturedAnswers(formRef) {
    const storageKey = this.getStorageKey(formRef);
    const record = this.getJson(storageKey);
    const answers = record?.answers;
    if (!answers || typeof answers !== 'object') {
      return false;
    }

    return Object.values(answers).some((value) => {
      if (Array.isArray(value)) {
        return value.some((entry) => String(entry ?? '').trim() !== '');
      }
      if (value && typeof value === 'object') {
        return Object.values(value).some((entry) => String(entry ?? '').trim() !== '');
      }
      return String(value ?? '').trim() !== '';
    });
  }

  async handleSubmitFinished(formRef, submitResult = {}, taskFlowContext = null) {
    this.clearActiveFormRecord(formRef);

    let closeTaskError = '';
    let closeTaskSuccess = false;
    const idrc = String(submitResult?.idrc || '').trim();
    const isOk = Boolean(submitResult?.ok);

    if (isOk && idrc && taskFlowContext?.isTaskFlow) {
      try {
        const locationResult = await geolocationService.ensurePermissionAndCapture();
        if (!locationResult?.ok || !locationResult?.snapshot) {
          throw new Error(locationResult?.error || 'No fue posible obtener la ubicacion actual para cerrar la tarea.');
        }

        const latitude = Number(locationResult.snapshot.latitude);
        const longitude = Number(locationResult.snapshot.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error('No fue posible obtener coordenadas validas para cerrar la tarea.');
        }

        await closeTask({
          taskId: taskFlowContext.taskId,
          taskClvCaptura: taskFlowContext.taskClvCaptura,
          statusId: taskFlowContext.taskStatus,
          idrc,
          latitud: latitude,
          longitud: longitude
        });
        await patchTaskStatusInLocalCatalog({
          taskId: taskFlowContext.taskId,
          statusId: taskFlowContext.taskStatus,
          statusText: 'Tarea terminada'
        });
        const localTasks = await getAssignedTasksFromLocal();
        const matchedTask = Array.isArray(localTasks)
          ? localTasks.find((task) => String(task?.ID_TAREA ?? '') === String(taskFlowContext.taskId))
          : null;
        await taskCompletedService.appendCompletedTasks([
          {
            ...(matchedTask || {}),
            ID_TAREA: taskFlowContext.taskId,
            CLV_CAPTURA: taskFlowContext.taskClvCaptura,
            ID_STATUS: taskFlowContext.taskStatus,
            ESTATUS: 'Tarea terminada',
            ID_RC: idrc
          }
        ]);
        await taskActiveService.registerStatusChange({
          task: { ID_TAREA: taskFlowContext.taskId },
          statusId: taskFlowContext.taskStatus
        });
        await syncAssignedTasks();
        closeTaskSuccess = true;
      } catch (error) {
        closeTaskError = String(error?.message || 'No fue posible cerrar la tarea con la evidencia enviada.');
      }
    }

    if (window.UIkit?.notification) {
      let message = isOk
        ? (idrc ? `Evidencia enviada. IDRC: ${this.escapeHtml(idrc)}` : 'Evidencia enviada.')
        : 'Evidencia no enviada. Se guardo en pendientes.';
      let status = isOk ? 'success' : 'warning';

      if (taskFlowContext?.isTaskFlow && isOk && idrc) {
        if (closeTaskSuccess) {
          message = `Evidencia enviada. IDRC: ${this.escapeHtml(idrc)}. Tarea finalizada.`;
          status = 'success';
        } else if (closeTaskError) {
          message = `Evidencia enviada. IDRC: ${this.escapeHtml(idrc)}. ${this.escapeHtml(closeTaskError)}`;
          status = 'warning';
        }
      }

      window.UIkit.notification({
        message,
        status,
        pos: 'top-center',
        timeout: closeTaskError ? 5000 : 3500
      });
    }

    if (taskFlowContext?.isTaskFlow && taskFlowContext.taskId) {
      if (this._exitGuard?.guard) {
        this._exitGuard.guard.allowNextHashChange = true;
      }
      window.location.hash = '#/tareas';
      return;
    }

    if (this._exitGuard?.guard) {
      this._exitGuard.guard.allowNextHashChange = true;
    }
    window.location.hash = '#/formularios';
  }

  resolveTaskFlowContext(query = {}) {
    const source = String(query?.source || '').trim().toLowerCase();
    const taskId = Number(query?.taskId);
    const taskClvCaptura = Number(query?.taskClvCaptura);
    const taskStatus = Number(query?.taskStatus || 3);
    const isTaskFlow = source === 'task'
      && Number.isFinite(taskId) && taskId > 0
      && Number.isFinite(taskClvCaptura) && taskClvCaptura > 0
      && Number.isFinite(taskStatus) && taskStatus > 0;

    if (!isTaskFlow) {
      return {
        isTaskFlow: false
      };
    }

    return {
      isTaskFlow: true,
      taskId: Math.trunc(taskId),
      taskClvCaptura: Math.trunc(taskClvCaptura),
      taskStatus: Math.trunc(taskStatus)
    };
  }
}
