import { renderInicioLayout } from '../inicio-layout.js';

import '../../components/forms-timeline-component.js';

export default class Timeline {
  static instancia = null;

  constructor() {
    if (Timeline.instancia) {
      return Timeline.instancia;
    }

    Timeline.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    renderInicioLayout(container, {
      title: '',
      description: '',
      contentHtml: `
        <section class="uk-width-1-1">
          <forms-timeline-component days-window="7" title="Bandeja de salida" subtitle="Registros guardados"></forms-timeline-component>
        </section>
      `
    });
  }
}
