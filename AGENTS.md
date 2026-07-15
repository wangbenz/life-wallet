# AGENTS.md

## Project

Life Wallet 是 Agent First 的人生理解产品。当前阶段是独立 H5 Mock 的用户验证；后端能力保留，但展示版不与后端交互。

当前不要开发完整微信小程序。只有用户明确要求 Agent 实现时，才推进最小自定义 Agent 循环、Tools 和对话状态。

## Required Reading

任何项目工作先读：

- `README.md`
- `docs/01-product/00-current-status.md`

再按任务读取一份或少量相关事实源：

- 产品边界：`docs/01-product/03-product-definition.md`
- Activity / 分类 / 人生币：`docs/01-product/08-life-ontology.md`
- 架构：`docs/02-architecture/01-technical-architecture.md`
- API：`docs/02-architecture/03-api-design.md`
- Agent：`docs/02-architecture/04-agent-design.md`
- 任务：`docs/03-delivery/01-task-breakdown.md`
- 本地运行 / 部署：`docs/03-delivery/02-operations.md`

`docs/archive/` 只用于历史追溯，不是当前实现依据。

## Development Rules

- 只实现用户请求的任务，不静默扩大产品范围。
- 产品理解变化时先更新对应事实源；优先更新现有文档，不为一次讨论新增文档。
- 保持改动小、可审查、可回滚，不引入无关依赖。
- 不删除功能或文档，除非用户明确要求。
- 重要前后端路径使用清晰中文注释，说明业务意图、数据流、验证和非显然决策，避免逐行噪声。
- 行为变化时更新测试，并尽可能运行相关验证。
- 修改 `AGENTS.md` 时同步检查 `CLAUDE.md`。

## Boundaries

- 不硬编码秘密，不跳过输入验证。
- 不把前端 Mock 结果描述为真实 Agent 能力。
- 不扩展为通用问答、心理治疗、社交、打卡成就或复杂个人数据平台。
- 不直接引入完整微信小程序、复杂 Memory、RAG 或 Agent 框架。
