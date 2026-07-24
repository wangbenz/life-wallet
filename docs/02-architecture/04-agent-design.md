# Life Wallet Agent Design & Learning Roadmap

Status: Active
Stage: Real Agent Vertical Slice
Last Updated: 2026-07-24
Owner: Human + Codex

## 0. 文档定位

本文是当前 MVP 与 Agent 学习路线的简化主文档，回答“现在做什么、Agent 如何工作、每一步学什么”。

现有 Idea、Discovery、MVP Design 和 Decision Log 保留为背景与决策历史，不再要求每次开发都完整阅读。发生冲突时，按以下优先级执行：

```text
00-current-status.md
  > 本文
  > 06-mvp-coding-readiness.md / technical-architecture.md / api-design.md
  > 早期 Discovery 与旧版 MVP 草案
```

后端原有确定性流水线继续保留：

```text
IntentRecognizer
  → ActivityExtractor
  → LifeOntologyClassifier
  → InsightGenerator
  → RecordStore
```

在此之外，Life Agent 对话页已经新增真实 Agent vertical slice：

```text
H5 对话 + 必要记录快照
  → DeepSeek 决策
  → 白名单 Tool
  → ToolResult 回填
  → 最终回答或待确认写动作
```

从代码得到的关键事实：

- Today 的首次记录解析仍由规则版 `LightweightLifeAgent` / 前端 Mock 完成；Life Agent 对话使用 `DeepSeekAgentModel`。
- `IntentRecognizer` 只生成标签，没有控制后续分支；`MODIFY_RECORD` 和 `VIEW_SUMMARY` 仍会继续抽取并保存成新记录。
- `POST /api/agent/records` 把所有输入都当业务记录处理；例如“你好”也可能被保存为 60 分钟的“生活”活动。
- `AgentRuntime` 已实现最多 4 步的模型—Tool 循环，`AgentToolRegistry` 提供 1 个读 Tool 和 3 个待确认写 Tool。
- `JdbcConversationStore` 已使用 `agent_conversation` / `agent_turn` 保存消息和 `clientTurnId` 幂等结果；H5 用安装级随机 `ownerKey` 隔离会话。
- JDBC 已确认记录是当前事实源。H5 每轮只把最多 20 条必要记录快照交给 Agent；写 Tool 不直接持久化，用户确认后由受控记录 API 执行。
- DeepSeek API Key 由启动组件从 `service_secret` 读取 AES-256-GCM 密文，并使用部署环境单独保管的主密钥解密到内存；非空导入文件只用于首次配置或主动轮换。

下一步重点不是扩大 Tool 数量，而是用真实样例评估 Tool 选择、参数提取、边界拒答和写前确认。

## 1. MVP 范围

### 1.1 MVP 目标

做一个可运行、可测试的 H5 Life Agent Demo，让用户：

1. 设置生日和预期寿命，看到预计剩余天数。
2. 在 Today 页用自然语言记录生活。
3. 由 Agent 判断这是普通聊天、记录、修改还是查询。
4. 必要时调用业务 Tool，生成 Activity 与今日人生账单。
5. 在一次对话中继续追问、确认或查看结果。
6. 对结果提交“准确 / 一般 / 不准”反馈。

当前 H5 Mock 的对话上下文还需要满足三个界面约束：

- 从 Today 或 Life 历史进入时保留来源页面，关闭对话后返回原处。
- 有目标记录时，快捷问题和输入提示使用“这条记录”，不错误指向“今天”。
- 写操作继续展示目标、旧值、新值和影响范围，确认后才更新本地记录。

第一阶段只验证两个闭环：

```text
产品闭环：自然表达 → AI 理解 → 人生账单 → 用户反馈
Agent 闭环：观察上下文 → 选择行动 → 调用 Tool → 观察结果 → 最终回复
```

### 1.2 MVP 完成标准

- 普通聊天不会误写业务数据。
- 明确记录指令能保存原文、Activity、维度汇总和总结。
- 模糊输入可以追问或标记需要确认。
- 查询指令通过 Tool 读取已有数据，不靠模型编造。
- 每轮 Agent 最多执行固定步数，失败时有可理解的兜底。
- 核心路由、Tool、状态与循环都有自动化测试。

## 2. 模块划分

