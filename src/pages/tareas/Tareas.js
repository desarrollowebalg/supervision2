import { renderInicioLayout } from '../inicio-layout.js';
import { getAssignedTasks, getAssignedTasksFromLocal, syncAssignedTasks } from '../../core/services/apis-me/tareas.service.js';
import taskActiveService from '../../core/services/apis-me/task-active.service.js';
import taskCompletedService from '../../core/services/apis-me/task-completed.service.js';
import taskStatusStateService from '../../core/services/apis-me/task-status-state.service.js';
import { geolocationService } from '../../core/services/geolocation.service.js';

export default class Tareas {
  static instancia = null;

  constructor() {
    if (Tareas.instancia) {
      return Tareas.instancia;
    }

    Tareas.instancia = this;
    this.allTasks = [];
    this.searchTerm = '';
    this.taskTransitions = [];
    this.activeTask = null;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.ensureTaskListStyles();

    renderInicioLayout(container, {
      title: `
        <span class="tasks-page-title-row catalog-page-title-row">
          <span class="tasks-page-title-text catalog-page-title-text uk-text-left">Tareas</span>
          <button
            type="button"
            class="uk-button uk-button-primary uk-button-small uk-border-rounded uk-hidden@s tasks-page-title-search-btn catalog-page-title-search-btn"
            data-tasks-mobile-search-toggle
            aria-label="Mostrar buscador"
            aria-expanded="false">
            <span uk-icon="icon: search"></span>
          </button>
        </span>
      `,
      description: '',
      contentHtml: `
        <section class="tasks-page catalog-list-page">
        <div class="uk-margin-small-bottom uk-flex uk-flex-middle uk-grid-small task-toolbar tasks-search-row catalog-search-row catalog-toolbar" uk-grid data-tasks-search-row>
          <div class="uk-width-auto uk-hidden">
            <button id="tasksBackBtn" class="uk-button uk-button-default" type="button" aria-label="Regresar">
              <span uk-icon="arrow-left"></span>
            </button>
          </div>
          <div class="uk-width-expand">
            <input id="tasksSearchInput" class="uk-input uk-border-rounded inputTxtFrm catalog-search-input" type="search" placeholder="Buscar por lugar, tarea o descripcion..." />
          </div>
          <div class="uk-width-auto uk-hidden">
            <button id="tasksRefreshBtn" class="uk-button uk-button-primary" type="button" aria-label="Actualizar remoto">
              <span uk-icon="refresh"></span>
            </button>
          </div>
          <div class="uk-width-auto uk-hidden">
            <button id="tasksRefreshLocalBtn" class="uk-button uk-button-default" type="button" aria-label="Actualizar local">
              <span uk-icon="database"></span>
            </button>
          </div>
        </div>
        <div id="tasksActiveContainer" class="uk-margin-small-bottom"></div>
        <div id="tasksActiveCounterContainer" class="uk-margin-small-bottom"></div>
        <ul class="uk-tab uk-margin-small-bottom tasks-tabs uk-margin-medium-top" uk-tab>
          <li class="uk-active tasks-tab-item tasks-tab-item--today">
            <a href="#">
              Hoy <span id="tasksTabCountToday" class="uk-label uk-label-danger uk-margin-small-left">0</span>
            </a>
          </li>
          <li class="tasks-tab-item tasks-tab-item--pending">
            <a href="#">
              Pendientes <span id="tasksTabCountPending" class="uk-label uk-label-danger uk-margin-small-left">0</span>
            </a>
          </li>
          <li class="tasks-tab-item tasks-tab-item--overdue">
            <a href="#">
              Vencidas <span id="tasksTabCountOverdue" class="uk-label uk-label-danger uk-margin-small-left">0</span>
            </a>
          </li>
        </ul>
        <ul class="uk-switcher uk-margin-remove tasks-tab-content">
          <li><div id="tasksStateContainerToday"></div></li>
          <li><div id="tasksStateContainerPending"></div></li>
          <li><div id="tasksStateContainerOverdue"></div></li>
        </ul>
        </section>
      `
    });

    this.bindMobileSearchToggle(container);
    this.bindToolbarEvents(container);
    this.loadTasks(container);
  }

