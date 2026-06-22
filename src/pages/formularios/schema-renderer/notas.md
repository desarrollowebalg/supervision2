# Notas - Solicitudes de cambios para form-engine frontend

## Como pedirme nuevos cambios
Para implementar cambios de forma rapida y sin ambiguedad, usa este formato:

1. Objetivo
- Ejemplo: `Agregar soporte frontend para tipo photo`.

2. Ejemplo real del schema
- Comparte el bloque JSON de `form.fields` del nuevo tipo.
- Incluye `type`, `name`, `label` y `props`.

3. Comportamiento esperado
- Como se debe renderizar el campo en UI.
- Reglas de `required`, `disabled`, `default`.
- Si hay validaciones especiales o transformaciones.

4. Casos borde
- Que hacer cuando faltan props opcionales.
- Que hacer cuando options venga vacio o null.

5. Alcance de entrega
- Solo render (captura visual).
- Render + captura de valores.
- Render + captura + submit.

## Plantilla rapida de solicitud
```txt
Agrega soporte frontend para tipo: <type>
Schema ejemplo:
<json del field>
Comportamiento esperado:
- Render:
- Reglas required/disabled/default:
- Validaciones especiales:
Casos borde:
- ...
Alcance:
- ...
```

## Nota operativa
- Si primero se implementa backend y luego frontend, comparte:
  - Tipo final expuesto por `form-engine` (`field.type`).
  - Shape final de `props`.
  - Un ejemplo real del endpoint `form-engine/index.php?idformulario=...`.
