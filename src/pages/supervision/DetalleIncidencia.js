import { renderInicioLayout } from '../inicio-layout.js';
import { navigate } from '../../core/router.js';

export default class DetalleIncidencia {
  static instancia = null;

  constructor(navigationContext = {}) {
    if (DetalleIncidencia.instancia) {
      DetalleIncidencia.instancia.navigationContext = navigationContext;
      return DetalleIncidencia.instancia;
    }

    this.navigationContext = navigationContext;
    this.handleBackClick = null;
    DetalleIncidencia.instancia = this;
  }

  render(container, params = {}) {
    this.container = container;
    this.params = params;

    const ide = String(params?.ide || '').trim();
    const previousLabel = this.navigationContext?.state?.previousLabel || 'Supervisión';

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="uk-section uk-section-small uk-padding-remove-top">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded">
            <div class="uk-margin-small-bottom">
              <button
                class="uk-button uk-button-default uk-button-small uk-border-rounded"
                type="button"
                data-detail-back="true"
              >
                <span uk-icon="icon: arrow-left; ratio: 0.85"></span>
                Volver a ${this.escapeHtml(previousLabel)}
              </button>
            </div>
            <p class="uk-text-meta uk-margin-remove-bottom">Detalle de incidencia</p>
            <h1 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">
              Incidencia ${this.escapeHtml(ide || 'sin identificador')}
            </h1>
            <div class="uk-alert-primary uk-border-rounded uk-margin-top" uk-alert>
              <p class="uk-margin-remove">
                Esta página se preparó como destino inicial del flujo. Aquí se mostrará el detalle completo de la incidencia en la siguiente fase.
              </p>
            </div>
          </div>
        </section>
      `
    });

    container.querySelector('.inicio-padding-card > h1.uk-card-title')?.remove();
    this.bindEvents();
  }

  bindEvents() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    if (!backButton) {
      return;
    }

    if (this.handleBackClick) {
      backButton.removeEventListener('click', this.handleBackClick);
    }

    this.handleBackClick = () => {
      const fallbackRoute = this.navigationContext?.state?.from || '/supervision';
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      navigate(fallbackRoute, { replace: true });
    };

    backButton.addEventListener('click', this.handleBackClick);
  }

  destroy() {
    const backButton = this.container?.querySelector('[data-detail-back="true"]');
    if (backButton && this.handleBackClick) {
      backButton.removeEventListener('click', this.handleBackClick);
    }
    this.handleBackClick = null;
  }

  escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
