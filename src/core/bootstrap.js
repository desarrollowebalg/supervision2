import './ui.js';
import { getUser } from './services/authService.js';
import { getUserState, setUser } from './store.js';

// cosas globales
console.log('App inicializada');

export async function initApp(){
  const result = await getUser();
  console.log('getUser result:', result);

  const currentUser = getUserState();

  if(result?.success){
    const payload = result.user ?? result.data ?? result;

    if (hasHydratableUserData(payload)) {
      setUser(payload);
      return;
    }

    // Si el backend solo regresa un id, conservamos el estado ya hidratado
    // desde sessionStorage para no perder nombre y foto.
    if (!currentUser.isAuthenticated && payload) {
      setUser({ id: payload });
    }
    return;
  }

  if (!currentUser.isAuthenticated) {
    setUser(null);
  }
}

function hasHydratableUserData(payload) {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    (
      payload.id ||
      payload.ID_USUARIO ||
      payload.usuario ||
      payload.nombre_completo
    )
  );
}