  bindMobileSearchToggle(container) {
    const toggleButton = container.querySelector('[data-tasks-mobile-search-toggle]');
    const searchRow = container.querySelector('[data-tasks-search-row]');
    if (!toggleButton || !searchRow) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const isOpen = searchRow.classList.toggle('is-mobile-search-open');
      toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  bindToolbarEvents(container) {
    container.querySelector('#tasksBackBtn')?.addEventListener('click', () => {
      window.history.back();
    });

    container.querySelector('#tasksSearchInput')?.addEventListener('input', (event) => {
      this.searchTerm = String(event?.target?.value || '').trim().toLowerCase();
      this.renderFilteredTasks(container);
    });

    container.querySelector('#tasksRefreshBtn')?.addEventListener('click', async () => {
      await this.loadTasks(container, { forceRefresh: true });
    });

    container.querySelector('#tasksRefreshLocalBtn')?.addEventListener('click', async () => {
      await this.loadTasks(container, { localOnly: true });
    });
  }

  async loadTasks(container, options = {}) {
    const stateContainers = this.getStateContainers(container);
    const hasMissingContainer = Object.values(stateContainers).some((stateContainer) => !stateContainer);
    if (hasMissingContainer) {
      return;
    }

    const loadingHtml = `
      <div class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner></div>
      </div>
    `;
    Object.values(stateContainers).forEach((stateContainer) => {
      stateContainer.innerHTML = loadingHtml;
    });

    try {
      let tasks = [];
      if (options.localOnly) {
        tasks = await getAssignedTasksFromLocal();
      } else if (options.forceRefresh) {
        const syncResult = await syncAssignedTasks();
        tasks = Array.isArray(syncResult?.data) ? syncResult.data : [];
      } else {
        tasks = await getAssignedTasks();
      }

      this.allTasks = Array.isArray(tasks) ? tasks : [];
      await taskCompletedService.appendCompletedTasks(this.allTasks);
      this.allTasks = this.allTasks.filter((task) => Number(task?.ID_STATUS) !== 3);
      this.taskTransitions = await taskStatusStateService.getAllTransitions();
      this.activeTask = await taskActiveService.syncFromTasks(this.allTasks);
      await this.syncActiveTaskCoordinates(this.activeTask);
      this.renderFilteredTasks(container);
    } catch (error) {
      const errorHtml = `
        <div class="uk-alert-danger uk-border-rounded tasks-state-alert tasks-state-alert--danger" uk-alert>
          <p>No fue posible cargar las tareas.</p>
        </div>
      `;
      Object.values(stateContainers).forEach((stateContainer) => {
        stateContainer.innerHTML = errorHtml;
      });
    }
  }

  renderFilteredTasks(container) {
    const stateContainers = this.getStateContainers(container);
    const hasMissingContainer = Object.values(stateContainers).some((stateContainer) => !stateContainer);
    if (hasMissingContainer) {
      return;
    }

    const filtered = this.allTasks.filter((task) => {
      if (!this.searchTerm) {
        return true;
      }

      const raw = [
        task?.PDI,
        task?.LUGAR,
        task?.NOMBRE_TAREA,
        task?.DESCRIPCION,
        task?.ITEM_NUMBER_PDI,
        task?.DIRECCION
      ].join(' ').toLowerCase();

      return raw.includes(this.searchTerm);
    });
    const activeTaskId = String(this.activeTask?.ID_TAREA ?? '');
    const tasksWithoutActive = filtered.filter((task) => String(task?.ID_TAREA ?? '') !== activeTaskId);

    const today = this.getTodayDate();
    const categorizedTasks = tasksWithoutActive.reduce((acc, task) => {
      const taskDate = this.parseTaskDate(task?.FECHA_PROGRAMADA);
      if (!taskDate) {
        acc.today.push(task);
        return acc;
      }

      if (taskDate.getTime() === today.getTime()) {
        acc.today.push(task);
      } else if (taskDate.getTime() > today.getTime()) {
        acc.pending.push(task);
      } else {
        acc.overdue.push(task);
      }

      return acc;
    }, {
      today: [],
      pending: [],
      overdue: []
    });

    this.renderActiveTask(container, this.activeTask);
    this.renderActiveCounter(container, this.activeTask);
    this.renderTasks(stateContainers.today, categorizedTasks.today);
    this.renderTasks(stateContainers.pending, categorizedTasks.pending);
    this.renderTasks(stateContainers.overdue, categorizedTasks.overdue);
    this.updateTabCounters(container, categorizedTasks);
  }

  async syncActiveTaskCoordinates(activeTask) {
    if (!activeTask?.ID_TAREA) {
      return;
    }

    const locationResult = await geolocationService.ensurePermissionAndCapture();
    if (!locationResult?.ok || !locationResult?.snapshot) {
      return;
    }

    const latitude = Number(locationResult.snapshot.latitude);
    const longitude = Number(locationResult.snapshot.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const taskWithLocation = {
      ...activeTask,
      LATITUDE: latitude,
      LONGITUDE: longitude
    };

    await taskActiveService.setActiveTask(taskWithLocation);
    this.activeTask = taskWithLocation;
  }

  renderActiveTask(container, activeTask) {
    const activeTaskContainer = container.querySelector('#tasksActiveContainer');
    if (!activeTaskContainer) {
      return;
    }

    if (!activeTask) {
      activeTaskContainer.innerHTML = '';
      return;
    }

    const rowId = this.escapeHtml(String(activeTask?.ID_TAREA ?? ''));
    const title = this.escapeHtml(activeTask?.NOMBRE_TAREA || 'Tarea activa');
    const description = this.escapeHtml(activeTask?.DESCRIPCION || 'Esta tarea sigue en proceso y no ha finalizado.');
    const statusText = this.escapeHtml(activeTask?.ESTATUS || 'Salida a tarea');
    const date = this.escapeHtml(this.formatScheduledDate(activeTask?.FECHA_PROGRAMADA));
    const place = this.escapeHtml(activeTask?.ITEM_NUMBER_PDI || 'N/D');

    activeTaskContainer.innerHTML = `
      <div class="uk-alert-primary task-active-banner uk-border-rounded" uk-alert>
        <p class="uk-margin-small-bottom">
          <span class="uk-text-bold">Tarea activa detectada.</span>
          Esta tarea se inicio en este u otro dispositivo y aun no se finaliza.
        </p>
        <p class="uk-margin-small-bottom uk-text-warning">
          Finaliza la tarea activa para habilitar acciones en las demas tareas.
        </p>
        <a class="uk-display-block uk-padding-small uk-border-rounded task-row task-active-banner__row" href="#/tareas/${rowId}">
          <div class="uk-flex uk-flex-between@s uk-flex-middle@s uk-grid-small uk-margin-small-bottom" uk-grid>
            <div class="uk-width-expand">
              <h3 class="uk-text-default uk-margin-remove task-row__title task-active-banner__title">${title}</h3>
            </div>
            <div class="uk-width-auto@s">
              <span class="uk-label uk-label-warning task-row__status task-active-banner__status">${statusText}</span>
            </div>
          </div>
          <p class="uk-margin-small-bottom">${description}</p>
          <p class="uk-text-meta uk-margin-remove">Programada: ${date}</p>
          <p class="uk-text-meta uk-margin-remove">Lugar: ${place}</p>
        </a>
      </div>
    `;
  }

  renderActiveCounter(container, activeTask) {
    const counterContainer = container.querySelector('#tasksActiveCounterContainer');
    if (!counterContainer) {
      return;
    }

    if (!activeTask) {
      counterContainer.innerHTML = '';
      return;
    }

    counterContainer.innerHTML = `
      <div class="uk-flex uk-flex-middle uk-flex-between task-active-counter uk-padding-small uk-border-rounded">
        <span class="uk-text-bold">Regla de control</span>
        <span class="uk-label uk-label-warning task-active-counter__badge">1 tarea activa</span>
      </div>
    `;
  }

  renderTasks(container, tasks) {
    if (!tasks.length) {
      container.innerHTML = `
        <div class="uk-alert-warning uk-border-rounded tasks-state-alert tasks-state-alert--warning" uk-alert>
          <p>No hay tareas para mostrar.</p>
        </div>
      `;
      return;
    }

    const timelineGroups = tasks.reduce((acc, task, index) => {
      const pdiDescription = String(task?.PDI || task?.ITEM_NUMBER_PDI || 'Sin PDI');
      const dateKey = this.getTaskDateGroupKey(task?.FECHA_PROGRAMADA);
      const groupKey = `${pdiDescription}__${dateKey}`;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          pdiDescription,
          dateKey,
          dateParts: this.formatTimelineDateParts(task?.FECHA_PROGRAMADA),
          items: []
        };
      }

      acc[groupKey].items.push({ ...task, __rowIndex: index });
      return acc;
    }, {});

    const groupsHtml = Object.values(timelineGroups).map((group) => {
      const groupTitle = this.escapeHtml(group.pdiDescription);
      const rows = group.items.map((task, taskIndex) => {
        const rowId = this.escapeHtml(String(task?.ID_TAREA ?? `idx-${task.__rowIndex}`));
        const title = this.escapeHtml(task?.NOMBRE_TAREA || 'Tarea sin titulo');
        const description = this.escapeHtml(task?.DESCRIPCION || 'Sin descripcion');
        const address = this.escapeHtml(task?.DIRECCION || 'Sin direccion');
        const creator = this.escapeHtml(task?.CREADOR || 'N/D');
        const date = this.escapeHtml(this.formatScheduledDate(task?.FECHA_PROGRAMADA));
        const transition = this.getTaskTransition(task?.ID_TAREA);
        const displayStatus = taskStatusStateService.resolveDisplayStatus(task, transition);
        const status = this.escapeHtml(displayStatus.statusText || 'N/D');
        const statusLabelClass = this.getStatusLabelClass(displayStatus.statusText, displayStatus.statusId);
        const rowClass = taskIndex > 0 ? 'task-row task-row--stacked' : 'task-row task-row--stacked task-row--stacked-first';

        return `
          <li class="task-timeline__entry">
            <a class="uk-display-block uk-padding-small uk-border-rounded ${rowClass}" href="#/tareas/${rowId}">
              <div class="uk-flex uk-flex-between@s uk-flex-middle@s uk-grid-small" uk-grid>
                <div class="uk-width-expand">
                  <h3 class="uk-margin-remove uk-text-truncate task-row__title">${title}</h3>
                </div>
                <div class="uk-width-auto@s">
                  <span class="uk-label ${statusLabelClass} task-row__status task-row__status--desktop">${status}</span>
                </div>
              </div>
              <p class="uk-margin-small-bottom uk-text-truncate task-row__description uk-margin-remove-top">${description}</p>
              <p class="uk-text-meta uk-margin-remove task-row__scheduled">Programada: ${date}</p>
              <p class="uk-margin-small-top uk-margin-small-bottom task-row__status-mobile-row">
                <span class="uk-label ${statusLabelClass} task-row__status task-row__status--mobile">${status}</span>
              </p>
              <p class="uk-text-meta uk-margin-small-top task-row__address">Direccion: ${address}</p>
              <p class="uk-text-meta uk-margin-remove task-row__creator">Creada por: <span class="uk-text-bold">${creator}</span></p>
            </a>
          </li>
        `;
      }).join('');

      return `
        <section class="task-timeline__group uk-position-relative">
          <div class="task-timeline__rail" aria-hidden="true">
            <div class="task-timeline__date-card uk-card uk-card-default uk-card-small uk-border-rounded">
              <div class="task-timeline__date-day">${this.escapeHtml(group.dateParts.day)}</div>
              <div class="task-timeline__date-meta">${this.escapeHtml(group.dateParts.monthYear)}</div>
              <div class="task-timeline__date-inline">${this.escapeHtml(group.dateParts.singleLine)}</div>
            </div>
          </div>
          <div class="task-timeline__content">
            <p class="uk-text-meta uk-text-uppercase uk-text-bold uk-margin-small-bottom task-row__group-title">${groupTitle}</p>
            <ul class="uk-list uk-margin-remove">${rows}</ul>
          </div>
        </section>
      `;
    }).join('');

    container.innerHTML = `
      <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom uk-margin-medium-top">
        <span class="uk-text-meta">Total de tareas</span>
        <span class="uk-label task-count-badge">${tasks.length}</span>
      </div>
      <div class="task-timeline uk-margin-remove-top">
        ${groupsHtml}
      </div>
    `;
  }

