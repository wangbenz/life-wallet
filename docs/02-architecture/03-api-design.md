# API Design

Status: Active
Stage: Architecture
Last Updated: 2026-07-24
Owner: Human + ChatGPT + Codex

## 1. 目标

本文件定义 H5 Agent Demo 第一版最小 API。

第一版不追求完整 REST 资源设计，只追求快速跑通核心流程。

除健康检查外，业务 API 都使用请求头隔离安装级数据：

```http
X-Life-Wallet-Owner-Key: <8-64 位随机安装标识>
```

当前它不是登录凭证，只用于 H5 验证阶段的数据分区。生产多用户系统仍需正式鉴权。

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

### 生成记录预览（不落库）

```http
POST /api/agent/records/preview
```

Request:

```json
{
  "lifeDate": "2026-07-09",
  "content": "今天上午修 bug，下午开会，晚上学了 40 分钟英语，有点累。"
}
```

Response 不包含 `recordId`、`status` 和 `createdAt`，只返回可编辑的活动、维度汇总、总结与 `needsConfirmation`。

### 确认保存或覆盖记录

```http
POST /api/agent/records/confirm
```

请求包含完整预览字段；新增时 `recordId` 为空，覆盖时传目标 ID。后端重新校验日期、活动时长和固定一级分类，并重新计算维度汇总。成功响应示例：

```json
{
  "recordId": 1001,
  "lifeDate": "2026-07-09",
  "content": "今天上午修 bug，下午开会，晚上学了 40 分钟英语，有点累。",
  "status": "CONFIRMED",
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
      "durationMinutes": 420
    }
  ],
  "needsConfirmation": true
}
```

预览由可替换的规则版 `LifeModelClient` 实现，不依赖 DeepSeek；确认接口才写数据库。

### 获取今日记录

```http
GET /api/agent/records/today
```

### 删除记录

```http
DELETE /api/agent/records/{recordId}
```

## 4. Feedback API

### 记录准确度反馈

```http
GET  /api/feedback/records
POST /api/feedback/records
```

Request:

```json
{
  "recordId": 1001,
  "rating": "accurate"
}
```

`rating` 允许 `accurate`、`partial`、`inaccurate`。

### 整体体验反馈

```http
GET  /api/feedback/experience
POST /api/feedback/experience
```

## 5. Life API

### 获取最近记录

```http
GET /api/life/recent-records
```

第一版用于 Life 页极简展示。

## 6. Life Agent Chat API

### 发送一轮对话

```http
POST /api/agent/chat
Content-Type: application/json
X-Life-Wallet-Owner-Key: 550e8400-e29b-41d4-a716-446655440000
```

Request：

```json
{
  "conversationId": null,
  "clientTurnId": "42c74b5c-97bb-4028-8152-937c041d17da",
  "message": "把今天的上班从 4 小时改成 8 小时",
  "lifeDate": "2026-07-24",
  "contextRecordId": 1001,
  "records": [
    {
      "recordId": 1001,
      "lifeDate": "2026-07-24",
      "content": "今天上班 4 小时",
      "activities": [
        {
          "title": "上班",
          "durationMinutes": 240,
          "dimension": "创造",
          "domain": "工作"
        }
      ]
    }
  ]
}
```

约束：

- `conversationId` 首轮可空，服务端返回新标识。
- `clientTurnId` 由客户端每次生成；相同值重试返回相同结果。
- `message` 不能为空，最大 2000 字。
- `records` 最多 20 条，只包含本轮可能需要的字段；生日、预期寿命和反馈不在协议中。
- 客户端记录快照只用于本轮 Tool 查询，不由后端持久化；对话和幂等响应会写入 `agent_conversation` / `agent_turn`。

需要确认的响应：

```json
{
  "conversationId": "conv_01",
  "turnId": "turn_01",
  "status": "NEEDS_CONFIRMATION",
  "message": "我找到了今天的上班记录，确认后会把 4 小时改为 8 小时。",
  "recordIds": [1001],
  "pendingAction": {
    "type": "UPDATE_DURATION",
    "recordId": 1001,
    "activityIndex": 0,
    "activityTitle": "上班",
    "oldMinutes": 240,
    "newMinutes": 480,
    "lifeDate": null,
    "content": null
  }
}
```

`status`：

- `COMPLETED`：只读查询或边界回复已完成。
- `NEEDS_CONFIRMATION`：前端应展示结构化差异，不能直接执行。
- `FAILED`：Runtime 已安全终止。

当前写动作类型为 `CREATE_RECORD`、`UPDATE_DURATION`、`DELETE_RECORD`。确认发生在前端，确认后的本地写入不是第二个后端 API。

## 7. Data API

```http
DELETE /api/data
X-Life-Wallet-Owner-Key: <安装标识>
```

删除该安装标识下的 Agent 对话、幂等轮次、后端账户、记录和反馈，成功返回 `204 No Content`。接口可重复调用；没有数据时同样返回成功。前端本地清除与该请求配合执行，后端不可用时必须提示用户尚未确认删除服务器数据。

## 8. 错误格式

统一错误返回：

```json
{
  "code": "AGENT_PARSE_FAILED",
  "message": "这次没有理解成功，可以稍后再试，或把记录写得更具体一点。"
}
```

Agent 未配置密钥时返回 HTTP `503`；上游模型超时、协议或调用异常返回 HTTP `502`。响应仍使用统一错误结构，且不包含密钥、模型原始 Authorization 或完整 Tool trace。

## 9. 第一版输入限制

- `content` 最大长度：2000 字。
- `expectedLifeYears` 范围：1-120。
- `birthday` 不能晚于当前日期。
- `lifeDate` 不能明显晚于当前日期。
