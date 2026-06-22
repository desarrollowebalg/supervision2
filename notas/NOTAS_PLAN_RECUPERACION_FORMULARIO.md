# NOTAS_PLAN_RECUPERACION_FORMULARIO

Fecha: 2026-05-15
Responsable: frontend-agent

## Objetivo
Implementar recuperación de respuestas del formulario activo, autosave local y separación de salida en JSON de texto/fotos, manteniendo submit solo en consola en esta fase.

## Plan de acción aplicado

1. Registrar contexto de formulario activo
- Referencia por `indicator + CLV`.
- Guardar nombre, timestamps, schema y puntero de formulario activo.
- Almacenamiento por clave única en `localStorage` para evitar cruces entre formularios.

2. Persistencia por campo y recuperación al recargar
- Hidratar respuestas guardadas al render del formulario.
- Guardar cambios en eventos `focusout` y `change`.
- Mantener indicador visual bajo el título del formulario: "Guardado automatico: HH:MM:SS".

3. Separar payloads de salida
- Construir `payloadTexto` con respuestas no visuales.
- Construir `payloadFotos` con `photo`, `gallery`, `signature`.
- Al hacer submit: mostrar ambos payloads con `console.log` (sin envío backend).

4. Alinear campos visuales con autosave
- `photo` y `gallery`: restaurar preview desde valor persistido.
- `signature`: restaurar dibujo en canvas desde valor persistido.
- Disparar `change` en actualizaciones visuales para activar guardado inmediato.

## Contratos JSON definidos

### payloadTexto
```json
{
  "formRef": { "indicator": "string", "clv": "string" },
  "savedAt": "ISO-8601",
  "answers": {
    "fieldNameA": "value",
    "fieldNameB": ["v1", "v2"]
  }
}
```

### payloadFotos
```json
{
  "formRef": { "indicator": "string", "clv": "string" },
  "savedAt": "ISO-8601",
  "photos": {
    "fieldPhoto": "data:image/...base64,...",
    "fieldGallery": "data:image/...base64,...",
    "fieldSignature": "data:image/...base64,..."
  }
}
```

## Pendiente para siguiente fase
- Conectar envío real al backend usando ambos payloads por canal separado.
- Definir limpieza de estado local después de submit exitoso.
