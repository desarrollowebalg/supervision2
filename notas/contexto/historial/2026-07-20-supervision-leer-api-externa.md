# Historial de sesion - supervision/leer API externa

## Fecha

2026-07-20

## Responsable

api-action-agent

## Objetivo

Crear el modulo `apis_me/supervision`, agregar la accion `leer` y dejar el endpoint local listo para devolver al frontend el identificador de la incidencia creada por la API externa.

## Cambios realizados

- Se creo el modulo `apis_me/supervision/` con la estructura estandar:
  - `.htaccess`
  - `index.php`
  - `actions.php`
  - `apiSupervision.class.php`
- Se dejo una accion minima `ping` para validar disponibilidad del modulo y respuesta uniforme.
- Se agrego la accion declarativa `leer` en `apis_me/supervision/actions.php`.
- La ruta del endpoint quedo como `/apis_me/supervision/leer/<ide>/<item>/`.
- `ID_USUARIO` se usa como fuente de verdad desde sesion para el campo `USU`.
- El parametro de ruta `item` se envia como `PDI`.
- El parametro de ruta `ide` se envia como `EVD`.
- `apiSupervision.class.php` se extendio para soportar `execution.type = "api"` con `curl`, serializacion JSON y parseo de respuesta externa.
- Ajuste final del contrato: el endpoint local ya no devuelve la envoltura completa del proveedor, sino directamente la llave `body` ya parseada como JSON para consumo simple desde frontend.

## Verificacion remota

- Se probo la API externa `POST https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Supervision/Incidencias`.
- Payload verificado el lunes 20 de julio de 2026:
  - `USU = 36925`
  - `PDI = M2512225537-434`
  - `EVD = 67433043`
- Respuesta del proveedor:

```json
{"statusCode":200,"body":{"ID":2894}}
```

## Respuesta esperada del endpoint local

El endpoint local `/apis_me/supervision/leer/<ide>/<item>/` debe dejar disponible en `data` el JSON de `body`, por ejemplo:

```json
{
  "ID": 2894
}
```

## Validacion pendiente

- No fue posible ejecutar `php -l` en esta sesion porque `php` no esta disponible en el entorno actual.

## Siguiente paso sugerido

- Conectar el frontend consumidor de `supervision/leer` para usar `data.ID` como identificador de incidencia creada.
