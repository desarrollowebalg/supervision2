import { renderInicioLayout } from '../inicio-layout.js';

import '../../components/incidences-timeline-component.js';

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
    this.ensureTimelinePageStyles();

    renderInicioLayout(container, {
      title: 'Incidencias semanales',
      description: 'Consulta las incidencias registradas durante la semana actual usando el mismo origen del widget de inicio.',
      contentHtml: `
        <section class="timeline-page uk-width-1-1">
          <incidences-timeline-component
            title="Incidencias de la semana"
            subtitle="Registros del lunes al domingo de la semana actual">
          </incidences-timeline-component>
        </section>
      `
    });
  }

  ensureTimelinePageStyles() {
    if (document.getElementById('timeline-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'timeline-page-styles';
    style.textContent = `
      .timeline-page {
        --timeline-page-surface: var(--app-surface, #ffffff);
        --timeline-page-border: var(--app-border, #e5e7eb);
        --timeline-page-shadow: var(--app-shadow, 0 12px 30px rgba(15, 23, 42, 0.08));
        --timeline-page-text: var(--app-text, #1f2937);
        color: var(--timeline-page-text);
      }

      .timeline-page incidences-timeline-component {
        display: block;
      }

      .timeline-page incidences-timeline-component > section,
      .timeline-page .uk-card {
        border-color: var(--timeline-page-border);
      }

      @media (max-width: 639px) {
        .timeline-page {
          margin-top: 0.75rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
