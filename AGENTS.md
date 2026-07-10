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

Current stage: H5 Demo Coding / Agent Learning.

Milestones 1-5 of the H5 Demo are implemented. The current learning direction is to evolve the deterministic Agent pipeline into a minimal custom Agent with an explicit loop, Tools, and conversation state before considering LangChain4j.

## Required Reading Before Any Project Work

- `README.md`
- `docs/01-product/00-current-status.md`

Read the relevant source of truth for the task:

- Agent scope, protocol, Tools, state, or learning work: `docs/02-architecture/04-agent-design.md`
- Product scope changes: `docs/01-product/03-product-definition.md` and `docs/01-product/06-mvp-coding-readiness.md`
- Activity or classification changes: `docs/01-product/08-life-ontology.md`
- Architecture or API changes: `docs/02-architecture/01-technical-architecture.md` and `docs/02-architecture/03-api-design.md`
- Delivery work: `docs/03-delivery/01-task-breakdown.md`

The handbook, Idea, Discovery, concept validation, old MVP Design, open questions, and Decision Log are history/reference documents. Read them only when the task needs rationale or traceability.

## Required Reading Before Code Changes

Do not make code changes unless explicitly requested and the required product / architecture / task documents are ready.

Before any future code changes, read the current-status document first, then read only the relevant design and delivery documents.

For Agent architecture or coding work, also read:

- `docs/01-product/06-mvp-coding-readiness.md`
- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/02-architecture/04-agent-design.md`
- `docs/03-delivery/01-task-breakdown.md`

## Current Product Task

Current planning direction: preserve the working H5 Demo and build the smallest custom Agent vertical slice described in `docs/02-architecture/04-agent-design.md` when the user explicitly requests code implementation.

Milestone 6 feedback and test environment remains in the delivery backlog; do not mix it into an Agent-runtime task unless explicitly requested.

Do not build the full WeChat Mini Program yet. Implement only the first H5 Agent Demo scope described in the readiness, architecture, API, and task breakdown documents.

## Development Rules

- Implement only the requested task.
- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Keep changes small, reviewable, and reversible.
- Update docs before code when product understanding changes.
- When updating `AGENTS.md`, also check and update `CLAUDE.md` so agent instructions stay synchronized.
- Write clear Chinese comments for important frontend and backend code paths so the project owner can understand the implementation.
- Comments should explain business intent, Agent workflow, data flow, validation, and non-obvious decisions; avoid noisy line-by-line comments for self-explanatory code.
- Add or update tests when behavior changes.
- Run relevant tests after implementation when possible.

## Forbidden Actions

- Do not jump into full WeChat Mini Program implementation.
- Do not remove existing features or documents without explicit instruction.
- Do not hardcode secrets.
- Do not skip input validation.
- Do not expand Agent capabilities beyond documented boundaries.
