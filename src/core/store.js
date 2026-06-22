import { storageService } from './services/storage.service.js';

const DEFAULT_AVATAR = 'https://app.movilizandome.net/public/images/userDesc.png';

const state = {
  id: null,
  usuario: null,
  nombre_completo: null,
  foto_perfil: DEFAULT_AVATAR,
};

const listeners = [];

hydrateUserFromSession();

export function setUser(user) {
  if (!user) {
    state.id = null;
    state.usuario = null;
    state.nombre_completo = null;
    state.foto_perfil = DEFAULT_AVATAR;
    storageService.removeSessionItem('user');
    notify();
    return;
  }

  const normalizedUser = normalizeUser(user);

  state.id = normalizedUser.id;
  state.usuario = normalizedUser.usuario;
  state.nombre_completo = normalizedUser.nombre_completo;
  state.foto_perfil = normalizedUser.foto_perfil;

  notify();
}

export function getUserState() {
  return {
    id: state.id,
    usuario: state.usuario,
    nombre_completo: state.nombre_completo,
    foto_perfil: state.foto_perfil,
    isAuthenticated: Boolean(state.id),
  };
}

export function subscribe(fn) {
  listeners.push(fn);
}

function hydrateUserFromSession() {
  const savedUser = storageService.getSessionItem('user');

  if (!savedUser) {
    return;
  }

  const normalizedUser = normalizeUser(savedUser);

  state.id = normalizedUser.id;
  state.usuario = normalizedUser.usuario;
  state.nombre_completo = normalizedUser.nombre_completo;
  state.foto_perfil = normalizedUser.foto_perfil;
}

function notify() {
  const snapshot = getUserState();
  listeners.forEach((fn) => fn(snapshot));
}

function normalizeUser(user) {
  const id = user.id ?? user.ID_USUARIO ?? user.user ?? null;
  const usuario = user.usuario ?? user.username ?? (id ? String(id) : null);
  const nombreCompleto = user.nombre_completo ?? user.nombre ?? usuario ?? 'Usuario';
  const fotoPerfil = user.foto_perfil ?? user.avatar ?? DEFAULT_AVATAR;

  return {
    id,
    usuario,
    nombre_completo: nombreCompleto,
    foto_perfil: fotoPerfil,
  };
}