| 模块 | 职责 | 当前代码 | 下一步 |
|---|---|---|---|
| `frontend` | Today / Life / Me、对话输入、结果卡片 | 已有会话标识、真实 Agent API、写前确认和语音输入 | 增加真实用户评估与失败反馈 |
| `account` | 人生账户与余额计算 | 已有 | 保持稳定 |
| `record` | 生活记录、Activity 结果、查询 | 已有 | 从 Agent 编排中抽离为可调用业务服务 |
| `ontology` | Activity 粒度与 Life Dimension 规则 | 逻辑位于 `agent` | 保留规则兜底，逐步形成独立领域能力 |
| `agent.runtime` | Agent 循环、步数限制、终止与异常处理 | 已实现，最多 4 步 | 增加评估与精简 trace |
| `agent.model` | 把上下文交给模型并得到下一步 Action | 已实现 DeepSeek 适配与测试替身 | 增加重试策略和模型评估 |
| `agent.tool` | Tool 定义、注册、参数校验、执行和结果返回 | 已实现记录查询及 3 个待确认写 Tool | 根据验证决定是否扩展 |
| `conversation` | Conversation / Turn / PendingAction | 已实现 JDBC 会话、结构化 PendingAction 和请求幂等 | 根据验证增加清理策略 |
| `feedback` | 保存用户对解析结果的评价 | 文档有，代码缺失 | MVP 后续补齐 |
| `common` | 统一错误、校验与观测信息 | 部分已有 | 增加 Agent 错误码和 traceId |

依赖方向：

```text
Controller → AgentRuntime → Model / ToolRegistry
                              ↓
                    AccountService / RecordService
                              ↓
                            Store
```

Agent 只能通过 Tool 调用业务能力；Tool 适配业务 Service，业务 Service 不依赖 Agent。

## 3. 核心领域对象

### 3.1 产品领域对象

| 对象 | 核心字段 | 说明 |
|---|---|---|
| `LifeAccount` | birthday, expectedLifeYears, remainingLifeDays | 用户的人生账户 |
| `LifeRecord` | recordId, lifeDate, originalContent, status | 一次生活记录，记录时间不等于生活发生日期 |
| `Activity` | title, durationMinutes, dimension, domain, topic, estimated | 可回看、有意义的生活片段 |
| `DimensionSummary` | dimension, durationMinutes | 某一天按 Life Dimension 聚合的已记录时长 |
| `Insight` | summary, evidenceRecordIds | 基于记录生成的温和理解；第一阶段仅做今日总结 |
| `Feedback` | recordId, accuracy, comment | 用户对 Agent 结果的校准信号 |

固定 `LifeDimension`：成长、创造、关系、健康、生活、休闲、睡眠。

### 3.2 Agent 运行对象

| 对象 | 说明 |
|---|---|
| `Conversation` | 一段连续对话的容器 |
| `Turn` | 一次用户输入及其 Agent 处理结果 |
| `AgentContext` | 本轮可见的消息、当前日期、相关业务数据和剩余步数 |
| `AgentAction` | 模型下一步动作：`FINAL_ANSWER` 或 `TOOL_CALL` |
| `ToolCall` | toolName、callId、结构化 arguments |
| `ToolResult` | callId、成功状态、结构化 data 或安全错误 |
| `PendingAction` | 等待用户确认或补充信息的动作 |

不要把三类状态混在一起：

- `Conversation` 是交互状态。
- `LifeAccount / LifeRecord` 是业务事实。
- `Memory` 是从历史中提炼的长期信息，第一阶段不实现。

## 4. Agent 输入输出协议

### 4.1 客户端请求

```json
{
  "conversationId": "conv_01",
  "clientTurnId": "turn_client_01",
  "message": "今天写代码两小时，晚上跑步半小时",
  "lifeDate": "2026-07-11"
}
```

约束：

- `conversationId` 首次可为空，由服务端创建。
- `clientTurnId` 用于防止网络重试造成重复写入。
- `message` 最大 2000 字。
- `lifeDate` 是客户端理解的生活日；服务端仍需校验。

### 4.2 服务端响应

```json
{
  "conversationId": "conv_01",
  "turnId": "turn_01",
  "status": "COMPLETED",
  "message": "我把这两段生活记下来了，今天主要投入在创造和健康上。",
  "cards": [
    {
      "type": "LIFE_RECORD",
      "data": {
        "recordId": 1001,
        "needsConfirmation": false
      }
    }
  ],
  "pendingAction": null
}
```

`status` 只允许：

- `COMPLETED`：本轮已得到最终回复。
- `NEEDS_INPUT`：需要用户补充信息。
- `NEEDS_CONFIRMATION`：写入或修改前等待确认。
- `FAILED`：已安全终止。

`cards` 承载可渲染业务结果，`message` 承载自然语言。前端不应解析自然语言来恢复业务数据。