  getStateContainers(container) {
    return {
      today: container.querySelector('#tasksStateContainerToday'),
      pending: container.querySelector('#tasksStateContainerPending'),
      overdue: container.querySelector('#tasksStateContainerOverdue')
    };
  }

  getTodayDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  updateTabCounters(container, categorizedTasks) {
    const todayCount = Array.isArray(categorizedTasks?.today) ? categorizedTasks.today.length : 0;
    const pendingCount = Array.isArray(categorizedTasks?.pending) ? categorizedTasks.pending.length : 0;
    const overdueCount = Array.isArray(categorizedTasks?.overdue) ? categorizedTasks.overdue.length : 0;

    const todayLabel = container.querySelector('#tasksTabCountToday');
    const pendingLabel = container.querySelector('#tasksTabCountPending');
    const overdueLabel = container.querySelector('#tasksTabCountOverdue');

    if (todayLabel) {
      todayLabel.textContent = String(todayCount);
    }
    if (pendingLabel) {
      pendingLabel.textContent = String(pendingCount);
    }
    if (overdueLabel) {
      overdueLabel.textContent = String(overdueCount);
    }
  }

  parseTaskDate(value) {
    if (!value) {
      return null;
    }

    const rawValue = String(value).trim();

    const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      return new Date(year, month, day);
    }

