# Technical Architecture

Status: Draft
Stage: Architecture
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 1. 架构目标

第一版架构只服务 H5 Agent Demo。

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
- Today 页展示人生余额、Agent 对话、今日记录和解析结果。
- Life 页展示极简历史或占位。

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
