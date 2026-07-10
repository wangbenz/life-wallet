# Current Status

Status: Confirmed
Stage: MVP Coding Readiness / Architecture
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 1. 当前阶段

当前项目在完成 Product Discovery、Product Definition 草案和 H5 Demo MVP Design 草案后，根据 Session 002 重新打开 Product Discovery，并已完成进入代码前的最小边界确认。

当前不要开始做完整微信小程序，也不要扩大 MVP 范围。

当前目标是短平快进入第一版 H5 Agent Demo 的 Architecture、Task Breakdown 和 Coding。

当前已创建 Product Definition 草案：

- `docs/01-product/03-product-definition.md`

当前已创建概念验证方案草案：

- `docs/01-product/04-concept-validation-plan.md`

当前已创建 MVP Design 草案：

- `docs/01-product/05-mvp-design.md`

当前已创建 MVP Coding Readiness：

- `docs/01-product/06-mvp-coding-readiness.md`

当前已创建最小 Architecture / Delivery 文档：

- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/03-delivery/01-task-breakdown.md`

上一版 H5 Demo MVP Design 草案中的 `首页｜账单｜我的` 结构已被新的 Agent First 开工边界取代。后续实现以 `Today（Agent）｜Life（人生）｜Me（我的）` 为准。

当前阶段策略调整为：

```text
最终产品载体：微信小程序
产品核心：Agent First / AI Native
交互核心：用户 → Agent → Memory → Insight
下一步主题：H5 Agent Demo Coding
```

## 2. 当前主线

当前主线问题：

> Life Wallet 是否解决了一个真实、值得做、能持续使用的问题？

Session 002 后新增主线问题：

> Life Wallet 如何从“带 AI 的小程序”转向“以 Agent 为中心的人生产品”？

当前推进方式：

```text
先完成 Product Discovery
  ↓
再进入 Product Definition
  ↓
再进入 MVP Design
  ↓
再进入 Architecture
  ↓
最后进入 Coding
```

## 3. 已完成 / 初步完成

### 3.1 目标用户：初步完成

第一批目标用户初步聚焦为：

> 一二线城市上班族中，对生活需要数据化指标，并希望通过记录、分析和反馈来调整自己的人。

### 3.2 核心世界观：初步完成

每天固定消耗 1 元人生。

```text
1 天 = 1 元人生
24 小时 = 1 元人生
1 小时 = 1/24 元人生
```

“1 元人生”不是奖励系统，而是世界观入口与时间账户化表达。

### 3.3 首次打开动机：初步完成

用户首次进入时输入生日和预计寿命，系统生成人生账户余额，让用户直观看见人生时间不是无限的。

### 3.4 核心反馈闭环：初步完成

```text
人生余额冲击
  ↓
自然语言 / 语音记录一天
  ↓
AI Agent 自动分类
  ↓
换算为人生支出
  ↓
饼图展示 Life Dimension 占比
  ↓
个人支出排行展示具体支出方向
  ↓
