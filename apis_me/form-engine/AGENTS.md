# AGENTS.md - form-engine

## Proposito
Documentar el contrato tecnico de `apis_me/form-engine` para mantener compatibilidad y evolucion por tipo de campo.

## Flujo del modulo
1. `index.php` valida sesion (`ID_USUARIO`) antes de procesar.
2. `index.php` obtiene `idformulario`.
3. Se consulta la data base de `vistaPreviaQST` (info + pregs).
4. `FormNormalizer` transforma preguntas a formato intermedio.
5. `SchemaBuilder` mapea cada campo por `ID_TIPO` usando `FieldDefinitionRegistry`.
6. Se retorna schema JSON.

## Contrato de sesion (obligatorio)

- Requiere sesion PHP activa con `ID_USUARIO`.
- Si no hay sesion valida, responde:
  - HTTP `401`
  - JSON:
    - `success: false`
    - `code: "SESSION_EXPIRED"`
    - `message: "Session expired"`
- El guard reutilizable se concentra en:
  - `apis_me/shared/session_guard.php`

## Contrato de salida
- `form.fields`: campos soportados y mapeados.
- `unsupported`: campos con `ID_TIPO` no registrado.

Ejemplo de `unsupported`:
```json
[
  {
    "type": 99,
    "id": 12345,
    "label": "Campo no soportado",
    "orden": 7
  }
]
```

## Regla para nuevos tipos
Cuando se agrega un tipo nuevo:
1. Crear o ajustar `*FieldDefinition.php`.
2. Registrar el tipo en `FieldDefinitionRegistry`.
3. Verificar `FormNormalizer::parseComplement(...)` para ese tipo.
4. Confirmar que no rompe tipos existentes.

## Tipos de captura multimedia habilitados
- ID_TIPO 9 -> photo
- ID_TIPO 13 -> signature
- ID_TIPO 26 -> gallery

Contrato esperado (frontend):
- Mantener `name`, `label`, `props.required` y `props.disabled` como en cualquier pregunta.
- El comportamiento especial vive en frontend; backend solo expone el `type` y props estables.

## Robustez
- No lanzar excepcion por tipo desconocido en runtime.
- Siempre devolver schema con la llave `unsupported`.
