# API Design

Status: Draft
Stage: Architecture
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 1. 目标

本文件定义 H5 Agent Demo 第一版最小 API。

第一版不追求完整 REST 资源设计，只追求快速跑通核心流程。

## 2. Account API

### 保存人生账户

```http
POST /api/account
```

Request:

```json
{
  "birthday": "1995-01-01",
  "expectedLifeYears": 80
}
```

Response:

```json
{
  "accountId": 1,
  "birthday": "1995-01-01",
  "expectedLifeYears": 80,
  "totalLifeDays": 29200,
  "usedLifeDays": 11500,
  "remainingLifeDays": 17700
}
```

### 获取人生账户

```http
GET /api/account
```

## 3. Agent Record API

### 提交今日记录

```http
POST /api/agent/records
```

Request:

```json
{
  "lifeDate": "2026-07-09",
  "content": "今天上午修 bug，下午开会，晚上学了 40 分钟英语，有点累。"
}
```

Response:

Milestone 3 的最小保存响应已被 Milestone 4 的解析响应替代。当前响应为：

```json
{
  "recordId": 1001,
  "lifeDate": "2026-07-09",
  "content": "今天上午修 bug，下午开会，晚上学了 40 分钟英语，有点累。",
  "status": "ANALYZED",
  "createdAt": "2026-07-09T22:05:00Z",
  "intent": "RECORD_TODAY",
  "summary": "今天主要投入在工作和成长上，状态略有疲惫。",
  "activities": [
    {
      "title": "修 bug",
      "durationMinutes": 180,
      "dimension": "创造",
      "domain": "工作",
      "topic": "修 bug",
      "estimated": true
    }
  ],
  "dimensionSummary": [
    {
      "dimension": "创造",
      "durationMinutes": 420,
      "lifeCoinAmount": 0.29
    }
  ],
  "needsConfirmation": true
}
```

当前解析由可替换的规则版 `LifeModelClient` 实现，用于在不依赖外部密钥的情况下跑通 Agent 工作流。后续接入 LLM 时保持 API 响应结构不变。

### 获取今日记录

```http
GET /api/agent/records/today
```

### 重新解析记录

```http
POST /api/agent/records/{recordId}/reparse
```

## 4. Feedback API

### 提交反馈

```http
POST /api/feedback
```

Request:

```json
{
  "recordId": 1001,
  "accuracy": "OK",
  "comment": "工作时间差不多，英语学习时间准确。"
}
```

Response:

```json
{
  "feedbackId": 501,
  "status": "saved"
}
```

## 5. Life API

### 获取最近记录

```http
GET /api/life/recent-records
```

第一版用于 Life 页极简展示。

## 6. 错误格式

统一错误返回：

```json
{
  "code": "AGENT_PARSE_FAILED",
  "message": "这次没有理解成功，可以稍后再试，或把记录写得更具体一点。"
}
```

## 7. 第一版输入限制

- `content` 最大长度：2000 字。
- `expectedLifeYears` 范围：1-120。
- `birthday` 不能晚于当前日期。
- `lifeDate` 不能明显晚于当前日期。