日 / 周 / 月反馈帮助用户调整生活
```

### 3.5 留存反馈周期：初步完成

- 每日：即时理解今日 1 元人生如何被消耗。
- 每周：发现生活模式。
- 每月：形成阶段性人生画像。

### 3.6 视觉表达方向：初步完成

每日核心视觉表达采用 Life Dimension 饼图。

个人排行优先做“个人人生支出排行”，不是用户之间的社交排名。

### 3.7 用户高频使用场景：初步完成

理想场景是睡前复盘，但真实使用中用户可能会延迟记录、次日补录、分段记录或使用模糊时间表达。

阶段性结论：

> Life Wallet 不要求用户实时、精确记录，而是允许用户用自然语言补记生活片段；系统负责时间估算、分类和温和确认。

### 3.8 核心痛点优先级：初步完成

核心痛点优先级初步确定为：

1. 记录成本高
2. 分类困难
3. 难以坚持
4. 缺少长期理解

其中“记录成本高”是第一优先级。如果记录复杂，用户可能只打开一次就放弃，后续 AI 分类、统计、反馈、周报和月报都无法产生。

### 3.9 当前替代方案与不足：初步完成

当前替代方案包括备忘录、日记、时间管理 App、打卡工具、Notion / Excel、手机屏幕使用时间等。

阶段性机会判断：

> 低成本记录的工具不擅长统计，擅长统计的工具记录成本太高；Life Wallet 的机会，是用自然语言输入 + AI 自动理解，把记录成本和长期统计同时做好。

### 3.10 前 7 天留存：初步完成

新用户前 7 天不按自然周计算，而按“记录日”或“最近 7 天”计算。

第 7 个记录日生成“第一份最近 7 天人生账单”，不称为“本周账单”。

### 3.11 产品边界：初步完成

Life Wallet 第一版不做传统记账、任务管理、打卡习惯、精确时间审计、社交排名、心理治疗、强说教型人生教练或全量个人数据中台。

阶段性结论：

> Life Wallet 第一版只服务一个核心闭环：自然语言记录生活 → AI 理解和估算 → 生成人生支出反馈 → 帮助用户看见自己的生活分布。

### 3.12 关键假设：初步完成

当前最关键的验证问题是：

1. 用户是否愿意连续 7 个记录日留下自然语言记录。
2. 用户是否接受 AI 对模糊生活片段的分类和估算。
3. 用户是否觉得“人生账单”反馈值得第二天继续回来。

建议先用 5-10 个目标用户做 7 天手工验证，不急于开发完整系统。

### 3.13 进入 Definition 前缺什么：初步完成

从文档收束角度看，Product Discovery 的核心问题已经可以支撑进入 Product Definition 草案：

- 目标用户已初步聚焦。
- 高频使用场景已明确。
- 核心痛点优先级已排序。
- 替代方案与不足已分析。
- 首次打开动机和前 7 天留存路径已初步明确。
- 核心价值闭环和产品边界已明确。
- 关键假设和验证方式已列出。

但这不是说产品已经被真实市场验证。当前仍应保留以下 Discovery 风险：

1. 目标用户是否真的愿意连续 7 个记录日自然语言记录。
2. 用户是否信任 AI 对模糊时间和生活片段的估算。
3. “1 元人生 / 人生账单”是否带来持续理解，而不是一次性冲击。
4. 温和反馈是否足够有价值，能否避免说教和焦虑。

阶段性判断：

> Product Discovery 可以在文档层面阶段性收束，下一步可以进入 Product Definition 草案；真实用户验证结果应作为后续 Definition / MVP Design 的重要输入。

### 3.14 Agent First 产品方向：已确认

Session 002 确认：

> Life Wallet 不是“带 AI 的小程序”，而是一个以 Agent 为中心的人生产品。微信小程序只是载体。

产品核心从传统页面流：

```text
首页 → 记录 → 统计 → 我的
```

调整为：

```text
用户 → Agent → Memory → Insight
```

### 3.15 Agent 作为产品主入口：已确认

Agent 不只是聊天机器人，而是产品主入口。

用户进入产品后，不应先寻找“记录按钮”，而是直接向 Agent 表达今天发生了什么、最近怎么样、想复盘什么。

### 3.16 页面方向：待重新设计

上一版 H5 Demo 的 `首页｜账单｜我的` 结构仍偏传统小程序。

新的原型方向建议为：

```text
Today（Agent）｜Life（人生）｜Me（我的）
```

- Today：人生余额、今日记录、Agent 对话、AI 理解、今日总结。
- Life：长期趋势、Memory、人生画像、Insight、时间轴。
- Me：生日、预期寿命、AI 设置、数据管理。

### 3.17 Dashboard 降级，Insight 升级：已确认

Dashboard、统计图、饼图、折线图不是核心价值。

AI Native 产品的核心应是：

```text
用户提问 / 自然表达
  ↓
