# Life Wallet / 人生账单

Status: Active
Stage: H5 Demo Validation
Last Updated: 2026-07-23
Owner: Human + ChatGPT + Codex

## Project Overview

Life Wallet（人生账单 / 人生存钱罐）是一个 Agent First 的 AI 人生理解系统。它用“每天消耗 1 元人生”的账户化表达，帮助用户直观看见自己的时间不是无限的，并通过 Agent 理解自然表达、沉淀 Memory、生成 Insight。

## Current Stage

当前阶段：H5 Demo Validation。

当前已经完成两条可独立运行的 Demo 能力：

- 后端保留已跑通的人生账户、Today 记录、规则版轻量 Agent 和最近记录 API。
- 前端已切换为独立 Mock 原型模式，不依赖后端即可体验 Today、Life 和 Me 的完整核心交互。

当前前端原型包括人生账户初始化、自然语言记录、关键词驱动的本地 Mock 理解、账单预览编辑、确认保存、准确度反馈，以及基于真实本地记录的 Life 洞察 / 记录和精简 Me 页面。成就、连续打卡、假趋势和无功能入口已退出首版。Mock 数据与函数统一放在 `frontend/src/mock/`，账户、记录与反馈使用 `localStorage` 保存。

当前视觉以产品原型为基准，统一为“清爽小程序 + 温和生活手账”：使用柔和绿色氛围、精致白色内容卡和明确的绿色主操作；Today 突出人生余额与自然语言输入，Life 突出基于真实记录的阶段洞察，Me 使用一致的设置卡片。页面仍为真实 H5，不包含假手机框和假系统状态栏。

全站图标统一使用按需导入的 Lucide 线性图标，Life Agent 使用温和的对话气泡符号，不再保留独立自绘机器人；Today 记录日期与 Me 出生日期统一使用支持月份和年份跳转的 H5 日历，不再调用系统原生日期面板。按钮、标签、输入框、进度条和浮动底部导航包含轻量微交互，并遵守系统的“减少动态效果”设置。

当前 H5 原型已完成首轮京东云静态部署，Nginx 使用 `15173` 端口提供服务，公网访问已验证。下一步邀请 5-10 个目标用户完成 7 个记录日验证。Agent 学习主线仍是实现带循环、Tool 和对话状态的最小自定义 Agent，再逐步评估真实模型和 LangChain4j。

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

当前默认展示的是独立前端 Mock：

```bash
cd frontend
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173` 即可体验，不需要启动后端。后端代码仍保留在 `backend/`，用于后续恢复真实 API 集成，不应把前端 Mock 数据视为真实 Agent 分析结果。

本地测试、京东云发布和回滚见 `docs/03-delivery/02-operations.md`。
