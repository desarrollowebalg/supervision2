# Historial de sesion: seguimiento de detalle de incidencia

## Fecha

2026-07-17

## Alcance trabajado

- Ajuste del endpoint `apis_me/reports/evidence/<ide>/` para usar `ID_CLIENTE` desde `session_context` en la cabecera.
- Extension del motor `apis_me/reports/apiReports.class.php` para soportar `header_bindings` y `detail_bindings`.
- Actualizacion de `apis_me/reports/actions.php` para exponer `ITEM_NUMBER` y `DESCRIPCION` en `detail` usando la tabla dinamica del cliente.
- Construccion del panel de seguimiento en `src/pages/supervision/DetalleIncidencia.js` con layout 60/40.
- Integracion del servicio `src/core/services/apis-me/reports.service.js` para centralizar el consumo frontend de `reports/evidence`.
- Implementacion de soporte `light/dark` con tokens `--app-*` manteniendo base UIkit.
- Integracion de la fotografia `FT1` como imagen clicable usando `uk-lightbox`, `uk-inline` y `data-caption`.

## Resultado

- La columna izquierda de `DetalleIncidencia` ya consume evidencia real y muestra:
  - fecha y hora desde `FECHA_RECEPCION`,
  - tarjeta del usuario con `user-avatar-enhanced`,
  - ubicacion/equipo,
  - descripcion multilinea a partir de `OBS`,
  - fotografia `FT1` renderizada desde `https://imagenes.movilizandome.net/`.
- La base visual quedo alineada con UIkit y preparada para `light/dark`.

## Validaciones ejecutadas

- `php -l apis_me/reports/actions.php`
- `php -l apis_me/reports/apiReports.class.php`
- `npm run build`

## Pendiente siguiente

- Completar la columna derecha de atencion de la incidencia.
- Si se requiere mas de una fotografia, extender el render actual para soportar galeria multiple conservando el lightbox de UIkit.
