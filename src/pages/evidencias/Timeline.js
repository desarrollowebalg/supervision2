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
    this.ensureTimelinePageStyles();

    renderInicioLayout(container, {
      title: 'Bandeja de salida',
      description: 'Consulta y reintenta el envío de evidencias almacenadas localmente.',
      contentHtml: `
        <section class="timeline-page uk-width-1-1">
          <forms-timeline-component days-window="7" title="Bandeja de salida" subtitle="Registros guardados"></forms-timeline-component>
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

      .timeline-page forms-timeline-component {
        display: block;
      }

      .timeline-page forms-timeline-component > section,
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
