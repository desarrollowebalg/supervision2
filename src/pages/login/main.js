import '../../core/bootstrap.js';
import '../../utils/pwa-register.js';
import './login.css';
import LoginPage from './LoginPage.js';
import {
  buildCurrentHashRoute,
  getPostLoginRedirectFromUrl,
  savePostLoginRedirect
} from '../../core/services/post-login-redirect.service.js';

const returnToFromUrl = getPostLoginRedirectFromUrl();
const returnToFromHash = buildCurrentHashRoute();
const returnTo = returnToFromUrl || returnToFromHash;

if (returnTo) {
  savePostLoginRedirect(returnTo, {
    source: returnToFromUrl ? 'login-url' : 'login-hash'
  });
}

const loginPage = new LoginPage();
loginPage.render(document.querySelector('#app'));
