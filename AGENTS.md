# AGENTS.md

## Project Overview

This project is an Agent-powered Life Wallet application developed from idea discovery to MVP delivery.

The project follows this workflow:

```text
Idea
→ Product Discovery
→ Product Definition
→ MVP Design
→ Architecture
→ Coding
→ Testing
→ Deployment
→ Iteration
```

## Current Stage

Current stage: MVP Coding Readiness / Architecture.

Application code can start after the user explicitly asks and the MVP Coding Readiness / Architecture / Task Breakdown documents have been read.

## Required Reading Before Any Project Work

- `README.md`
- `docs/00-handbook/00-agent-app-development-handbook.md`
- `docs/01-product/00-current-status.md`
- `docs/01-product/01-idea.md`
- `docs/01-product/02-product-discovery.md`
- `docs/01-product/03-product-definition.md`
- `docs/01-product/04-concept-validation-plan.md`
- `docs/01-product/05-mvp-design.md`
- `docs/01-product/06-mvp-coding-readiness.md`
- `docs/01-product/08-life-ontology.md`
- `docs/01-product/09-discovery-questions.md`
- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/03-delivery/01-task-breakdown.md`
- `docs/04-governance/01-decision-log.md`

## Required Reading Before Code Changes

Do not make code changes unless explicitly requested and the required product / architecture / task documents are ready.

Before any future code changes, read the current-status document first, then read the product / architecture documents listed below.

Before architecture or coding work, also read:

- `docs/01-product/03-product-definition.md`
- `docs/01-product/05-mvp-design.md`
- `docs/01-product/06-mvp-coding-readiness.md`
- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/03-delivery/01-task-breakdown.md`

## Current Product Task

Current task: prepare and start H5 Agent Demo implementation by following `docs/01-product/00-current-status.md` and `docs/03-delivery/01-task-breakdown.md`.

Default next topic: Milestone 1 project skeleton.

Do not build the full WeChat Mini Program yet. Implement only the first H5 Agent Demo scope described in the readiness, architecture, API, and task breakdown documents.

## Development Rules

- Implement only the requested task.
- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Keep changes small, reviewable, and reversible.
- Update docs before code when product understanding changes.
- When updating `AGENTS.md`, also check and update `CLAUDE.md` so agent instructions stay synchronized.
- Add or update tests when behavior changes.
- Run relevant tests after implementation when possible.

## Forbidden Actions

- Do not jump into full WeChat Mini Program implementation.
- Do not remove existing features or documents without explicit instruction.
- Do not hardcode secrets.
- Do not skip input validation.
- Do not expand Agent capabilities beyond documented boundaries.
