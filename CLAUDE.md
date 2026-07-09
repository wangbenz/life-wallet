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

Current stage: MVP Coding Readiness / Architecture.

The current work is preparing and starting the H5 Agent Demo implementation. Coding is allowed after the user explicitly asks to start implementation and the MVP Coding Readiness / Architecture / Task Breakdown documents have been read.

## Required Reading

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

## Current Product Task

Current task: prepare and start H5 Agent Demo implementation by following `docs/01-product/00-current-status.md` and `docs/03-delivery/01-task-breakdown.md`.

Default next topic: Milestone 1 project skeleton.

Do not build the full WeChat Mini Program yet. Implement only the first H5 Agent Demo scope described in the readiness, architecture, API, and task breakdown documents.

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
