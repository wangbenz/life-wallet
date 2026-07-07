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

Current stage: Product Discovery.

Do not implement application code unless the user explicitly asks and the required product / architecture documents are ready.

## Required Reading Before Code Changes

- `docs/00-handbook/00-agent-app-development-handbook.md`
- `docs/01-product/01-idea.md`
- `docs/01-product/02-product-discovery.md`
- `docs/04-governance/01-decision-log.md`

Before architecture or coding work, also read:

- `docs/01-product/03-product-definition.md`
- `docs/01-product/05-mvp-design.md`
- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/03-delivery/01-task-breakdown.md`

## Development Rules

- Implement only the requested task.
- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Keep changes small, reviewable, and reversible.
- Update docs before code when product understanding changes.
- Add or update tests when behavior changes.
- Run relevant tests after implementation when possible.

## Forbidden Actions

- Do not jump from Product Discovery directly into full application coding.
- Do not remove existing features or documents without explicit instruction.
- Do not hardcode secrets.
- Do not skip input validation.
- Do not expand Agent capabilities beyond documented boundaries.
