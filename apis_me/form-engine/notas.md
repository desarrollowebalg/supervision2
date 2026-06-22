# Notas Temporales - form-engine

## Cómo solicitar implementación de un tipo nuevo
Para implementar un nuevo `ID_TIPO` sin ambigüedad, proporcionar siempre:

1. `ID_TIPO`.
2. Ejemplo real de `COMPLEMENTO`.
3. Comportamiento UI esperado:
   - `type` de salida.
   - `props` requeridos.
   - validaciones esperadas.
4. Un ejemplo de salida final esperada en schema.

## Formato recomendado de especificación
- `input (pregunta)` -> `output (schema)`.
- Si el tipo reutiliza otro existente, indicar explícitamente:
  - "tipo X igual a tipo Y, salvo props Z".

## Regla de robustez del parser
- El parser no debe romperse por tipos no soportados.
- Debe regresar:
  - `form.fields` con tipos soportados.
  - `unsupported` con tipos no reconocidos (`type`, `id`, `label`, `orden`).
