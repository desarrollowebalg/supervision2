import { validarUsername, login } from '../../core/services/authService.js';
import { setUser } from '../../core/store.js';
import { storageService } from '../../core/services/storage.service.js';
import { syncAllCatalogs } from '../../core/services/apis-me/catalog-sync.service.js';
import { fetchEntidadEntity, hasValidCodEntity, getEntidadValidationErrorMessage } from '../../core/services/apis-me/entidad.service.js';

const ENTITY_VALIDATION_ERROR_KEY = 'entityValidationError';

export default class LoginPage {
  static instancia = null;

  constructor() {
    if (LoginPage.instancia) {
      return LoginPage.instancia;
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    LoginPage.instancia = this;
  }

  /**
   * Inicializa la página de login
   * @param {HTMLElement} container
   * @returns {Promise<LoginPage>}
   */
  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    container.className = 'uk-flex uk-flex-center uk-flex-middle uk-height-viewport login-page';
    container.innerHTML = `
      <div class="uk-card uk-card-default uk-card-body uk-width-large uk-box-shadow-large fade-in uk-border-rounded">
        <h2 class="uk-card-title uk-text-center">
          <span uk-icon="icon: video-camera; ratio: 2"></span>
          <br>
          SVG Supervisión
        </h2>
        <p class="uk-text-center uk-text-muted">---</p>

        <form id="login-form" class="uk-form-stacked">
          <div class="uk-margin">
            <label class="uk-form-label" for="username">Usuario</label>
            <div class="uk-form-controls">
              <input class="uk-input uk-form-large uk-border-rounded" id="username" type="text" placeholder="Ingrese su usuario" required autofocus>
            </div>
          </div>

          <div class="uk-margin">
            <label class="uk-form-label" for="password">Contraseña</label>
            <div class="uk-form-controls">
              <input class="uk-input uk-form-large uk-border-rounded" id="password" type="password" placeholder="Ingrese su contraseña" required>
            </div>
          </div>

          <div id="login-error" class="uk-alert-danger uk-margin uk-hidden" uk-alert></div>

          <div class="uk-margin">
            <button id="submit-btn" class="uk-button uk-button-primary uk-width-1-1 uk-button-large uk-border-rounded" type="submit">
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    `;

    const form = container.querySelector('#login-form');
    form?.addEventListener('submit', this.handleSubmit);
  }

  async handleSubmit(event) {
    event.preventDefault();

    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    const submitBtn = document.querySelector('#submit-btn');
    const errorDiv = document.querySelector('#login-error');

    const username = (usernameInput?.value || '').trim();
    const password = passwordInput?.value || '';

    const showError = (message) => {
      errorDiv.textContent = message || 'Usuario o contraseña incorrectos';
      errorDiv.classList.remove('uk-hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
      passwordInput.value = '';
      passwordInput.focus();
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span uk-spinner="ratio: 0.6"></span> Iniciando sesión...';
    errorDiv.classList.add('uk-hidden');

    const userValidation = await validarUsername(username);
    console.log('User validation response:', userValidation);
    if (!userValidation || userValidation.result === '0') {
      showError(userValidation?.desc || 'No fue posible validar el usuario');
      return;
    }

    if (userValidation.result === '2') {
      showError(userValidation.desc || 'Cliente inactivo');
      window.location.href = '/cliDesc.php';
      return;
    }

    if (userValidation.MMCP === 1) {
      window.location.href = `/warnPass.php?action=updatePass&c=${btoa(username)}&d=${btoa(userValidation.DVCP)}&i=${btoa(userValidation.ID_USUARIO)}`;
      return;
    }

    if (userValidation.MMCP === 2) {
      window.location.href = `/chgPwd.php?action=chgPwd&c=${btoa(username)}&i=${btoa(userValidation.ID_USUARIO)}`;
      return;
    }

    const auth = await login(username, password);

    if (!auth || auth.result === 0 || auth.result === '0') {
      showError(auth?.desc || 'Credenciales inválidas');
      return;
    }
    
    const userData = {
      id: userValidation.ID_USUARIO || null,
      usuario: userValidation.usuario || username,
      nombre_completo: userValidation.nombre_completo || userValidation.usuario || 'Usuario',
      foto_perfil: userValidation.foto_perfil || 'https://app.movilizandome.net/public/images/userDesc.png'
    };

    setUser(userData);
    storageService.setSessionItem('user', userData);
    storageService.setSessionItem('ci', userValidation.CLI || '');
    storageService.setItem('logoCliente', userValidation.logoCliente || '');
    storageService.setItem('logoEmpresa', userValidation.logoEmpresa || '');
    storageService.setItem('fotoPerfil', userData.foto_perfil);

    try {
      await syncAllCatalogs({ refreshMaxDays: true });
    } catch (syncError) {
      console.error('Post-login catalog sync failed:', syncError);
    }

    try {
      const entidadResponse = await fetchEntidadEntity();
      console.log('Entidad entity response:', entidadResponse);
      if (!hasValidCodEntity(entidadResponse)) {
        storageService.setSessionItem(ENTITY_VALIDATION_ERROR_KEY, getEntidadValidationErrorMessage(entidadResponse));
      } else {
        storageService.removeSessionItem(ENTITY_VALIDATION_ERROR_KEY);
      }
    } catch (entidadError) {
      console.error('Post-login entidad/entity failed:', entidadError);
      storageService.setSessionItem(ENTITY_VALIDATION_ERROR_KEY, 'Error de conexión');
    }

    window.location.href = '/app/default';
  }

  destroy() {
    const form = document.querySelector('#login-form');
    form?.removeEventListener('submit', this.handleSubmit);
  }
}
