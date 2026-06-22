import '../../core/bootstrap.js';
import '../../utils/pwa-register.js';
import './login.css';
import LoginPage from './LoginPage.js';

const loginPage = new LoginPage();
loginPage.render(document.querySelector('#app'));
