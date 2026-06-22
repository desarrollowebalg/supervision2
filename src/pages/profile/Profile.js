import { renderInicioLayout } from '../inicio-layout.js';
import { getUserState } from '../../core/store.js';
import { storageService } from '../../core/services/storage.service.js';

import '../../components/userAvatar.js';

const DEFAULT_AVATAR = 'https://app.movilizandome.net/public/images/userDesc.png';

export default class Profile {
  static instancia = null;

  constructor() {
    if (Profile.instancia) {
      return Profile.instancia;
    }

    Profile.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    const user = getUserState();
    const fullName = user.nombre_completo || user.usuario || 'Usuario';
    const userName = user.usuario || 'Sin nombre de usuario';
    const avatarUrl = storageService.getItem('fotoPerfil')
      || user.foto_perfil
      || DEFAULT_AVATAR;

    renderInicioLayout(container, {
      title: '<span class="uk-display-block uk-text-left">Perfil de usuario</span>',
      description: `<span class="uk-display-block uk-text-left uk-hidden">${this.escapeHtml(fullName)} - @${this.escapeHtml(userName)}</span>`,
      contentHtml: `
        <section class="uk-section uk-section-small">
          <div class="uk-container uk-container-xsmall">
            <div class="uk-card uk-card-default uk-card-body uk-border-rounded uk-text-center">
              <div class="uk-margin-medium-bottom">
                <user-avatar-enhanced
                  url="${this.escapeHtml(avatarUrl)}"
                  fallback-url="${DEFAULT_AVATAR}"
                  nombre="${this.escapeHtml(fullName)}"
                  size="140px"
                  shape="circle">
                </user-avatar-enhanced>
              </div>

              <h2 class="uk-heading-bullet uk-text-center uk-margin-small-bottom">
                <span>${this.escapeHtml(fullName)}</span>
              </h2>

              <p class="uk-text-meta uk-margin-remove-top uk-margin-medium-bottom">
                @${this.escapeHtml(userName)}
              </p>

              <div class="uk-grid-small uk-flex-center uk-hidden" uk-grid>
                <div class="uk-width-1-1">
                  <div class="uk-card uk-card-muted uk-card-body uk-border-rounded">
                    <p class="uk-text-meta uk-margin-small-bottom">Nombre completo</p>
                    <p class="uk-text-lead uk-margin-remove">${this.escapeHtml(fullName)}</p>
                  </div>
                </div>
                <div class="uk-width-1-1">
                  <div class="uk-card uk-card-muted uk-card-body uk-border-rounded">
                    <p class="uk-text-meta uk-margin-small-bottom">Nombre de usuario</p>
                    <p class="uk-text-lead uk-margin-remove">@${this.escapeHtml(userName)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      `
    });
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
