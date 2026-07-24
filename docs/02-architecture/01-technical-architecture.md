# Technical Architecture

Status: Active
Stage: H5 Demo Coding
Last Updated: 2026-07-24
Owner: Human + Codex

## 1. 架构目标

当前采用安装级匿名身份的 H5 + Spring Boot + JDBC 架构，不迁移旧浏览器数据。

```text
H5 Life Agent
  ↓ POST /api/agent/chat
Spring Boot AgentRuntime（最多 4 步）
  ↓
DeepSeek Chat Completion + Tool Calling
  ↓
读 Tool：查询数据库返回给 H5 的必要记录快照
写 Tool：返回 PendingAction
  ↓
用户确认 → 受控记录 API → JDBC
```

Today 预览由后端规则解析服务生成；Life Agent 对话使用真实 DeepSeek。两者在界面和文档中必须区分。

## 2. 系统组成

### 2.1 H5 Frontend

职责：

- 展示 Today / Life / Me 和独立 Life Agent 对话页。
- 只在 `localStorage` 保存随机 `ownerKey`，账户、记录和反馈通过后端 API 读取。
- 每轮 Agent 请求只发送消息、会话标识、目标记录标识和最多 20 条近期记录的必要字段。
- 将后端返回的新增、修改、删除动作渲染为确认卡；只有用户确认后才调用受控后端 API。
- Today 与 Life Agent 使用 Web Speech API 渐进增强语音转文字；不支持时保留文字输入。
- 开发环境由 Vite 将 `/api` 代理到 Spring Boot。

### 2.2 Spring Boot Backend

职责：

- 提供 `POST /api/agent/chat`。
- 校验输入、限制 Agent 步数并转换安全错误。
- 使用 JDBC 管理 Agent 会话和基于 `clientTurnId` 的持久化响应幂等。
- 通过服务端密钥调用 DeepSeek，并执行白名单 Tool。
- 账户、记录预览/确认、历史、反馈、导出聚合和清除均由 H5 实际调用。

### 2.3 Custom Agent Runtime

```text
接收消息与最小记录快照
  → DeepSeek 决定最终回答或 Tool Call
  → ToolRegistry 校验名称与参数
  → 执行一个 Tool 并回填 ToolResult
  → 模型继续决策
  → 最终回答、待确认动作或安全终止
```

当前白名单 Tool：

- `list_records`：读取今天、近期或本轮上下文记录。
- `create_life_record`：生成新增记录待确认动作。
- `update_activity_duration`：读取目标后生成时长修改待确认动作。
- `delete_life_record`：读取目标后生成删除记录待确认动作。

更新和删除要求模型先读取记录。所有写 Tool 都不直接修改业务事实。

### 2.4 DeepSeek Model Adapter

- 使用 DeepSeek OpenAI 兼容的 `/chat/completions` 与 Tool Calling。
- 默认模型为 `deepseek-v4-flash`，可通过配置覆盖。
- 当前禁用 thinking，单次最多返回 900 tokens，温度为 0.2。
- 连接超时 5 秒、读取超时 35 秒；Runtime 最多 4 步。

### 2.5 数据与状态

| 数据 | 当前事实源 | 生命周期 |
|---|---|---|
| 匿名 `ownerKey` | 浏览器 `localStorage` | 清除或成功删除数据前 |
| 生日、预期寿命、记录、反馈 | JDBC 数据库 | 主动删除前 |
| Agent 会话消息与幂等结果 | JDBC 数据库 | 主动删除前 |
| 本轮记录快照 | 请求内存 | 请求处理期间 |
| DeepSeek 密钥 | 环境变量或受限 secret 文件 | 进程运行期间 |

### 2.6 Database Foundation

后端使用 Flyway 管理数据库版本。开发环境默认使用 `backend/data/` 下的文件型 H2（MySQL 兼容模式），部署环境通过 `DB_URL` 切换到 MySQL 8.4。

```text
life_account
  ├─ life_record
  │    ├─ life_activity
  │    ├─ life_dimension_summary
  │    └─ record_feedback
  ├─ experience_feedback
  └─ agent_conversation
         └─ agent_turn
```

表职责：

| 表 | 用途 |
|---|---|
| `life_account` | 安装级 `owner_key`、生日、预期寿命和乐观锁版本 |
| `life_record` | 原始表达、生活日、处理状态、意图和总结 |
| `life_activity` | 有顺序的活动、时长、维度、领域、主题和估算标识 |
| `life_dimension_summary` | 每条记录按固定 Life Dimension 汇总的分钟数 |
| `record_feedback` | 用户对单条解析结果的准确度校准 |
| `experience_feedback` | Me 页整体体验反馈 |
| `agent_conversation` | 对话容器、活动生活日和最近目标记录 |
| `agent_turn` | 幂等标识、用户/Agent 消息、状态和待确认动作 |

数据库约束承担不可绕过的最后一道校验：预期寿命、活动时长、固定维度、记录/轮次状态均有 `CHECK`；所有子表有外键；`client_turn_id` 全局唯一；常用的账户+日期、账户+创建时间、会话+创建时间均有索引。

`DELETE /api/data` 在一个事务中删除 owner 下的对话与账户，外键继续级联清理记录、活动、汇总和反馈。

当前应用启动时会自动建表并校验迁移。`JdbcAccountStore`、`JdbcRecordStore` 和 `JdbcConversationStore` 已投入使用；H5 所有核心数据请求都携带安装级随机 `ownerKey`。历史本地数据不会导入。

## 3. Agent 边界

- 只查询、创建、修改和删除生活记录。
- 不做通用问答、搜索、新闻、天气、编程或心理治疗。
- 模型不能访问 Repository、文件系统或 SQL，只能调用白名单 Tool。
- 找不到唯一记录时应追问或说明，不猜测目标。
- 达到步数上限或模型失败时安全终止，不伪造结果。

## 4. 配置、安全与隐私

- DeepSeek API Key 只能通过环境变量或受限 secret 文件注入，绝不进入版本库、前端包、日志或 API 响应。
- 前端永远拿不到模型密钥，只访问本站 `/api/agent/chat`。
- 用户输入和记录快照都有数量与长度约束，模型输出和 Tool 参数必须校验。
- 只上传 Agent 完成本轮任务所需的近期字段；生日、预期寿命和反馈不发送给 DeepSeek。
- 浏览器语音识别可能使用浏览器厂商或操作系统的在线服务；生产环境需要 HTTPS，并在 UI 中说明。

## 5. 暂不引入

- Redis、强制依赖外部 MySQL 和跨设备同步。
- LangChain4j 编排、复杂 Memory、RAG 和向量数据库。
- 登录、复杂多用户权限、微信小程序和消息队列。
- 多 Agent、并行 Tool Call和后台自治任务。

## 6. 后续演进

- 用真实用户样例评估 Tool 选择、参数准确度、边界拒答和回复语气。
- 为测试环境增加 HTTPS、后端进程托管和 `/api` 反向代理。
- 根据测试反馈决定是否把匿名 `ownerKey` 升级为邮箱验证码登录；新系统不提供历史 `localStorage` 导入。
- 自定义 Runtime 稳定后，再评估 LangChain4j 是否减少维护成本。
