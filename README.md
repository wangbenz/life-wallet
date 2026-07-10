# Life Wallet / 人生账单

Status: Active
Stage: H5 Demo Coding / Agent Learning
Last Updated: 2026-07-11
Owner: Human + ChatGPT + Codex

## Project Overview

Life Wallet（人生账单 / 人生存钱罐）是一个 Agent First 的 AI 人生理解系统。它用“每天消耗 1 元人生”的账户化表达，帮助用户直观看见自己的时间不是无限的，并通过 Agent 理解自然表达、沉淀 Memory、生成 Insight。

## Current Stage

当前阶段：H5 Demo Coding / Agent Learning。

当前已经完成 H5 骨架、人生账户、Today 记录、规则版轻量 Agent 和 Life 最近记录。现有 Agent 是显式固定流水线；下一条学习主线是实现带循环、Tool 和对话状态的最小自定义 Agent，再逐步接真实模型和 LangChain4j。

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

## Start Here

日常开发先读以下文档，不需要每次重读全部历史资料：

1. `docs/01-product/00-current-status.md`：事实进度与下一任务。
2. `docs/02-architecture/04-agent-design.md`：MVP、Agent 协议、Tool、状态与学习路线。
3. `docs/03-delivery/01-task-breakdown.md`：已完成和待完成任务。
4. `docs/03-delivery/02-local-development.md`：本地启动和测试。

按任务补充阅读：

- 产品边界：`docs/01-product/03-product-definition.md`、`docs/01-product/06-mvp-coding-readiness.md`。
- 领域规则：`docs/01-product/08-life-ontology.md`。
- 架构 / API：`docs/02-architecture/01-technical-architecture.md`、`docs/02-architecture/03-api-design.md`。
- 决策追溯：`docs/04-governance/01-decision-log.md`。
- 方法论与早期探索：`docs/00-handbook/`、Idea、Discovery、概念验证和旧版 MVP Design；只在需要追溯时阅读。

## Working Rule

Product understanding comes before implementation. 当前只实现 H5 Agent Demo；先看懂并手写最小 Agent，再评估 LangChain4j，不直接跳到完整微信小程序或复杂 Agent 框架。
