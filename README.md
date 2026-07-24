# Life Wallet / 人生账单

Status: Active
Stage: H5 Demo Validation
Last Updated: 2026-07-24
Owner: Human + ChatGPT + Codex

## Project Overview

Life Wallet（人生账单）是一个 Agent First 的 AI 人生理解系统。它用剩余天数建立时间感知，通过 Agent 理解自然表达、沉淀 Memory、生成 Insight，帮助用户看见已记录时间正在流向哪里。

## Current Stage

当前阶段：H5 Demo Validation。

当前已经完成本地优先的 H5 验证闭环，以及一条可选的真实 Agent 链路：

- Today、Life、Me 已通过安装级匿名 `ownerKey` 接入后端数据库，不要求登录；历史浏览器数据不迁移。
- Life Agent 对话页已接入 Spring Boot 自定义 Agent Runtime，通过 DeepSeek Tool Calling 查询记录，或生成等待用户确认的新增、修改、删除动作。
- Today 的首次记录理解通过后端规则解析服务生成预览，确认后才写入数据库；Life Agent 对话使用真实 DeepSeek。
- 后端已加入 Flyway 管理的 MySQL 8.4 持久化；账户、确认记录、反馈、Agent 会话和幂等结果均使用 JDBC。

当前 H5 包括聚焦式账户初始化、后端记录预览、确认保存、准确度反馈、数据库驱动的 Life 洞察 / 记录和精简 Me 页面。首次开户保存后直接进入 Today；预览确认区会主动进入视野并避开底部导航。成就、连续打卡、假趋势和无功能入口已退出首版。

当前视觉以产品原型为基准，统一为“清爽小程序 + 温和生活手账”：使用柔和绿色氛围、精致白色内容卡和明确的绿色主操作；Today 突出预计剩余天数与自然语言输入，Life 突出基于真实记录的阶段洞察，Me 使用一致的设置卡片。页面仍为真实 H5，不包含假手机框和假系统状态栏。

全站图标统一使用按需导入的 Lucide 线性图标，Life Agent 使用温和的对话气泡符号，不再保留独立自绘机器人；Today 记录日期与 Me 出生日期统一使用支持月份和年份跳转的 H5 日历，不再调用系统原生日期面板。Agent 会保留 Today / Life 来源和目标历史记录上下文；历史卡片以 Agent 修改为主操作，手动修正与删除收进“更多”。主要触控目标按 H5 的 44px 尺寸收敛，并遵守系统的“减少动态效果”设置。

文字输入在所有支持的浏览器可用；Today 与 Life Agent 同时提供渐进增强的语音转文字，识别能力和权限由当前浏览器提供。当前京东云测试环境已通过 Nginx `15173` 发布本版 H5、Spring Boot 后端和 MySQL；DeepSeek 密钥与 HTTPS 尚未配置，因此普通记录闭环可测试，真实 Agent 对话会明确提示未配置，HTTP 环境也不保证手机语音输入可用。

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

1. `docs/README.md`：文档地图。
2. `docs/01-product/00-current-status.md`：当前事实、边界和下一步。
3. 按任务读取对应产品、架构或交付文档，不需要重读全部历史材料。

Idea、Discovery、旧 MVP、编码准备度、决策日志和方法论已统一移到 `docs/archive/`，只用于追溯。

## Working Rule

Product understanding comes before implementation. 当前只实现 H5 Agent Demo；先看懂并手写最小 Agent，再评估 LangChain4j，不直接跳到完整微信小程序或复杂 Agent 框架。

## Current Frontend Mode

H5 全部核心数据流程都需要启动后端；Life Agent 还需要配置 DeepSeek 密钥：

```bash
cd frontend
pnpm install
pnpm dev
```

未启动后端时 H5 会提示测试服务不可用。后端启动和密钥配置见 `docs/03-delivery/02-operations.md`。

本地测试、京东云发布和回滚见 `docs/03-delivery/02-operations.md`。
