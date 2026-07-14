# Technical Architecture

Status: Active
Stage: Architecture / H5 Demo Coding
Last Updated: 2026-07-11
Owner: Human + ChatGPT + Codex

## 1. 架构目标

第一版架构只服务 H5 Agent Demo。

本文件描述目标架构。当前实现分为两个可独立运行的模式：

- 前端原型模式：H5 直接调用 `frontend/src/mock/data.ts`，使用 `localStorage` 保存账户和已确认记录，不请求后端。
- 后端能力模式：Spring Boot 已保留人生账户、记录和规则版轻量 Agent API，用于后续恢复真实集成。

当前默认展示前端原型模式；下方的 Spring Boot、LLM、MySQL 链路是目标演进方向，不代表当前前端已经接入。

目标是尽快跑通：

```text
H5 Today 页
  ↓
Spring Boot API
  ↓
Lightweight Life Agent
  ↓
LLM
  ↓
MySQL 持久化
```

## 2. 系统组成

### 2.1 H5 Frontend

职责：

- 展示 Today / Life / Me 三个 Tab。
- Me 页设置生日和预期寿命。
- Today 页展示人生余额、Agent 对话、模拟理解、账单预览和确认保存。
- Life 页展示概览、趋势、时间轴和成就原型。
- Me 页展示小程序风格的账户、AI 设置和数据服务入口。
- 前端 Mock 阶段的所有接口替身集中在 `frontend/src/mock/data.ts`。

### 2.2 Spring Boot Backend

职责：

- 提供 REST API。
- 管理用户人生账户。
- 保存每日记录。
- 调用 Life Agent。
- 保存 Activity 和今日总结。

### 2.3 Lightweight Life Agent

第一版 Agent 使用自定义工作流。

核心步骤：

```text
IntentRecognizer
  ↓
ActivityExtractor
  ↓
LifeOntologyClassifier
  ↓
InsightGenerator
  ↓
Persistence
```

第一版暂不实现复杂 MemoryUpdater，只保留接口位置。

### 2.4 MySQL

Status: Planned

职责：

- 保存用户配置。
- 保存每日记录。
- 保存 Activity。
- 保存今日总结。
- 保存用户反馈。

## 3. 第一版模块

建议后端模块：

```text
account
record
agent
ontology
insight
feedback
```

## 4. Agent 边界

第一版 Agent 只围绕人生记录工作：

- 记录今天。
- 修改或重新解析记录。
- 总结今天。
- 简要解释与当前记录相关的问题。

不做通用聊天、百科、搜索、新闻、天气、编程问答等与当前人生上下文无关的问题。

## 5. 配置与安全

- LLM API Key 必须通过环境变量或本地配置注入。
- 不允许硬编码密钥。
- 用户输入需要做长度限制。
- LLM 输出必须做结构校验。
- AI 失败时返回可理解的错误信息。

## 6. 暂不引入

第一版暂不引入：

- Redis。
- 向量数据库。
- LangChain4j Agent 编排。
- 微信登录。
- 复杂用户权限。
- RAG。
- 消息队列。

## 7. 后续演进

第一版跑通后再评估：

- 是否加入 Redis。
- 是否加入长期 Memory。
- 是否加入向量检索。
- 是否迁移到微信小程序。
- 是否引入 LangChain4j 管理 Prompt、结构化输出或工具调用。
- 根据用户反馈决定前端重新接入 Spring Boot API 的范围和顺序。
