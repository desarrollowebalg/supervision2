import { getUserState } from '../core/store.js';
import { storageService } from '../core/services/storage.service.js';
import { fetchEntidadEntity, hasValidCodEntity, getEntidadValidationErrorMessage } from '../core/services/apis-me/entidad.service.js';
import { renderInicioLayout } from './inicio-layout.js';

import '../components/userAvatar.js';
import '../components/forms-timeline-component.js';
import '../components/tasks-summary-widget.js';

const ENTITY_VALIDATION_ERROR_KEY = 'entityValidationError';

export default class Inicio {
  static instancia = null;

  constructor() {
    if (Inicio.instancia) {
      return Inicio.instancia;
    }

    Inicio.instancia = this;
    this.handleEntityValidationRetry = this.handleEntityValidationRetry.bind(this);
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.container = container;
    const user = getUserState();
    const userName = user.nombre_completo || user.usuario || 'Usuario';
    const userPhoto = user.foto_perfil || 'https://app.movilizandome.net/public/images/userDesc.png';
    const entityValidationError = storageService.getSessionItem(ENTITY_VALIDATION_ERROR_KEY);
    const entityValidationAlertHtml = entityValidationError
      ? `
          <div class="uk-alert-danger uk-border-rounded uk-margin-small-bottom" uk-alert>
            <p class="uk-margin-remove">${String(entityValidationError).replace(/\n/g, '<br>')}</p>
            <div class="uk-margin-top">
              <button
                type="button"
                class="uk-button uk-button-danger uk-button-small uk-border-rounded"
                data-entity-validation-retry>
                Reintentar validacion
              </button>
            </div>
          </div>
        `
      : '';

    renderInicioLayout(container, {
      title: 'Bienvenido',
      description: 'Resumen rapido de tu actividad reciente y pendientes.',
      contentHtml: `
        <section class="welcome-home uk-width-1-1">
          <div class="uk-card uk-card-primary uk-card-body welcome-hero welcome-hero-text uk-margin-small-bottom">
            <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
              <div class="uk-width-auto">
                <user-avatar-enhanced
                  url="${userPhoto}"
                  fallback-url="https://app.movilizandome.net/public/images/userDesc.png"
                  nombre="${userName}"
                  size="100px">
                </user-avatar-enhanced>
              </div>
              <div class="uk-width-expand">
                <p class="uk-margin-remove uk-text-meta">Hola de nuevo</p>
                <h2 class="uk-margin-remove">${userName}</h2>
                <p class="uk-margin-small-top uk-margin-remove-bottom">
                  Actividad reciente en los ùltimos días.
                </p>
              </div>
            </div>
          </div>

          ${entityValidationAlertHtml}

          <div class="uk-card uk-card-default uk-card-body uk-margin-small-bottom welcome-quick-card">
            <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
              <h3 class="uk-card-title uk-margin-remove">Accesos rapidos</h3>
              <span class="uk-text-meta uk-hidden">Menu principal</span>
            </div>
            <div class="welcome-quick-access" data-quick-access>
              <a class="welcome-kpi-link" href="#/tareas" data-route="/tareas">
                <span class="welcome-kpi-icon" uk-icon="icon: check; ratio: 1.7"></span>
                <span class="welcome-kpi-text">Tareas</span>
              </a>
              <a class="welcome-kpi-link" href="#/formularios" data-route="/formularios">
                <span class="welcome-kpi-icon" uk-icon="icon: file-text; ratio: 1.7"></span>
                <span class="welcome-kpi-text">Formularios</span>
              </a>
              <a class="welcome-kpi-link" href="#/puntos-interes" data-route="/puntos-interes">
                <span class="welcome-kpi-icon" uk-icon="icon: location; ratio: 1.7"></span>
                <span class="welcome-kpi-text">Puntos de interes</span>
              </a>
            </div>
          </div>

          <a class="timeline-preview-link" href="#/timeline" data-route="/timeline" aria-label="Ver timeline completo">
            <div class="timeline-preview-wrap">
              <forms-timeline-component days-window="7"></forms-timeline-component>
              <div class="timeline-preview-fade"></div>
            </div>
          </a>

          <tasks-summary-widget></tasks-summary-widget>
        </section>
      `
    });

    const retryButton = container.querySelector('[data-entity-validation-retry]');
    retryButton?.addEventListener('click', this.handleEntityValidationRetry);
  }

  async handleEntityValidationRetry(event) {
    const retryButton = event?.currentTarget;
    if (retryButton) {
      retryButton.disabled = true;
      retryButton.innerHTML = '<span uk-spinner="ratio: 0.5"></span> Reintentando...';
    }

    try {
      const entidadResponse = await fetchEntidadEntity();
      console.log('Entidad entity response (retry):', entidadResponse);
      if (!hasValidCodEntity(entidadResponse)) {
        storageService.setSessionItem(ENTITY_VALIDATION_ERROR_KEY, getEntidadValidationErrorMessage(entidadResponse));
      } else {
        storageService.removeSessionItem(ENTITY_VALIDATION_ERROR_KEY);
      }
    } catch (error) {
      console.error('Entidad entity retry failed:', error);
      storageService.setSessionItem(ENTITY_VALIDATION_ERROR_KEY, 'Error de conexión');
    }

    if (this.container) {
      this.render(this.container);
    }
  }
}
