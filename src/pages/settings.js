import { renderInicioLayout } from './inicio-layout.js';
import { themeService } from '../core/services/theme.service.js';

export default class Settings {
  static instancia = null;

  constructor() {
    if (Settings.instancia) {
      return Settings.instancia;
    }

    this.handleThemeCardClick = this.handleThemeCardClick.bind(this);
    this.handleThemeChanged = this.handleThemeChanged.bind(this);
    Settings.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.container = container;
    const preference = themeService.getPreference();
    const effectiveTheme = themeService.getEffectiveTheme();
    const systemTheme = themeService.getSystemTheme();

    renderInicioLayout(container, {
      title: 'Configuración',
      description: `El tema inicial sigue la preferencia del sistema. Tema actual: ${effectiveTheme === 'dark' ? 'oscuro' : 'claro'}.`,
      contentHtml: `
        <section class="uk-section uk-section-small">
          <div class="uk-container uk-container-small">
            <div class="uk-grid-medium" uk-grid>
              <div class="uk-width-1-1">
                <div class="uk-card uk-card-default uk-card-body uk-border-rounded">
                  <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
                    <div>
                      <h2 class="uk-card-title uk-margin-remove">Tema de la aplicación</h2>
                      <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
                        Si no eliges un modo manual, la aplicación seguirá el sistema operativo.
                      </p>
                    </div>
                    <span class="uk-label">${systemTheme === 'dark' ? 'Sistema oscuro' : 'Sistema claro'}</span>
                  </div>

                  <div class="uk-child-width-1-1 uk-child-width-1-3@m uk-grid-small uk-margin-top" uk-grid>
                    ${this.renderThemeCard({
                      value: 'system',
                      title: 'Seguir sistema',
                      description: `Usa automáticamente el modo ${systemTheme === 'dark' ? 'oscuro' : 'claro'} de tu equipo.`,
                      icon: 'desktop',
                      active: preference === 'system'
                    })}
                    ${this.renderThemeCard({
                      value: 'light',
                      title: 'Tema claro',
                      description: 'Interfaz clara con contraste suave para uso general.',
                      icon: 'sun',
                      active: preference === 'light'
                    })}
                    ${this.renderThemeCard({
                      value: 'dark',
                      title: 'Tema oscuro',
                      description: 'Interfaz oscura para ambientes con poca luz.',
                      icon: 'moon',
                      active: preference === 'dark'
                    })}
                  </div>
                </div>
              </div>

              <div class="uk-width-1-1">
                <div class="uk-card uk-card-default uk-card-body uk-border-rounded">
                  <h3 class="uk-card-title uk-margin-small-bottom">Estado actual</h3>
                  <dl class="uk-description-list">
                    <dt>Preferencia guardada</dt>
                    <dd>${this.formatPreference(preference)}</dd>
                    <dt>Tema aplicado</dt>
                    <dd>${effectiveTheme === 'dark' ? 'Oscuro' : 'Claro'}</dd>
                    <dt>Preferencia del sistema</dt>
                    <dd>${systemTheme === 'dark' ? 'Oscuro' : 'Claro'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>
      `
    });

    this.bindEvents();
  }

  renderThemeCard({ value, title, description, icon, active }) {
    const cardClass = active ? 'uk-card-primary' : 'uk-card-default';
    const buttonClass = active ? 'uk-button-primary' : 'uk-button-default';

    return `
      <div>
        <article class="uk-card ${cardClass} uk-card-body uk-border-rounded uk-height-1-1">
          <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
            <span uk-icon="icon: ${icon}; ratio: 1.4"></span>
            ${active ? '<span class="uk-label">Activo</span>' : ''}
          </div>
          <h3 class="uk-h4 uk-margin-small-bottom">${title}</h3>
          <p class="uk-text-meta uk-margin-medium-bottom">${description}</p>
          <button
            type="button"
            class="uk-button ${buttonClass} uk-width-1-1"
            data-theme-preference="${value}">
            ${active ? 'Seleccionado' : 'Usar este tema'}
          </button>
        </article>
      </div>
    `;
  }

  bindEvents() {
    this.container?.querySelectorAll('[data-theme-preference]').forEach((button) => {
      button.addEventListener('click', this.handleThemeCardClick);
    });

    window.addEventListener('app-theme-changed', this.handleThemeChanged);
  }

  handleThemeCardClick(event) {
    const selectedPreference = event.currentTarget?.getAttribute('data-theme-preference') || 'system';
    themeService.setPreference(selectedPreference);

    if (window.UIkit?.notification) {
      window.UIkit.notification({
        message: `Tema ${this.formatPreference(selectedPreference).toLowerCase()} guardado.`,
        status: 'success',
        pos: 'top-center',
        timeout: 2200
      });
    }
  }

  handleThemeChanged() {
    if (this.container) {
      this.render(this.container);
    }
  }

  formatPreference(preference) {
    if (preference === 'dark') {
      return 'Oscuro';
    }

    if (preference === 'light') {
      return 'Claro';
    }

    return 'Seguir sistema';
  }

  destroy() {
    window.removeEventListener('app-theme-changed', this.handleThemeChanged);
    this.container?.querySelectorAll('[data-theme-preference]').forEach((button) => {
      button.removeEventListener('click', this.handleThemeCardClick);
    });
  }
}