    const latinMatch = rawValue.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (latinMatch) {
      const day = Number(latinMatch[1]);
      const month = Number(latinMatch[2]) - 1;
      const year = Number(latinMatch[3]);
      return new Date(year, month, day);
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  }

  formatScheduledDate(value) {
    if (!value) {
      return 'N/D';
    }

    const rawValue = String(value).trim();
    const isoDateTimeMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
    if (isoDateTimeMatch) {
      const year = isoDateTimeMatch[1];
      const month = isoDateTimeMatch[2];
      const day = isoDateTimeMatch[3];
      const timePart = isoDateTimeMatch[4] ? ` ${isoDateTimeMatch[4]}` : '';
      return `${day}/${month}/${year.slice(-2)}${timePart}`;
    }

    const latinDateTimeMatch = rawValue.match(/^(\d{2})[/-](\d{2})[/-](\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
    if (latinDateTimeMatch) {
      const day = latinDateTimeMatch[1];
      const month = latinDateTimeMatch[2];
      const year = latinDateTimeMatch[3];
      const timePart = latinDateTimeMatch[4] ? ` ${latinDateTimeMatch[4]}` : '';
      return `${day}/${month}/${year.slice(-2)}${timePart}`;
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawValue;
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = String(parsedDate.getFullYear()).slice(-2);
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    const seconds = String(parsedDate.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  getTaskDateGroupKey(value) {
    const taskDate = this.parseTaskDate(value);
    if (!taskDate) {
      return 'without-date';
    }

    const year = taskDate.getFullYear();
    const month = String(taskDate.getMonth() + 1).padStart(2, '0');
    const day = String(taskDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatTimelineDateParts(value) {
    const taskDate = this.parseTaskDate(value);
    if (!taskDate) {
      return {
        day: '--',
        monthYear: 'SIN FECHA',
        singleLine: 'SIN FECHA'
      };
    }

    const day = String(taskDate.getDate()).padStart(2, '0');
    const month = taskDate.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase();
    const monthShort = taskDate.toLocaleDateString('en-US', { month: 'short' });
    const year = String(taskDate.getFullYear());

    return {
      day,
      monthYear: `${month} ${year}`,
      singleLine: `${Number(day)} ${monthShort} ${year}`
    };
  }

  getStatusLabelClass(status, statusId = null) {
    const normalizedStatusId = Number(statusId);
    if (normalizedStatusId === 12) {
      return 'uk-label-success';
    }

    if ([4, 13, 16, 17, 18].includes(normalizedStatusId)) {
      return 'uk-label-warning';
    }

    const normalizedStatus = String(status ?? '').trim().toLowerCase();
    if (normalizedStatus.includes('complet') || normalizedStatus.includes('terminad') || normalizedStatus.includes('cerrad')) {
      return 'uk-label-success';
    }
    if (normalizedStatus.includes('proceso') || normalizedStatus.includes('curso') || normalizedStatus.includes('operacion') || normalizedStatus.includes('salida')) {
      return 'uk-label-warning';
    }

    return '';
  }

  getTaskTransition(taskId) {
    const normalizedTaskId = String(taskId ?? '');
    if (!normalizedTaskId) {
      return null;
    }

    return this.taskTransitions.find((item) => String(item?.taskId) === normalizedTaskId) || null;
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

  ensureTaskListStyles() {
    if (document.getElementById('tasks-list-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tasks-list-page-styles';
    style.textContent = `
      .tasks-page {
        --tasks-accent: var(--app-primary, #1e87f0);
        --tasks-accent-soft: var(--app-primary-soft, rgba(30, 135, 240, 0.14));
        --tasks-surface: var(--app-surface, #ffffff);
        --tasks-surface-muted: var(--app-surface-muted, #f3f4f6);
        --tasks-surface-elevated: var(--app-surface-elevated, #ffffff);
        --tasks-border: var(--app-border, #e5e7eb);
        --tasks-border-strong: var(--app-border-strong, #cbd5e1);
        --tasks-text: var(--app-text, #1f2937);
        --tasks-text-muted: var(--app-text-muted, #6b7280);
        --tasks-shadow: var(--app-shadow, 0 12px 30px rgba(15, 23, 42, 0.08));
        --tasks-warning-bg: color-mix(in srgb, var(--tasks-surface) 84%, #f59e0b 16%);
        --tasks-warning-text: color-mix(in srgb, var(--tasks-text) 72%, #b45309 28%);
        --tasks-warning-border: color-mix(in srgb, var(--tasks-border) 58%, #f59e0b 42%);
        --tasks-danger-bg: color-mix(in srgb, var(--tasks-surface) 84%, #ef4444 16%);
        --tasks-danger-text: color-mix(in srgb, var(--tasks-text) 72%, #b91c1c 28%);
        --tasks-danger-border: color-mix(in srgb, var(--tasks-border) 58%, #ef4444 42%);
      }

      html[data-theme='dark'] .tasks-page {
        --tasks-warning-bg: color-mix(in srgb, var(--tasks-surface-muted) 82%, #f59e0b 18%);
        --tasks-warning-text: #fcd34d;
        --tasks-warning-border: color-mix(in srgb, var(--tasks-border-strong) 60%, #f59e0b 40%);
        --tasks-danger-bg: color-mix(in srgb, var(--tasks-surface-muted) 82%, #ef4444 18%);
        --tasks-danger-text: #fca5a5;
        --tasks-danger-border: color-mix(in srgb, var(--tasks-border-strong) 60%, #ef4444 40%);
      }

      .task-group__border{
        border-bottom: 2px solid color-mix(in srgb, var(--tasks-border) 78%, var(--tasks-accent) 22%);
      }

      .task-timeline {
        display: grid;
        gap: 1rem;
      }

      .task-timeline__group {
        display: grid;
        grid-template-columns: 88px minmax(0, 1fr);
        column-gap: 1.25rem;
        align-items: start;
      }

      .task-timeline__rail {
        position: relative;
        min-height: 100%;
        display: flex;
        justify-content: center;
      }

      .task-timeline__rail::after {
        content: '';
        position: absolute;
        top: 5.75rem;
        bottom: -1.25rem;
        left: 50%;
        width: 2px;
        background: color-mix(in srgb, var(--tasks-border) 58%, var(--tasks-accent) 42%);
        transform: translateX(-50%);
      }

      .task-timeline__group:last-child .task-timeline__rail::after {
        display: none;
      }

      .task-timeline__date-card {
        width: 88px;
        padding: 0.75rem 0.5rem;
        text-align: center;
        border: 1px solid color-mix(in srgb, var(--tasks-border) 50%, var(--tasks-accent) 50%);
        background: var(--tasks-surface);
        box-shadow: none;
      }

      .task-timeline__date-day {
        font-size: 1.75rem;
        line-height: 1;
        font-weight: 700;
        color: var(--tasks-accent);
      }

      .task-timeline__date-meta {
        margin-top: 0.35rem;
        font-size: 0.72rem;
        line-height: 1.2;
        letter-spacing: 0.08em;
        color: var(--tasks-text-muted);
      }

      .task-timeline__date-inline {
        display: none;
      }

      .task-timeline__content {
        min-width: 0;
      }

      .task-timeline__content > .task-row__group-title {
        margin-left: 2rem;
        letter-spacing: 0.06em;
        color: var(--tasks-text-muted);
      }

      .task-timeline__entry {
        position: relative;
      }

      .task-row {
        position: relative;
        border: 1px solid color-mix(in srgb, var(--tasks-border) 72%, var(--tasks-accent) 28%);
        background: var(--tasks-surface);
        text-decoration: none;
        color: inherit;
        transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
      }

      .task-row--stacked::before {
        content: '';
        position: absolute;
        left: -1.3rem;
        top: 1.45rem;
        width: 1rem;
        height: 2px;
        background: color-mix(in srgb, var(--tasks-border) 58%, var(--tasks-accent) 42%);
      }

      .task-row:hover {
        transform: translateY(-1px);
        box-shadow: var(--tasks-shadow);
        background: color-mix(in srgb, var(--tasks-surface) 84%, var(--tasks-accent) 16%);
        text-decoration: none;
      }

      .task-group__toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .task-group__toggle::before {
        margin-top: 0.1rem;
      }

      .task-group__list {
        margin-left: 0.75rem;
      }

      .task-row__creator {
        text-align: right;
        color: var(--tasks-text-muted);
      }

      .task-row__title {
        color: var(--tasks-text);
      }

      .task-row:hover .task-row__title,
      .task-row:focus-within .task-row__title {
        color: var(--tasks-text);
      }

      .task-row__status {
        margin-right: 0;
        display: inline-flex;
        align-items: center;
        width: auto;
        max-width: fit-content;
      }

      .task-row__status-mobile-row,
      .task-row__status--mobile {
        display: none;
      }

      .task-row--stacked-first {
        margin-top: 0.25rem;
      }

      .tasks-tabs > .uk-active > a {
        background: var(--tasks-surface-muted);
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        color: var(--tasks-text);
      }

      .task-active-banner {
        border: 1px solid color-mix(in srgb, var(--tasks-border) 55%, var(--tasks-accent) 45%);
        background: color-mix(in srgb, var(--tasks-surface) 82%, var(--tasks-accent) 18%);
      }

      .task-active-banner__row {
        border: 1px solid var(--tasks-warning-border);
        background: var(--tasks-surface);
      }

      .task-active-counter {
        border: 1px dashed var(--tasks-warning-border);
        background: var(--tasks-warning-bg);
        color: var(--tasks-warning-text);
      }

      .task-active-banner__status {
        margin-right: 0;
        margin-bottom: 0.5rem;
        align-self: flex-start;
      }

      .task-active-banner__title {
        width: 100%;
      }

      .task-count-badge {
        background: var(--tasks-accent-soft);
        color: var(--tasks-accent);
        border-radius: 999px;
      }

      .task-active-counter__badge {
        border-radius: 999px;
      }

      .tasks-state-alert {
        border: 1px solid var(--tasks-warning-border);
      }

      .tasks-state-alert--warning {
        background: var(--tasks-warning-bg);
        color: var(--tasks-warning-text);
        border-color: var(--tasks-warning-border);
      }

      .tasks-state-alert--danger {
        background: var(--tasks-danger-bg);
        color: var(--tasks-danger-text);
        border-color: var(--tasks-danger-border);
      }

      .tasks-state-alert p {
        color: inherit;
      }

      .tasks-tab-item--today > a {
        padding-left: 0;
        text-transform: none;
        color: var(--tasks-text-muted);
      }

      .tasks-tab-item--pending > a,
      .tasks-tab-item--overdue > a {
        padding-left: 0;
        text-transform: none;
        color: var(--tasks-text-muted);
      }

      .tasks-page-title-row {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      @media (max-width: 639px) {
        .task-timeline__group {
          grid-template-columns: 1fr;
          row-gap: 0.35rem;
        }

        .task-timeline__rail {
          justify-content: flex-start;
          min-height: auto;
          padding-left: 0;
          margin-bottom: 0.15rem;
        }

        .task-timeline__rail::after {
          display: block;
          top: 50%;
          bottom: auto;
          left: 3.85rem;
          right: 0;
          width: auto;
          height: 2px;
          transform: translateY(-50%);
        }

        .task-timeline__date-card {
          width: auto;
          min-width: 6.7rem;
          max-width: 7.4rem;
          padding: 0.4rem 0.45rem;
          position: relative;
          z-index: 1;
          background: var(--tasks-surface);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .task-timeline__content > .task-row__group-title {
          margin-left: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .task-timeline__date-day,
        .task-timeline__date-meta {
          display: none;
        }

        .task-timeline__date-inline {
          display: block;
          font-size: 0.82rem;
          line-height: 1.1;
          letter-spacing: 0.04em;
          font-weight: 700;
          color: var(--tasks-accent);
          white-space: nowrap;
          text-transform: uppercase;
        }

        .task-timeline__content {
          padding-left: 0.85rem;
        }

        .task-timeline__content > .uk-list > li {
          margin-top: 0;
          padding-top: 0.3rem;
          padding-bottom: 0.3rem;
        }

        .task-row {
          padding: 0.6rem 0.75rem;
        }

        .task-row--stacked::before {
          display: none;
        }

        .task-row__title {
          line-height: 1.15;
          color: var(--tasks-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1.05rem;
        }

        .task-row__description {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-row .uk-margin-small-bottom {
          margin-bottom: 0.2rem;
        }

        .task-row__scheduled,
        .task-row__status--desktop {
          display: none;
        }

        .task-row__status-mobile-row,
        .task-row__status--mobile {
          display: block;
        }

        .task-row__status-mobile-row {
          margin-top: 0.1rem;
          margin-bottom: 0.2rem;
        }

        .task-row__status--mobile {
          display: inline-flex;
        }

        .task-row__address,
        .task-row__creator {
          display: none;
        }

        .task-row__creator {
          text-align: left;
        }

        .tasks-page-title-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          column-gap: 0.75rem;
          width: 100%;
        }

        .tasks-page-title-text {
          text-align: left;
        }

        .tasks-page-title-search-btn {
          justify-self: end;
        }

        .tasks-search-row {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-8px);
          margin-top: 0;
          margin-bottom: 0;
          transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease, margin 0.22s ease;
        }

        .tasks-search-row.is-mobile-search-open {
          max-height: 120px;
          opacity: 1;
          transform: translateY(0);
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
      }

      @media (min-width: 640px) {
        .tasks-search-row {
          max-height: none;
          opacity: 1;
          overflow: visible;
          transform: none;
        }

        .task-timeline__content > .uk-list > li {
          margin-top: 0;
          padding-top: 0.45rem;
          padding-bottom: 0.45rem;
        }

        .task-row {
          padding: 0.85rem 1rem;
        }

        .task-row__title {
          line-height: 1.2;
        }

        .task-row p {
          margin-top: 0.35rem;
          margin-bottom: 0.35rem;
        }

        .task-row .uk-margin-small-bottom {
          margin-bottom: 0.4rem;
        }

        .task-row .uk-margin-small-top {
          margin-top: 0.35rem;
        }

        .task-row__creator {
          text-align: right;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
