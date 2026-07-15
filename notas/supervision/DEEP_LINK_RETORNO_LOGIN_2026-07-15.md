# Deep Link y Retorno Post-Login

Fecha: 2026-07-15

## Objetivo

Habilitar acceso por URL directa a rutas privadas del app, en especial:

- `#/supervision/detalle/:ide/:idi/`

Y además generalizar el comportamiento para cualquier ruta privada, de forma que:

1. Si el usuario ya tiene sesión, la ruta cargue directo.
2. Si no tiene sesión, se muestre login.
3. Después del login, el usuario regrese a la ruta privada originalmente solicitada.
4. Si la sesión expira dentro de la app, al reautenticarse regrese al último módulo privado válido.

## Caso de uso original

URL de ejemplo:

- `http://localhost:8070/app/default#/supervision/detalle/72507676/30429/`

Se revisó si, con el estado actual del proyecto, era posible:

1. Mostrar el detalle si el usuario ya estaba logueado.
2. Pedir login si no había sesión y luego regresar al detalle.

## Hallazgo inicial

El proyecto ya tenía:

- la ruta registrada en `src/pages/inicio/main.js`
- guard global con `getUser()`
- redirección a login cuando no hay sesión

Pero no tenía completo el retorno al destino original tras login.

También se detectó que:

- `src/pages/supervision/DetalleIncidencia.js` sigue siendo una vista placeholder
- el problema de esta sesión se enfocó solo en el deep link y retorno post-login

## Propuesta definida

Se decidió implementar un mecanismo general de retorno post-login para rutas privadas.

En lugar de resolver solo el detalle de supervisión, se cubren también rutas como:

- `#/cuadrantes`
- `#/formularios`
- `#/tareas`
- `#/supervision`
- `#/supervision/detalle/:ide/:idi/`

## Servicio creado

Archivo nuevo:

- `src/core/services/post-login-redirect.service.js`

Responsabilidades:

- normalizar rutas internas
- validar que sean seguras
- guardar destino post-login
- recuperar destino vigente
- consumirlo una sola vez
- construir la ruta actual desde `window.location.hash`
- leer `returnTo` desde la URL del login
- construir URL de login con `returnTo`

Reglas:

- solo rutas internas
- no aceptar `/login`
- expiración: 30 minutos

## Cambios realizados

### 1. Entrada a `/app/default` sin sesión

Archivo:

- `src/pages/inicio/main.js`

Cambios:

- se guarda el hash solicitado antes de mandar al login
- si existe destino, se construye redirección a login con contexto
- se registró la ruta de detalle con y sin slash final

Objetivo:

- soportar enlaces pegados o abiertos desde correo

### 2. Expiración de sesión dentro de la app

Archivo:

- `src/core/services/session-expiration.service.js`

Cambios:

- se captura la ruta hash actual antes de redirigir a login
- si existe, se usa también para construir la URL del login

Objetivo:

- volver al último módulo privado tras reautenticación

### 3. Login exitoso

Archivo:

- `src/pages/login/LoginPage.js`

Cambios:

- al terminar login, se consume el destino guardado
- si existe, se envía a `/app/default#<ruta>`
- si no existe, se conserva el flujo normal a `/app/default`

### 4. Rehidratación del destino al entrar a login

Archivo:

- `src/pages/login/main.js`

Cambios:

- al cargar login se recupera el destino tanto desde:
  - `?returnTo=...`
  - como desde el `hash` del propio login

Esto se hizo porque durante pruebas reales se observó este patrón:

- `http://localhost:8070/login/default#/supervision/detalle/72507676/30429/`

## Problemas detectados durante la implementación

### Problema 1. Navegación bloqueada a otros módulos

Síntoma:

- la app abría `Inicio`
- al dar clic en otras páginas no navegaba
- no había error claro en consola

Causa probable encontrada:

- el guard global en `src/pages/inicio/main.js` validaba la sesión con un criterio demasiado estrecho
- no reconocía todas las formas válidas del payload devuelto por `getUser()`

Corrección:

- se amplió la verificación con `hasSessionUserIdentity(...)`
- ahora revisa identidad en:
  - `sessionCheck`
  - `sessionCheck.user`
  - `sessionCheck.data`

Resultado:

- navegación general reparada

### Problema 2. Deep link llegaba a login pero no regresaba al detalle

Síntoma:

1. navegador limpio
2. pegar URL de detalle
3. la app mandaba a login
4. tras login regresaba a `Inicio`

Detalle observado:

- en pruebas reales la URL de login quedaba como:
  - `/login/default#/supervision/detalle/72507676/30429/`

Corrección:

- login ahora rescata también el destino desde el `hash`

## Validaciones ejecutadas

Se ejecutó:

- `npm run build`

Resultado:

- compilación correcta después de cada ajuste relevante

## Estado actual al cierre de esta nota

Quedó implementado:

- mecanismo general de retorno post-login para rutas privadas
- soporte para rutas con hash al entrar sin sesión
- soporte para expiración de sesión con retorno posterior
- soporte para login con `returnTo` por query o por hash
- ruta de detalle con y sin slash final
- ajuste del guard global para no bloquear navegación legítima

## Pendiente inmediato

Revalidar manualmente este caso:

1. abrir navegador limpio
2. pegar:
   - `http://localhost:8070/app/default#/supervision/detalle/72507676/30429/`
3. verificar redirección a login
4. hacer login
5. confirmar si aterriza en:
   - `#/supervision/detalle/72507676/30429/`

## Pendiente posterior

Una vez confirmado el deep link:

- continuar con la carga real del detalle de incidencia
- dejar de usar el placeholder de `DetalleIncidencia.js`

## Archivos tocados en esta sesión

- `src/core/services/post-login-redirect.service.js`
- `src/pages/inicio/main.js`
- `src/core/services/session-expiration.service.js`
- `src/pages/login/LoginPage.js`
- `src/pages/login/main.js`

