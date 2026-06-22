import { api } from './api.js';

export async function validarUsername(username) {
  const formData = new FormData();
  formData.append('vuname', username);
  formData.append('opc', '0');

  return await api('/login/validarUsuario', {
    method: 'POST',
    body: formData
  });
}

export async function login(username, password) {
  const formData = new FormData();
  formData.append('vuname', username);
  formData.append('vpass', password);
  formData.append('md', 'lg');
  
  return await api('/login/login', {
    method: 'POST',
    body: formData
  });
}

export async function logoutApp() {
  return await api('/login/login?md=lo');
}

export async function getUser() {  
  // return await api('index.php?m=login&c=controlador&a=getUser');  
  return await api('/login/controlador/getUser');
}
