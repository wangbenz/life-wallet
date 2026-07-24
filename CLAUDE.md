# CLAUDE.md

## Project Context

Life Wallet 是 Agent First 的人生理解产品。当前使用独立 H5 Mock 验证“自然语言记录 → AI 理解 → 用户确认 → 已记录时长反馈”，暂不开发完整微信小程序。

## Required Reading

先读：

- `README.md`
- `docs/01-product/00-current-status.md`

再按任务读取 `docs/README.md` 列出的相关产品、架构或交付事实源。`docs/archive/` 只用于历史追溯。

## Working Rules

- 只做用户请求的范围，优先简单、可逆的实现。
- 产品理解变化时更新现有事实源，不为一次讨论新增文档。
- 不把前端 Mock 当作真实 Agent，不静默扩大产品或 Agent 能力。
- 重要代码路径使用清晰中文注释，说明业务意图、数据流、验证和非显然决策。
- 行为变化时更新并运行相关测试。
- 修改 `AGENTS.md` 时同步检查本文件。
- 不硬编码秘密，不跳过输入验证，不直接进入完整微信小程序、复杂 Memory、RAG 或通用 Agent。
