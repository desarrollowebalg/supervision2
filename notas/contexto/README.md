# Contexto Operativo

## Proposito

Esta carpeta concentra el contexto operativo vigente para dar continuidad entre sesiones de trabajo humano y asistido por IA.

Su objetivo es reducir perdida de contexto, evitar rehacer analisis ya resueltos y dejar claro cual es el siguiente paso recomendado.

## Archivo fuente de verdad

El archivo activo del proyecto es:

- `notas/contexto/CONTEXTO_ACTIVO.md`

## Regla de uso

- Antes de iniciar una tarea, revisar `CONTEXTO_ACTIVO.md`.
- Si durante la sesion cambian objetivo, alcance, decisiones, pendientes o bloqueos, actualizar `CONTEXTO_ACTIVO.md`.
- Si la sesion deja evidencia relevante o cierra un hito, registrar una nota adicional en `historial/`.

## Que si va aqui

- objetivo operativo vigente
- estado actual resumido
- decisiones activas
- archivos clave para continuar
- pendientes inmediatos
- riesgos o bloqueos
- validacion pendiente

## Que no sustituye

Este contexto no reemplaza:

- `AGENTS.md`
- `notas/BUILD.md`
- documentacion tecnica especifica por modulo
- contratos operativos dentro de `agents/`

## Cuándo actualizar

Actualizar `CONTEXTO_ACTIVO.md` cuando cambie cualquiera de estos puntos:

- objetivo actual
- alcance confirmado
- decision tecnica vigente
- archivos clave involucrados
- pendientes inmediatos
- bloqueo o riesgo activo
- validacion pendiente

## Historial

Las notas historicas deben guardarse en:

- `notas/contexto/historial/AAAA-MM-DD-tema.md`

Se recomienda crear una nota historica cuando:

- se cierre una fase
- se tome una decision tecnica importante
- exista un cambio de direccion
- haga falta dejar una evidencia de handoff

## Relacion con otras notas

- `CONTEXTO_ACTIVO.md` resume el estado vigente.
- `historial/` guarda cortes de sesion o hitos.
- las notas tecnicas de `notas/`, `src/` o `apis_me/` mantienen el detalle especializado.
