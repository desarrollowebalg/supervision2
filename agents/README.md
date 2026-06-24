# Agents Registry

## Purpose

This directory contains the operational profiles used to work on this repository.

These agent files are not executable services or background workers. They are task contracts for human and AI-assisted work. An agent "functions" when its scope, trigger, inputs, validation, and handoff rules are clear and aligned with the current repository.

## Source of truth

- Root policy: [`/AGENTS.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/AGENTS.md)
- Frontend-specific support rules: [`/src/AGENTS.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/src/AGENTS.md)
- Build and validation baseline: [`/notas/BUILD.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/notas/BUILD.md)

## Active agents

- `frontend-agent`
  - Scope: implementation in `src/`
  - File: [`/agents/frontend-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/frontend-agent.md)
- `backend-agent`
  - Scope: PHP, routes, controllers, backend integration
  - File: [`/agents/backend-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/backend-agent.md)
- `documentation-agent`
  - Scope: project documentation and operational guides
  - File: [`/agents/documentation-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/documentation-agent.md)
- `frontend-structure-agent`
  - Scope: frontend architecture and folder organization
  - File: [`/agents/frontend-structure-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/frontend-structure-agent.md)
- `api-action-agent`
  - Scope: modular actions inside `apis_me/<modulo>/`
  - File: [`/agents/api-action-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/api-action-agent.md)

## Support agent

- `security-review-agent`
  - Scope: security diagnosis and hardening backlog
  - File: [`/agents/security-review-agent.md`](/Users/consultormovil/Documents/desarrolloWeb/supervision2/agents/security-review-agent.md)
  - Status: supported but not part of the default assignment path in root `AGENTS.md`

## Invocation rule

Every task should start by naming the responsible agent.

Default routing:

1. Use `frontend-agent` for changes in `src/`.
2. Use `backend-agent` for PHP, routes, or controllers outside `src/`.
3. Use `api-action-agent` for modular work inside `apis_me/<modulo>/`.
4. Use `frontend-structure-agent` before `frontend-agent` when the task includes structural frontend changes.
5. Use `documentation-agent` for docs, guides, and operating contracts.
6. Use `security-review-agent` for reviews, audits, or hardening backlogs.

## Minimum operational contract for every agent file

Each agent file should clearly define:

1. Purpose
2. Real project context
3. Responsibilities
4. Allowed scope
5. Restricted scope
6. Required workflow
7. Validation expectations
8. Expected reporting format

## Current repository status

The repository currently uses agent files as documentation contracts. No code path, CLI bootstrap, or runtime loader was found that auto-discovers or executes `agents/*.md`.

Operational implication:

- Keep these files accurate and synchronized with the repository.
- Do not describe non-existent flows as if they were already automated.
- If a future runner or orchestrator is added, it should read this directory and root `AGENTS.md` explicitly.

## Maintenance checklist

Use this checklist whenever an agent file changes:

1. Confirm the agent is listed consistently in `AGENTS.md` and this registry.
2. Confirm the described paths still exist.
3. Confirm validation steps match the real project workflow.
4. Confirm links such as `BUILD.md` resolve from the repository root.
5. Confirm no agent claims ownership of files outside its allowed scope.
