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

Current stage: Product Discovery.

The current work is Agent First Product Discovery, focused on Life Ontology, Memory, Insight, and Agent boundary. Avoid coding unless explicitly requested and the required downstream product / architecture documents are ready.

## Required Reading

- `README.md`
- `docs/00-handbook/00-agent-app-development-handbook.md`
- `docs/01-product/00-current-status.md`
- `docs/01-product/01-idea.md`
- `docs/01-product/02-product-discovery.md`
- `docs/01-product/03-product-definition.md`
- `docs/01-product/04-concept-validation-plan.md`
- `docs/01-product/05-mvp-design.md`
- `docs/01-product/08-life-ontology.md`
- `docs/01-product/09-discovery-questions.md`
- `docs/04-governance/01-decision-log.md`

## Current Product Task

Current task: continue Agent First Product Discovery by following `docs/01-product/00-current-status.md`.

Default next topic: Life Ontology and Agent boundary.

Do not jump to coding, architecture, database design, or full WeChat Mini Program implementation until Product Discovery exits again and the required downstream documents are ready.

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