### 4.3 模型与 Runtime 的内部协议

最终回复：

```json
{
  "type": "FINAL_ANSWER",
  "message": "你今天还没有留下记录。"
}
```

调用工具：

```json
{
  "type": "TOOL_CALL",
  "toolCall": {
    "callId": "call_01",
    "toolName": "create_life_record",
    "arguments": {
      "lifeDate": "2026-07-11",
      "content": "今天写代码两小时"
    }
  }
}
```

第一阶段每次只允许一个 Tool Call，便于看清循环与错误；并行 Tool Call 后续再做。

## 5. 工具接口设计

### 5.1 统一接口

```java
public interface LifeTool<I, O> {
    ToolDefinition definition();
    O execute(I input, ToolExecutionContext context);
}
```

`ToolDefinition` 至少包含：`name`、`description`、`inputSchema`、`readOnly`。Runtime 负责参数反序列化、Schema 校验、权限检查、超时和异常转换，Tool 只负责调用业务 Service。

### 5.2 当前已实现 Tool 集合

| Tool | 类型 | 用途 | 是否需要确认 |
|---|---|---|---|
| `list_records` | 读 | 查询今天、近期或请求上下文中的记录快照 | 否 |
| `create_life_record` | 写建议 | 生成生活记录内容和生活日 | 是 |
| `update_activity_duration` | 写建议 | 修改指定记录、指定活动的时长 | 是，且必须先读 |
| `delete_life_record` | 写建议 | 删除指定记录 | 是，且必须先读 |

Tool 返回结构化结果，不直接改动数据库。最终表达由 Agent 生成，业务变更由前端依据 `pendingAction` 展示差异，确认后调用记录 API。

### 5.3 Tool 选择原则

- 闲聊、解释能力边界：直接 `FINAL_ANSWER`。
- 需要真实账户或记录数据：必须调用读 Tool。
- 需要创建、修改、反馈：调用写 Tool。
- 信息不足：先 `NEEDS_INPUT`，不猜参数、不调用 Tool。
- Tool 不存在或越界：拒绝并说明 Life Wallet 的能力边界。

## 6. 对话状态设计

### 6.1 最小状态

```json
{
  "conversationId": "conv_01",
  "activeLifeDate": "2026-07-11",
  "lastRecordId": 1001,
  "pendingAction": null,
  "turns": [],
  "version": 3
}
```

第二阶段先使用进程内存保存，接口按可持久化方式设计。服务重启丢失会话可以接受，但业务记录是否持久化必须单独说明。

### 6.2 普通聊天与业务指令

不只靠单个关键词分类，而由“意图 + 是否需要业务事实 + 是否会产生副作用”共同决定：

| 输入 | 路由 | 行动 |
|---|---|---|
| “你好” | `CHAT` | 直接回复，不调用 Tool |
| “你能做什么” | `CHAT` | 说明边界，不调用 Tool |
| “今天写代码两小时，帮我记下” | `COMMAND` | 调用 `create_life_record` |
| “我今天记了什么” | `QUERY` | 调用 `get_today_record` |
| “把跑步改成一小时” | `COMMAND` | 结合 `lastRecordId`；不足则追问；修改前确认 |
| “HashMap 为什么线程不安全” | `OUT_OF_SCOPE` 或 `CONTEXTUAL_CHAT` | 无相关人生上下文则克制拒答；有学习上下文可简答，但不写记录 |

### 6.3 Agent 循环

```text
接收用户消息
  → 读取 Conversation 与必要上下文
  → Model 决定 FINAL_ANSWER 或 TOOL_CALL
  → 若 TOOL_CALL：校验并执行 Tool
  → 把 ToolResult 追加到本轮上下文
  → 再次让 Model 决策
  → 得到最终回复或达到步数上限
```

终止条件：

- 模型输出 `FINAL_ANSWER`。
- 需要用户输入或确认。
- 达到 `maxSteps`（第一阶段建议 4）。
- Tool 或模型连续失败，Runtime 返回安全错误。

Agent 需要循环，是因为模型在调用 Tool 前并不知道真实结果。它必须先行动、观察结果，再决定回答、继续调用还是追问。

## 7. 第一阶段明确不做什么

