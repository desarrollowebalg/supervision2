import { getAssignedTasks } from '../core/services/apis-me/tareas.service.js';

class TasksSummaryWidget extends HTMLElement {
  connectedCallback() {
    this.ensureStyles();
    this.renderLoading();
    this.loadSummary();
  }

  ensureStyles() {
    if (document.getElementById('tasks-summary-widget-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tasks-summary-widget-styles';
    style.textContent = `
      tasks-summary-widget {
        display: block;
      }

      .tasks-summary-shell {
        background: linear-gradient(
          180deg,
          var(--app-surface, #ffffff) 0%,
          var(--app-surface-elevated, #f8fafc) 100%
        );
        border: 1px solid var(--app-border, rgba(148, 163, 184, 0.26));
        border-radius: 1rem;
        color: var(--app-text, #1f2937);
      }

      .tasks-summary-row {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.7rem 0.8rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--app-surface-muted, #f1f5f9) 78%, transparent);
        border: 1px solid color-mix(in srgb, var(--app-border, #e5e7eb) 72%, transparent);
        color: var(--app-text, #1f2937);
      }

      .tasks-summary-row + .tasks-summary-row {
        margin-top: 0.6rem;
      }

      .tasks-summary-row p,
      .tasks-summary-row li {
        color: var(--app-text, #1f2937);
      }

      .tasks-summary-row [uk-icon] {
        margin-top: 0.1rem;
        color: var(--app-primary, #2563eb);
      }

      .tasks-summary-list {
        margin: 0.45rem 0 0 1.1rem;
        color: var(--app-text-muted, #6b7280);
      }

      .tasks-summary-list li + li {
        margin-top: 0.2rem;
      }

      .tasks-summary-note-link {
        display: inline-block;
        margin-top: 0.5rem;
        font-style: italic;
        color: var(--app-text-muted, #64748b);
        text-decoration: none;
      }

      .tasks-summary-note-link:hover {
        color: var(--app-primary, #334155);
        text-decoration: underline;
      }

      html[data-theme='dark'] .tasks-summary-shell {
        background: linear-gradient(
          180deg,
          var(--app-surface-elevated, #172033) 0%,
          var(--app-surface, #111827) 100%
        );
      }

      html[data-theme='dark'] .tasks-summary-row {
        background: color-mix(in srgb, var(--app-surface-muted, #1f2937) 86%, transparent);
      }
    `;

    document.head.appendChild(style);
  }

  renderLoading() {
    this.innerHTML = `
      <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-margin-small-top welcome-task-widget tasks-summary-shell">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <h3 class="uk-card-title uk-margin-remove">Tareas</h3>
        </div>
        <div class="uk-flex uk-flex-center uk-padding-small">
          <div uk-spinner></div>
        </div>
      </div>
    `;
  }

  async loadSummary() {
    try {
      const tasks = await getAssignedTasks();
      const normalizedTasks = Array.isArray(tasks) ? tasks : [];
      this.renderSummary(normalizedTasks);
    } catch (error) {
      this.innerHTML = `
        <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-margin-small-top welcome-task-widget tasks-summary-shell">
          <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
            <h3 class="uk-card-title uk-margin-remove">Tareas</h3>
          </div>
          <div class="uk-alert-warning" uk-alert>
            <p>No fue posible cargar el resumen de tareas.</p>
          </div>
        </div>
      `;
    }
  }

  renderSummary(tasks) {
    const todayDate = this.startOfDay(new Date());
    const todayTasks = [];
    const overdueTasks = [];
    const pendingTasks = [];

    for (const task of tasks) {
      const taskDate = this.parseTaskDate(task?.FECHA_PROGRAMADA);
      if (!taskDate) {
        continue;
      }

      const taskDay = this.startOfDay(taskDate);
      if (taskDay.getTime() === todayDate.getTime()) {
        todayTasks.push(task);
      } else if (taskDay.getTime() < todayDate.getTime()) {
        overdueTasks.push(task);
      } else {
        pendingTasks.push(task);
      }
    }

    const todayPlaces = this.extractTodayPlaces(todayTasks).slice(0, 3);
    const todayPlacesHtml = todayPlaces.length
      ? `
        <ul class="tasks-summary-list">
          ${todayPlaces.map((place) => `<li>${this.escapeHtml(place)}</li>`).join('')}
        </ul>
      `
      : '';

    const todayMessage = todayTasks.length > 0
      ? `Tienes <span class="uk-label">${todayTasks.length}</span> tareas para hoy en:`
      : 'Hoy vas al día. No tienes tareas programadas para hoy.';

    this.innerHTML = `
      <div class="uk-card uk-card-default uk-card-body uk-margin-small-top welcome-task-widget tasks-summary-shell">
        <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
          <h3 class="uk-card-title uk-margin-remove">Tareas</h3>
        </div>

        <div class="tasks-summary-row">
          <span uk-icon="icon: calendar"></span>
          <div class="uk-width-expand">
            <p class="uk-margin-remove">${todayMessage}</p>
            ${todayPlacesHtml}
            <a class="tasks-summary-note-link" href="#/tareas" data-route="/tareas">Ir a tareas</a>
          </div>
        </div>

        <div class="tasks-summary-row">
          <span uk-icon="icon: warning"></span>
          <div class="uk-width-expand">
            <p class="uk-margin-remove">Hay <span class="uk-label">${overdueTasks.length}</span> tareas vencidas en tu listado; revisa su estatus.</p>
          </div>
        </div>

        <div class="tasks-summary-row">
          <span uk-icon="icon: clock"></span>
          <div class="uk-width-expand">
            <p class="uk-margin-remove">Tienes <span class="uk-label">${pendingTasks.length}</span> tareas pendientes para los próximos días.</p>
          </div>
        </div>
      </div>
    `;
  }

  extractTodayPlaces(tasks) {
    const places = [];
    const seen = new Set();

    for (const task of tasks) {
      const place = String(
        task?.DIRECCION ||
        task?.LUGAR ||
        task?.NOMBRE_LUGAR ||
        task?.ITEM_NUMBER_PDI ||
        'Sin lugar registrado'
      ).trim();

      if (!seen.has(place)) {
        seen.add(place);
        places.push(place);
      }
    }

    return places;
  }

  parseTaskDate(rawDate) {
    if (!rawDate) {
      return null;
    }

    const value = String(rawDate).trim();
    if (!value) {
      return null;
    }

    const isoLike = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoLike) {
      const [, year, month, day] = isoLike;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const slashLike = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slashLike) {
      const [, day, month, year] = slashLike;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  escapeHtml(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}

customElements.define('tasks-summary-widget', TasksSummaryWidget);