Agent 基于记录和 Memory 生成 Insight
```

图表是辅助，Insight 才是价值。

### 3.18 Agent 边界：已确认

Agent 不定位为通用聊天机器人，不做百科、搜索引擎或万能助手。

Agent 的职责始终围绕：

```text
理解人生
```

Agent 能力边界由用户当前人生上下文 Context 决定，而不是由问题字面类型决定。

例如：

- 用户最近记录了 Java 学习，询问 Java 学习相关问题，可以简要回答并引导记录。
- 用户提出与当前人生上下文无关的通识问题，应礼貌说明更适合通用 AI 助手。

### 3.19 Life Ontology v0.1：Activity 基础规则已确认

当前已确认第一版 Activity 规则：

- Activity 是用户生活中可被记录、理解、归类的一段行为或状态。
- 值得记录的不是所有事情，而是会影响用户理解一天的事情。
- 太碎的动作默认不单独成 Activity，除非用户明确表达它有特殊意义。
- 一天的归属优先尊重用户自然表达，记录时间不等于发生时间。
- 第一版不做分钟级审计，也不要求用户把一天补齐为 24 小时。

详细规则见：

- `docs/01-product/08-life-ontology.md`

## 4. Discovery Checklist 状态

| 序号 | 项目 | 当前状态 | 说明 |
|---|---|---|---|
| 1 | 目标用户 | 初步完成 | 一二线城市数据化生活上班族 |
| 2 | 用户高频场景 | 初步完成 | 支持睡前复盘、延迟记录、补录、分段记录和模糊时间表达 |
| 3 | 核心痛点 | 初步完成 | 第一优先级为记录成本高，其次是分类困难、难坚持、缺少长期理解 |
| 4 | 当前替代方案 | 初步完成 | 已分析备忘录、日记、时间管理、打卡、Notion / Excel、屏幕时间等 |
| 5 | 替代方案不足 | 初步完成 | 低成本工具不擅长统计，强统计工具记录成本太高 |
| 6 | 首次打开动机 | 初步完成 | 生日 + 预计寿命 + 人生账户余额 |
| 7 | 前 7 天留存原因 | 初步完成 | 按记录日推进：第 2 个记录日看单日反馈，第 3 个记录日看短期对比，第 7 个记录日看最近 7 天账单 |
| 8 | 30 天留存原因 | 初步完成 | 日 / 周 / 月反馈、长期画像 |
| 9 | 核心价值闭环 | 初步完成 | 记录 → AI 理解 → 统计 → 反馈 → 调整 |
| 10 | 产品边界 | 初步完成 | 不做记账、任务、打卡、精确时间审计、社交排名、心理治疗和全量数据中台 |
| 11 | 关键假设 | 初步完成 | 优先验证连续自然语言记录、AI 模糊估算可信度、人生账单回访价值 |
| 12 | 进入 Definition 前缺什么 | 初步完成 | 文档层面可阶段性收束；真实用户验证风险继续保留 |

## 5. 当前正在进行

当前已完成 Milestone 1-5：项目骨架、人生账户、Today 记录、轻量 Life Agent 和今日人生账单。

不要继续扩大 Product Discovery。下一步进入 Milestone 6：反馈与测试环境。

## 6. 下一步应该讨论

下一步建议按顺序推进：

1. Milestone 6：用户反馈。
2. 保存“准确 / 一般 / 不准”反馈并在 Today 页提供入口。
3. 增加基础错误处理。
4. 准备 H5 Demo 测试环境部署方式。

## 7. 新会话接手指令

如果在 Codex 中新开会话，请先阅读：

- `AGENTS.md`
- `README.md`
- `docs/01-product/00-current-status.md`
- `docs/01-product/02-product-discovery.md`
- `docs/01-product/03-product-definition.md`
- `docs/01-product/04-concept-validation-plan.md`
- `docs/01-product/05-mvp-design.md`
- `docs/01-product/06-mvp-coding-readiness.md`
- `docs/01-product/08-life-ontology.md`
- `docs/01-product/09-discovery-questions.md`
- `docs/02-architecture/01-technical-architecture.md`
- `docs/02-architecture/03-api-design.md`
- `docs/03-delivery/01-task-breakdown.md`
- `docs/04-governance/01-decision-log.md`

然后基于 `docs/03-delivery/01-task-breakdown.md` 继续第一版 H5 Agent Demo 实现。

默认下一题：

> 开始 Milestone 6：反馈与测试环境。