- 不使用 LangChain4j 编排核心循环。
- 不做 RAG、Embedding、向量数据库和长期 Memory。
- 不做多 Agent、任务规划器、并行 Tool Call 和后台自治任务。
- 不做通用问答、联网搜索、新闻、天气或百科助手。
- 不做服务端音频上传或语音模型；H5 只使用浏览器语音转文字。暂不做微信小程序、微信登录和复杂多用户权限。
- 不做周报、月报、人生质量评分和强主动建议。
- 不让模型直接访问 Repository 或拼 SQL；只能调用白名单 Tool。
- 不把完整 Tool trace 暴露给普通用户；开发环境可记录精简 trace。
- 不追求分钟级精确，也不强迫用户补齐 24 小时。
- 不在同一阶段同时重构前端、接真实模型、上数据库和迁移框架。

## 8. 每一步要学习的 Agent 知识

### 阶段 1：看懂当前固定流水线（已基本完成，难度：低）

任务：为现有 `LightweightLifeAgent` 补齐边界样例与测试，不改成框架。

学习：

- Agent 与普通 Service 流水线的区别。
- Prompt/规则输入、结构化输出和输出校验。
- 幻觉为什么必须被业务校验与错误兜底约束。
- Life Ontology 如何成为模型和业务之间的共同语言。

出口：能清楚解释当前代码为什么“像 Agent 工作流，但还没有 Agent loop 和 Tool”。

### 阶段 2：搭建最小可运行自定义 Agent（已完成，难度：中）

任务：实现 `AgentRuntime`、`AgentAction`、`ToolRegistry`、三个只读/写入 Tool、内存 `ConversationStore` 和 `maxSteps`。

学习：

- Agent 为什么需要循环。
- Tool 是带 Schema、边界和副作用语义的业务能力，不是随便一个 Java 方法。
- Agent 如何在最终回答和 Tool Call 之间选择。
- ToolResult 为什么要回填上下文再让模型继续判断。
- 对话状态、业务状态和长期 Memory 分别保存在哪里。
- 普通聊天、业务查询、业务指令和越界问题如何区分。

出口：至少跑通并测试三条路径：闲聊直接回复、记录调用写 Tool、查询调用读 Tool。

### 阶段 3：接入真实模型并建立可评估性（进行中，难度：中高）

已完成：用 DeepSeek 替换对话决策器，保留测试替身，并覆盖读 Tool 循环、三类写确认、边界拒答和协议解析。

待完成：建立固定真实样例集、精简 trace、成本观测和可控重试策略。

学习：

- System Prompt、Tool Schema 与结构化输出各自解决什么问题。
- 确定性参数、超时、重试、幂等和 Token/成本控制。
- 如何保存精简 trace，定位“模型选错 Tool”还是“Tool 执行错”。
- 如何用固定样例集评估意图、参数、Tool 选择、总结语气和边界拒答。
- 确认机制如何保护有副作用的操作。

出口：同一组评估用例可同时运行在规则版和真实模型版，失败原因可定位。

### 阶段 4：逐步迁移到 LangChain4j（难度：高）

前提：自定义 Runtime 已跑通，测试覆盖关键行为。迁移时不重写业务 Service 和 Tool。

迁移顺序：

1. 先用 LangChain4j 替代模型客户端与消息类型。
2. 再替代 Tool Schema 生成和 Tool Calling 适配。
3. 再评估是否用框架 Memory Store 替代 `ConversationStore`。
4. 最后才评估是否让框架接管 Agent loop；如果自定义循环更清晰，可以保留。

迁移对照：

| 概念 | 自定义版本 | LangChain4j 中的位置 |
|---|---|---|
| Agent | `AgentRuntime` + 决策器 + 终止规则 | AI Service / Agent 能力与调用编排 |
| Model | `LifeModelClient` / `AgentModel` | `ChatLanguageModel` / `ChatModel` 适配 |
| Tool | `LifeTool` + `ToolRegistry` | `@Tool` 或 Tool Specification |
| Memory | `ConversationStore` + 消息裁剪策略 | Chat Memory / Chat Memory Store |
| RAG | 第一阶段没有 | Retriever / Content Injector 等检索增强组件 |

学习重点不是“框架 API 怎么写”，而是逐项回答：哪段自定义代码被替代、框架替你承担了什么、哪些 Life Wallet 业务边界仍必须由自己维护。

出口：迁移前后运行同一组 Agent 评估用例，行为一致；能用 diff 解释被框架替代和仍保留的代码。

## 9. 推荐下一步

暂不直接迁移 LangChain4j。下一次编码只做阶段 2 的第一个垂直切片：

```text
POST /api/agent/chat
  → AgentRuntime（最多 4 步）
  → 规则决策器
  → get_today_record / create_life_record
  → 内存 ConversationStore
  → AgentResponse
```

完成这个切片后，再增加修改、反馈和真实模型。这样每新增一个能力，都能明确对应一个 Agent 知识点。
