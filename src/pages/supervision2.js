import { renderInicioLayout } from './inicio-layout.js';

export default class Supervision2 {
  static instancia = null;

  constructor() {
    if (Supervision2.instancia) {
      return Supervision2.instancia;
    }

    Supervision2.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    renderInicioLayout(container, {
      title: 'Supervisión 2',
      description: 'Vista inicial de Supervisión 2. Aquí iremos colocando el contenido operativo de esta sección.',
      contentHtml: `
        <section class="uk-section uk-section-small uk-padding-remove-top">
          <div class="uk-card uk-card-default uk-card-body uk-border-rounded">
            <h2 class="uk-card-title uk-margin-small-bottom">Supervisión 2</h2>
            <p class="uk-margin-remove-bottom uk-text-meta">
              Esta página está lista como base y por ahora muestra únicamente el título y una descripción.
            </p>
          </div>
        </section>
      `
    });
  }
}
