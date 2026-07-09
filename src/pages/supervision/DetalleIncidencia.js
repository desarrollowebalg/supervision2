import { renderInicioLayout } from '../inicio-layout.js';

export default class DetalleIncidencia {
  static instancia = null;

  constructor(navigationContext = {}) {
    if (DetalleIncidencia.instancia) {
      DetalleIncidencia.instancia.navigationContext = navigationContext;
      return DetalleIncidencia.instancia;
    }

    this.navigationContext = navigationContext;
    DetalleIncidencia.instancia = this;
  }

  render(container, params = {}) {
    this.container = container;
    this.params = params;

    const ide = String(params?.ide || '').trim();

    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="uk-section uk-section-small uk-padding-remove-top">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded">
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
  }

  escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
