# CLAUDE.md

## Project Context

Life Wallet（人生账单 / 人生存钱罐） is an Agent-powered application that helps users understand how their life time is spent through natural-language daily records, AI classification, and day/week/month feedback.

## Workflow

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

Current stage: Product Definition.

The current work is Product Definition refinement. Avoid coding unless explicitly requested and the required downstream product / architecture documents are ready.

## Required Reading

- `README.md`
- `docs/00-handbook/00-agent-app-development-handbook.md`
- `docs/01-product/00-current-status.md`
- `docs/01-product/01-idea.md`
- `docs/01-product/02-product-discovery.md`
- `docs/01-product/03-product-definition.md`
- `docs/01-product/08-life-ontology.md`
- `docs/01-product/09-discovery-questions.md`
- `docs/04-governance/01-decision-log.md`

## Current Product Task

Current task: continue Product Definition by following `docs/01-product/00-current-status.md`.

Default next topic: Product Definition refinement.

Do not jump to coding, architecture, database design, or MVP page design until Product Definition exits and the required downstream documents are ready.

## Coding Guidelines

- Make small, focused changes.
- Preserve existing architecture once architecture exists.
- Prefer simple implementation over over-engineering.
- Explain tradeoffs when there are multiple options.
- When updating `AGENTS.md`, also check and update `CLAUDE.md` so agent instructions stay synchronized.
- Run relevant tests after changes.
- Summarize changed files and test results.

## Forbidden Actions

- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Do not remove documents or features without explicit instruction.
- Do not skip validation for user inputs.
- Do not hardcode secrets.
