# Life Wallet / 人生账单

Status: Active
Stage: H5 Demo Coding / Agent Learning
Last Updated: 2026-07-11
Owner: Human + ChatGPT + Codex

## Project Overview

Life Wallet（人生账单 / 人生存钱罐）是一个 Agent First 的 AI 人生理解系统。它用“每天消耗 1 元人生”的账户化表达，帮助用户直观看见自己的时间不是无限的，并通过 Agent 理解自然表达、沉淀 Memory、生成 Insight。

## Current Stage

当前阶段：H5 Demo Coding / Agent Learning。

当前已经完成两条可独立运行的 Demo 能力：

- 后端保留已跑通的人生账户、Today 记录、规则版轻量 Agent 和最近记录 API。
- 前端已切换为独立 Mock 原型模式，不依赖后端即可体验 Today、Life 和 Me 的完整核心交互。

当前前端原型包括自然语言记录、2 秒模拟理解、账单预览确认、Life 概览 / 趋势 / 时间轴 / 成就，以及小程序风格的 Me 页面。Mock 数据与函数统一放在 `frontend/src/mock/data.ts`，账户和已确认记录使用 `localStorage` 保存。

下一步优先使用当前 H5 原型收集用户反馈并补齐测试环境；Agent 学习主线仍是实现带循环、Tool 和对话状态的最小自定义 Agent，再逐步评估真实模型和 LangChain4j。

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

## Current Frontend Mode

当前默认展示的是独立前端 Mock：

```bash
cd frontend
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173` 即可体验，不需要启动后端。后端代码仍保留在 `backend/`，用于后续恢复真实 API 集成，不应把前端 Mock 数据视为真实 Agent 分析结果。
