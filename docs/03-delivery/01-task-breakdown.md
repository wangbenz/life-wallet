# Task Breakdown

Status: Draft
Stage: Delivery Planning
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 1. 目标

本任务拆分只覆盖第一版 H5 Agent Demo。

目标是短平快跑通：

```text
设置人生账户
  ↓
Today 页自然语言记录
  ↓
Life Agent 解析 Activity
  ↓
生成今日人生账单
  ↓
保存并展示
```

## 2. Milestone 1：项目骨架

Status: Done

- 创建后端 Spring Boot 项目。
- 创建 H5 前端项目。
- 配置本地启动方式。
- 配置基础 README 或运行说明。

验收：

- 后端能启动。
- 前端能启动。
- 前端能调用后端健康检查接口。

完成记录：

- 已创建 Spring Boot 后端骨架：`backend/`。
- 已创建 H5 前端骨架：`frontend/`。
- 已实现后端健康检查：`GET /api/health`。
- 已配置 Vite `/api` 代理到 `http://127.0.0.1:8080`。
- 已验证后端测试、前端构建、后端启动、前端启动和代理调用。

## 3. Milestone 2：人生账户

Status: Done

- 实现账户设置 API。
- 实现生日和预期寿命校验。
- 计算总人生天数、已消耗天数、剩余天数。
- Me 页实现生日和预期寿命设置。
- Today 页展示人生余额。

验收：

- 用户可以设置生日和预期寿命。
- 页面能展示剩余人生天数。

完成记录：

- 已实现账户设置 API：`POST /api/account`。
- 已实现账户获取 API：`GET /api/account`。
- 已实现生日和预期寿命校验。
- 已计算总人生天数、已消耗天数和剩余天数。
- Me 页已支持设置生日和预期寿命。
- Today / Life 页已展示人生余额相关信息。

## 4. Milestone 3：Today Agent 记录

Status: Done

- Today 页实现 Agent 对话式输入。
- 后端实现记录提交 API。
- 保存用户原始记录。
- 返回处理中、成功、失败状态。

验收：

- 用户可以输入一段自然语言记录。
- 后端可以保存记录原文。

完成记录：

- Today 页底部输入框已支持提交自然语言记录。
- 已实现记录提交 API：`POST /api/agent/records`。
- 已实现今日记录获取 API：`GET /api/agent/records/today`。
- 后端已保存用户原始记录；Milestone 4 完成后响应状态升级为 `ANALYZED`。
- 前端已展示今日保存的记录内容。

## 5. Milestone 4：轻量 Life Agent

Status: Done

- 实现 `IntentRecognizer`。
- 实现 `ActivityExtractor`。
- 实现 `LifeOntologyClassifier`。
- 实现 `InsightGenerator`。
- 封装 LLM 调用接口。
- 对 LLM 输出做结构校验。
- 失败时返回温和错误。

验收：

- 输入自然语言后，可以得到 Activity 列表。
- Activity 有时长、Dimension、Domain / Topic。
- 可以生成今日总结。

完成记录：

- 已显式实现 `IntentRecognizer`、`ActivityExtractor`、`LifeOntologyClassifier` 和 `InsightGenerator`。
- 已增加可替换的 `LifeModelClient` 边界，第一版使用确定性规则实现，不需要外部 LLM 密钥。
- 已支持数字、中文和模糊时长表达，并对估算结果标记 `estimated`。
- 已实现 Agent 输出结构校验和温和失败提示。
- Today 页已展示今日总结、Activity、Dimension 汇总和人生支出。

## 6. Milestone 5：今日人生账单

Status: Next

- 保存解析结果。
- 计算 Dimension 汇总。
- 计算人生支出占比。
- Today 页展示今日总结和主要 Activity。
- Life 页展示最近记录的极简列表。

验收：

- 用户提交记录后，可以看到今日人生账单。
- 刷新页面后记录仍存在。

## 7. Milestone 6：反馈与测试环境

- 实现反馈 API。
- 页面提供“准确 / 一般 / 不准”反馈。
- 增加基础错误处理。
- 准备测试环境部署方式。

验收：

- 用户可以提交反馈。
- Demo 可以部署到测试环境供外部体验。

## 8. 第一版不做

- 微信小程序。
- 微信登录。
- 周报 / 月报。
- 复杂 Memory。
- RAG。
- 向量数据库。
- Redis。
- 支付。
- 多用户权限系统。

## 9. 推荐开工顺序

1. 后端骨架。
2. 前端骨架。
3. 人生账户。
4. Today 输入。
5. Life Agent 解析。
6. 今日人生账单展示。
7. 反馈与部署。
