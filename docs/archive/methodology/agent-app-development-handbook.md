# Agent 应用从 Idea 到落地开发参考手册

> 适用场景：使用 ChatGPT、Codex、Claude Code 等 AI / Agent 工具，将一个产品 idea 逐步开发成可落地应用。  
> 适用对象：个人开发者、AI 应用学习者、产品负责人、使用 AI 编程工具进行项目开发的人。  
> 当前版本：v1.0

---

## 1. 文档目的

本文档用于建立一套稳定、统一、可复用的 Agent 应用开发流程与文档规范。

它解决的问题是：

- 从一个模糊 idea 到可落地应用，中间应该经历哪些阶段；
- 每个阶段应该产出哪些文档；
- 文档如何命名，如何归档；
- Codex / Claude Code 应该在什么时候介入；
- 如何避免 AI 编程工具因为上下文混乱而写出不可控代码；
- 如何让项目后续可以持续迭代、回溯和交接。

本文档可以作为实际开发中的项目参考手册，也可以直接放入项目仓库中，作为团队或 AI Agent 的长期上下文。

推荐路径：

```text
docs/00-handbook/00-agent-app-development-handbook.md
```

---

## 2. 核心结论

Agent 应用开发不应该是：

```text
一句 idea
  ↓
直接让 Codex / Claude Code 写代码
```

更合理的流程应该是：

```text
Idea（灵感）
  ↓
Product Discovery（产品发现）
  ↓
Product Definition（产品定义）
  ↓
MVP Design（MVP 设计）
  ↓
Architecture（架构设计）
  ↓
Coding（编码）
  ↓
Testing（测试）
  ↓
Deployment（部署）
  ↓
Iteration（迭代）
```

其中：

```text
流程阶段 = 项目的推进路径
文档体系 = 每个阶段的沉淀产物
Codex / Claude Code = 编码阶段的执行工具
ChatGPT = 需求澄清、文档整理、架构讨论、任务拆解工具
人 = 最终决策者、验收者、方向控制者
```

---

## 3. 开发总原则

### 3.1 文档先行

在 Agent 应用开发中，文档不是形式主义，而是 AI 工具的上下文来源。

没有稳定文档，Codex / Claude Code 容易出现：

- 不理解产品目标；
- 自行扩大需求边界；
- 修改无关代码；
- 重复设计；
- 前后实现不一致；
- 后续交接困难。

因此，开发前必须先沉淀文档。

---

### 3.2 小步开发

不要一次性让 AI 编程工具完成整个应用。

错误示例：

```text
帮我做一个完整的 AI 知识管理应用。
```

推荐示例：

```text
请阅读 docs/03-delivery/01-task-breakdown.md。
现在只实现“新增记录接口”。
要求：
1. 不要实现其他功能；
2. 保持 Controller / Service / Repository 分层；
3. 使用统一返回结构；
4. 完成后运行测试；
5. 总结修改了哪些文件。
```

---

### 3.3 每步可运行、可测试、可回滚

每一轮开发都应该满足：

```text
任务明确
改动范围明确
可以运行
可以测试
可以 review
可以回滚
```

不要让 AI 一次性生成大量不可控代码。

---

### 3.4 人负责决策，Agent 负责执行

合理分工：

```text
人：
负责方向判断、产品取舍、最终验收。

ChatGPT：
负责需求讨论、产品梳理、文档沉淀、架构讨论、任务拆解。

Codex / Claude Code：
负责根据文档进行代码实现、测试补充、bug 修复、重构。

项目文档：
负责保存稳定上下文，让人和 Agent 保持一致。
```


---

### 3.5 <span style="color:#1a73e8">阶段出口标准（Exit Criteria）</span>

<span style="color:#1a73e8">每个阶段不仅要有输出文档，还必须有明确的出口标准。只有满足出口标准后，项目才可以进入下一阶段。</span>

<span style="color:#1a73e8">推荐规则：</span>

```text
Idea 阶段完成：
- 项目名称初步确定
- 一句话描述初步确定
- 想法来源明确
- 初步目标用户和问题已记录

Product Discovery 阶段完成：
- 目标用户明确
- 高频使用场景明确
- 核心痛点排序明确
- 当前替代方案明确
- 替代方案不足明确
- 产品机会明确
- 关键假设明确
- 仍需验证的问题已记录

Product Definition 阶段完成：
- 产品定位明确
- 核心价值明确
- 产品边界明确
- 第一版做什么 / 不做什么明确
- 成功标准明确

MVP Design 阶段完成：
- MVP 目标明确
- 必须有 / 应该有 / 以后做 / 明确不做的功能已拆分
- MVP 要验证的问题明确
- MVP 成功标准明确

Architecture 阶段完成：
- 技术栈明确
- 系统模块明确
- 数据模型明确
- API 设计明确
- Agent 能力边界明确
- 任务拆解可以执行
```

<span style="color:#1a73e8">如果出口标准没有满足，不应进入下一阶段，尤其不应进入 Coding。</span>

---

### 3.6 <span style="color:#1a73e8">文档状态规范</span>

<span style="color:#1a73e8">每份核心文档建议在开头维护状态信息，避免把临时想法误认为最终结论。</span>

```markdown
Status: Draft / In Review / Confirmed / Deprecated
Stage: Idea / Product Discovery / Product Definition / MVP Design / Architecture / Coding
Last Updated: YYYY-MM-DD
Owner: Human / ChatGPT / Codex / Claude Code
```

<span style="color:#1a73e8">状态含义：</span>

```text
Draft：草稿，可大幅修改
In Review：正在评审，内容基本成型
Confirmed：已经确认，后续变更需要记录到 Decision Log
Deprecated：已废弃，仅保留历史上下文
```

---

### 3.7 <span style="color:#1a73e8">Decision 类型规范</span>

<span style="color:#1a73e8">Decision Log 建议标注决策类型，方便后续回溯。</span>

```text
Product Decision：产品方向、目标用户、核心价值、功能边界
UX Decision：交互方式、页面表达、用户反馈机制
Agent Decision：Agent 角色、能力边界、Prompt、Memory、工具调用
Architecture Decision：系统架构、模块边界、技术路线
Data Decision：数据结构、存储策略、分类体系
Technical Decision：框架、依赖、工程实现方式
Governance Decision：流程、文档、协作规则
```

---

### 3.8 <span style="color:#1a73e8">Agent 应用专属文档补充</span>

<span style="color:#1a73e8">Agent 应用除了普通产品和技术文档，还建议在进入架构阶段后补充以下文档：</span>

```text
docs/02-architecture/05-prompt-design.md
docs/02-architecture/06-memory-design.md
docs/02-architecture/07-agent-evaluation.md
```

<span style="color:#1a73e8">用途：</span>

```text
prompt-design.md：记录 Prompt 结构、版本、输入输出样例和禁止行为
memory-design.md：记录短期记忆、长期记忆、用户可见性、删除和修正规则
agent-evaluation.md：记录如何评估 AI 输出质量，包括分类准确性、总结质量、稳定性和失败兜底
```

<span style="color:#1a73e8">如果项目高度依赖 AI 输出，这三类文档不应省略。</span>


---

## 4. 统一项目目录规范

项目根目录固定采用如下结构：

```text
project-name/
  README.md
  AGENTS.md
  CLAUDE.md

  docs/
    00-handbook/
      00-agent-app-development-handbook.md

    01-product/
      01-idea.md
      02-product-discovery.md
      03-product-definition.md
      04-prd.md
      05-mvp-design.md
      06-user-flow.md
      07-page-design.md

    02-architecture/
      01-technical-architecture.md
      02-data-model.md
      03-api-design.md
      04-agent-design.md
      05-prompt-design.md
      06-memory-design.md
      07-agent-evaluation.md

    03-delivery/
      01-task-breakdown.md
      02-test-plan.md
      03-deployment-plan.md
      04-release-plan.md

    04-governance/
      01-decision-log.md
      02-change-log.md
      03-risk-log.md
```

后续所有文档均按此结构维护，不再随意更改命名。

---

## 5. 根目录文件说明

### 5.1 README.md

`README.md` 是给人看的项目入口。

主要内容：

```text
项目是什么
项目当前阶段
如何启动
目录结构
主要文档入口
当前开发状态
```

---

### 5.2 AGENTS.md

`AGENTS.md` 是给 Codex 使用的项目规则文件。

它应该包含：

```text
项目简介
必须阅读的文档
开发规则
测试规则
禁止行为
任务执行规范
```

---

### 5.3 CLAUDE.md

`CLAUDE.md` 是给 Claude Code 使用的项目规则文件。

它应该包含：

```text
项目上下文
开发流程
必须阅读的文档
代码规范
禁止行为
任务执行方式
```

---

## 6. docs 目录分层说明

### 6.1 docs/00-handbook

路径：

```text
docs/00-handbook/
```

用途：

```text
存放通用方法论手册。
```

当前固定文档：

```text
docs/00-handbook/00-agent-app-development-handbook.md
```

这个文档不属于某个具体功能，而是整个项目开发方法的总说明。

---

### 6.2 docs/01-product

路径：

```text
docs/01-product/
```

用途：

```text
存放产品侧文档。
```

对应阶段：

```text
Idea
Product Discovery
Product Definition
MVP Design
```

固定文档：

```text
01-idea.md
02-product-discovery.md
03-product-definition.md
04-prd.md
05-mvp-design.md
06-user-flow.md
07-page-design.md
```

---

### 6.3 docs/02-architecture

路径：

```text
docs/02-architecture/
```

用途：

```text
存放技术架构侧文档。
```

对应阶段：

```text
Architecture
```

固定文档：

```text
01-technical-architecture.md
02-data-model.md
03-api-design.md
04-agent-design.md
```

---

### 6.4 docs/03-delivery

路径：

```text
docs/03-delivery/
```

用途：

```text
存放开发交付侧文档。
```

对应阶段：

```text
Coding
Testing
Deployment
Release
```

固定文档：

```text
01-task-breakdown.md
02-test-plan.md
03-deployment-plan.md
04-release-plan.md
```

---

### 6.5 docs/04-governance

路径：

```text
docs/04-governance/
```

用途：

```text
存放项目治理文档。
```

用于记录：

```text
关键决策
变更历史
风险事项
```

固定文档：

```text
01-decision-log.md
02-change-log.md
03-risk-log.md
```

---

## 7. 阶段与文档对应关系

| 阶段顺序 | 阶段名称 | 说明 | 输出文档 |
|---|---|---|---|
| 0 | Handbook | 通用开发方法论 | `docs/00-handbook/00-agent-app-development-handbook.md` |
| 1 | Idea | 灵感阶段 | `docs/01-product/01-idea.md` |
| 2 | Product Discovery | 产品发现 | `docs/01-product/02-product-discovery.md` |
| 3 | Product Definition | 产品定义 | `docs/01-product/03-product-definition.md` |
| 4 | PRD | 产品需求说明 | `docs/01-product/04-prd.md` |
| 5 | MVP Design | 最小可用版本设计 | `docs/01-product/05-mvp-design.md` |
| 6 | User Flow | 用户流程 | `docs/01-product/06-user-flow.md` |
| 7 | Page Design | 页面设计 | `docs/01-product/07-page-design.md` |
| 8 | Architecture | 技术架构 | `docs/02-architecture/01-technical-architecture.md` |
| 9 | Data Model | 数据模型 | `docs/02-architecture/02-data-model.md` |
| 10 | API Design | 接口设计 | `docs/02-architecture/03-api-design.md` |
| 11 | Agent Design | Agent 能力设计 | `docs/02-architecture/04-agent-design.md` |
| 12 | Prompt Design | 提示词设计 | `docs/02-architecture/05-prompt-design.md` |
| 13 | Memory Design | 记忆设计 | `docs/02-architecture/06-memory-design.md` |
| 14 | Agent Evaluation | Agent 输出评估 | `docs/02-architecture/07-agent-evaluation.md` |
| 15 | Task Breakdown | 任务拆解 | `docs/03-delivery/01-task-breakdown.md` |
| 16 | Test Plan | 测试计划 | `docs/03-delivery/02-test-plan.md` |
| 17 | Deployment Plan | 部署计划 | `docs/03-delivery/03-deployment-plan.md` |
| 18 | Release Plan | 发布计划 | `docs/03-delivery/04-release-plan.md` |
| 19 | Decision Log | 决策记录 | `docs/04-governance/01-decision-log.md` |
| 20 | Change Log | 变更记录 | `docs/04-governance/02-change-log.md` |
| 21 | Risk Log | 风险记录 | `docs/04-governance/03-risk-log.md` |

---

## 8. 文档命名规范

### 8.1 统一使用英文文件名

推荐：

```text
product-discovery.md
technical-architecture.md
task-breakdown.md
deployment-plan.md
```

不推荐：

```text
产品发现.md
技术架构.md
任务拆解.md
部署计划.md
```

原因：

```text
英文文件名更适合 Git、命令行、AI 工具、跨平台环境。
```

---

### 8.2 目录编号表示模块顺序

固定目录：

```text
00-handbook
01-product
02-architecture
03-delivery
04-governance
```

目录编号表示大的知识模块，不随具体文档增减轻易变化。

---

### 8.3 文件编号只在当前目录内排序

例如：

```text
docs/01-product/01-idea.md
docs/01-product/02-product-discovery.md
```

不要全局从 `01` 排到 `18`。

原因：

```text
方便后续在某个目录内部插入新文档，不影响其他目录。
```

---

### 8.4 固定文档名，不随讨论变化

以下命名固定使用：

```text
idea.md
product-discovery.md
product-definition.md
prd.md
mvp-design.md
user-flow.md
page-design.md
technical-architecture.md
data-model.md
api-design.md
agent-design.md
task-breakdown.md
test-plan.md
deployment-plan.md
release-plan.md
decision-log.md
change-log.md
risk-log.md
```

以下旧命名废弃：

```text
idea-brief.md
mvp-scope.md
pages.md
deploy.md
tech-architecture.md
```

---

## 9. 各阶段详细说明

## 9.1 Idea：灵感阶段

### 阶段目标

明确最初的想法是什么。

这个阶段回答：

```text
我想做什么？
为什么想到这个应用？
这个 idea 来自什么场景？
它大概解决什么问题？
```

### 不应该做什么

不要在这个阶段讨论：

```text
数据库表
接口设计
页面细节
部署方案
复杂 Agent 架构
```

### 输出文档

```text
docs/01-product/01-idea.md
```

### 推荐模板

```markdown
# Idea

## 1. 项目名称

## 2. 一句话描述

## 3. 想法来源

## 4. 初步目标用户

## 5. 可能解决的问题

## 6. 当前不确定的问题

## 7. 暂时不做的事情
```

---

## 9.2 Product Discovery：产品发现阶段

### 阶段目标

验证问题是否真实存在，明确用户、场景和痛点。

这个阶段回答：

```text
用户是谁？
用户在什么场景下遇到问题？
用户现在怎么解决？
现有方案为什么不够好？
这个问题是否值得做？
```

### 注意

Product Discovery 不是写功能，而是发现问题。

不要一开始就说：

```text
我要做一个分类功能。
```

应该先说：

```text
用户为什么需要分类？
用户现在分类失败的原因是什么？
分类对用户到底解决了什么问题？
```


### <span style="color:#1a73e8">Product Discovery Checklist</span>

<span style="color:#1a73e8">Product Discovery 阶段建议逐项核对，不要想到哪聊到哪。</span>

```text
1. 目标用户是谁？
2. 用户在什么高频场景下遇到问题？
3. 最核心痛点是什么？痛点优先级如何排序？
4. 用户现在用什么替代方案？
5. 替代方案为什么不够好？
6. 用户第一次打开产品的动机是什么？
7. 用户第 2 天、第 3 天、第 7 天为什么回来？
8. 用户连续使用 30 天的理由是什么？
9. 产品的核心价值闭环是什么？
10. 产品明确不做什么？
11. 哪些是假设，哪些是已确认结论？
12. 进入 Product Definition 前还缺什么证据？
```

<span style="color:#1a73e8">Discovery 的产出不是功能列表，而是对真实问题、目标用户、使用动机和产品机会的收束。</span>

### 输出文档

```text
docs/01-product/02-product-discovery.md
```

### 推荐模板

```markdown
# Product Discovery

## 1. 目标用户

## 2. 用户场景

## 3. 用户痛点

## 4. 当前替代方案

## 5. 替代方案的问题

## 6. 产品机会

## 7. 关键假设

## 8. 需要验证的问题

## 9. 暂定结论
```

---

## 9.3 Product Definition：产品定义阶段

### 阶段目标

把发现的问题转化成明确的产品定义。

这个阶段回答：

```text
这个产品到底是什么？
它不是什么？
它的核心价值是什么？
它的边界在哪里？
用户为什么要用它？
```

### Product Discovery 与 Product Definition 的区别

Product Discovery 关注：

```text
问题是否真实存在？
用户痛点是什么？
```

Product Definition 关注：

```text
我们要做一个什么产品来解决它？
产品边界是什么？
```

### 输出文档

```text
docs/01-product/03-product-definition.md
```

### 推荐模板

```markdown
# Product Definition

## 1. 产品定位

## 2. 核心用户

## 3. 核心价值

## 4. 核心使用场景

## 5. 产品边界

## 6. 核心功能

## 7. 非核心功能

## 8. 暂不支持的能力

## 9. 成功标准
```

---

## 9.4 PRD：产品需求说明

### 阶段目标

把产品定义进一步拆成可开发、可验收的需求。

PRD 不是随便列功能，而是要写清楚：

```text
功能是什么
谁使用
输入是什么
处理逻辑是什么
输出是什么
异常情况是什么
验收标准是什么
```

### 输出文档

```text
docs/01-product/04-prd.md
```

### 推荐模板

```markdown
# PRD

## 1. 背景

## 2. 目标

## 3. 用户角色

## 4. 功能模块

## 5. 功能详情

### 5.1 功能名称

#### 功能说明

#### 用户入口

#### 输入

#### 处理逻辑

#### 输出

#### 异常场景

#### 验收标准

## 6. 权限规则

## 7. 数据要求

## 8. 非功能要求
```

---

## 9.5 MVP Design：MVP 设计阶段

### 阶段目标

确定第一版最小可用产品。

MVP 的核心不是“功能少”，而是：

```text
用最少的功能验证产品核心价值。
```

### 常见错误

```text
第一版就做完整分类体系
第一版就做复杂 Agent
第一版就做多端同步
第一版就做完整权限系统
第一版就做运营后台
第一版就做过度精美 UI
```

### 输出文档

```text
docs/01-product/05-mvp-design.md
```

### 推荐模板

```markdown
# MVP Design

## 1. MVP 目标

## 2. 必须有的功能

## 3. 应该有的功能

## 4. 可以以后做的功能

## 5. 明确不做的功能

## 6. 第一版要验证的问题

## 7. 第一版成功标准
```

---

## 9.6 User Flow：用户流程

### 阶段目标

说明用户如何完成核心任务。

### 输出文档

```text
docs/01-product/06-user-flow.md
```

### 推荐模板

```markdown
# User Flow

## 1. 主流程

1. 用户进入首页
2. 用户创建记录
3. 用户输入内容
4. 用户触发 AI 整理
5. 系统生成结构化结果
6. 用户确认并保存
7. 用户查看历史记录

## 2. 异常流程

## 3. 空状态流程

## 4. 编辑流程

## 5. 删除流程
```

---

## 9.7 Page Design：页面设计

### 阶段目标

说明每个页面的目标、元素和交互。

### 输出文档

```text
docs/01-product/07-page-design.md
```

### 推荐模板

```markdown
# Page Design

## 1. 首页

### 页面目标

### 页面元素

### 用户操作

### 跳转关系

### 异常状态

## 2. 新增页

### 页面目标

### 页面元素

### 用户操作

### 异常状态

## 3. 详情页

### 页面目标

### 页面元素

### 用户操作

### 异常状态
```

---

## 9.8 Technical Architecture：技术架构

### 阶段目标

确定应用如何实现。

这个阶段才开始讨论：

```text
前端技术栈
后端技术栈
数据库
模型接入
系统模块
部署方式
日志
异常处理
安全策略
```

### 输出文档

```text
docs/02-architecture/01-technical-architecture.md
```

### 推荐模板

```markdown
# Technical Architecture

## 1. 技术栈

### 1.1 前端

### 1.2 后端

### 1.3 数据库

### 1.4 AI 模型

### 1.5 部署方式

## 2. 系统模块

## 3. 请求链路

## 4. 分层设计

## 5. 异常处理

## 6. 日志规范

## 7. 安全设计

## 8. 后续扩展点
```

---

## 9.9 Data Model：数据模型

### 阶段目标

定义数据如何存储。

### 输出文档

```text
docs/02-architecture/02-data-model.md
```

### 推荐模板

```markdown
# Data Model

## 1. 数据表列表

## 2. 表结构详情

### 2.1 表名

#### 字段说明

#### 主键

#### 索引

#### 状态字段

#### 创建时间 / 修改时间

## 3. 表关系

## 4. 软删除策略

## 5. 数据一致性要求
```

---

## 9.10 API Design：接口设计

### 阶段目标

定义前后端、Agent、服务之间如何通信。

### 输出文档

```text
docs/02-architecture/03-api-design.md
```

### 推荐模板

```markdown
# API Design

## 1. 通用返回结构

## 2. 错误码规范

## 3. 接口列表

## 4. 接口详情

### 4.1 创建记录

POST /api/notes

#### 请求参数

#### 响应参数

#### 异常场景

#### 验收标准
```

---

## 9.11 Agent Design：Agent 设计

### 阶段目标

定义 AI / Agent 在应用中的角色、能力边界和输入输出。

Agent 应用不能只写“接入大模型”，而要明确：

```text
Agent 做什么
Agent 不做什么
输入是什么
输出是什么
什么时候需要用户确认
失败时怎么处理
是否调用工具
是否使用记忆
```

### 输出文档

```text
docs/02-architecture/04-agent-design.md
```

### 推荐模板

```markdown
# Agent Design

## 1. Agent 角色

## 2. Agent 能力边界

## 3. 输入

## 4. 输出

## 5. Prompt 结构

## 6. 工具调用

## 7. 记忆机制

## 8. 人工确认点

## 9. 禁止行为

## 10. 失败兜底策略
```

---

## 9.12 Task Breakdown：任务拆解

### 阶段目标

把需求拆成 Codex / Claude Code 可执行的小任务。

### 输出文档

```text
docs/03-delivery/01-task-breakdown.md
```

### 推荐模板

```markdown
# Task Breakdown

## 阶段一：项目初始化

- 初始化后端项目
- 初始化前端项目
- 配置数据库
- 配置启动脚本

## 阶段二：核心业务模块

- 创建数据库表
- 实现新增接口
- 实现查询接口
- 实现编辑接口
- 实现删除接口

## 阶段三：AI 能力

- 接入模型 API
- 实现 AI 整理能力
- 保存 AI 整理结果
- 增加失败兜底

## 阶段四：前端页面

- 首页
- 新增页
- 详情页
- 编辑页

## 阶段五：测试与部署

- 单元测试
- 接口测试
- 前后端联调
- 部署脚本
```

---

## 9.13 Test Plan：测试计划

### 阶段目标

定义如何验证应用质量。

Agent 应用至少需要：

```text
功能测试
接口测试
数据库测试
Prompt 测试
前后端联调测试
异常场景测试
部署后冒烟测试
```

### 输出文档

```text
docs/03-delivery/02-test-plan.md
```

### 推荐模板

```markdown
# Test Plan

## 1. 功能测试

## 2. 接口测试

## 3. 数据库测试

## 4. Prompt 测试

## 5. 前后端联调测试

## 6. 异常场景测试

## 7. 部署后冒烟测试
```

---

## 9.14 Deployment Plan：部署计划

### 阶段目标

定义应用如何部署和运行。

### 输出文档

```text
docs/03-delivery/03-deployment-plan.md
```

### 推荐模板

```markdown
# Deployment Plan

## 1. 部署环境

## 2. 环境变量

## 3. 构建命令

## 4. 启动命令

## 5. 数据库初始化

## 6. 日志查看

## 7. 健康检查

## 8. 回滚方案
```

---

## 9.15 Release Plan：发布计划

### 阶段目标

定义版本如何发布。

### 输出文档

```text
docs/03-delivery/04-release-plan.md
```

### 推荐模板

```markdown
# Release Plan

## 1. 发布版本

## 2. 发布范围

## 3. 发布内容

## 4. 发布前检查

## 5. 发布步骤

## 6. 发布后验证

## 7. 回滚方案
```

---

## 9.16 Decision Log：决策记录

### 阶段目标

记录项目关键决策，避免后续反复争论或遗忘上下文。

### 输出文档

```text
docs/04-governance/01-decision-log.md
```

### 推荐模板

```markdown
# Decision Log

## YYYY-MM-DD：决策标题

### 背景

### 备选方案

### 最终决策

### 决策原因

### 影响范围

### 后续待确认
```

### 示例

```markdown
## 2026-07-06：第一版暂不向用户暴露三级分类

### 背景

项目早期讨论中曾考虑使用三级分类结构管理用户内容。

### 备选方案

1. 第一版直接展示三级分类；
2. 第一版只展示一级 / 二级分类；
3. 内部保留三级结构，但前端暂不暴露。

### 最终决策

采用方案 3：内部可以预留层级结构，但第一版不让用户直接感知三级分类。

### 决策原因

三级分类会增加用户理解成本。第一版应该降低使用门槛，优先验证核心记录和 AI 整理能力。

### 影响范围

- 前端页面不展示复杂层级；
- 数据库可预留 parent_id；
- 后续版本可以逐步开放更复杂分类能力。

### 后续待确认

是否需要在第二版引入智能分类推荐。
```

---

## 9.17 Change Log：变更记录

### 阶段目标

记录项目文档、功能和代码的重要变化。

### 输出文档

```text
docs/04-governance/02-change-log.md
```

### 推荐模板

```markdown
# Change Log

## YYYY-MM-DD

### 变更内容

### 变更原因

### 影响范围

### 关联决策
```

---

## 9.18 Risk Log：风险记录

### 阶段目标

记录项目中的不确定性和风险。

### 输出文档

```text
docs/04-governance/03-risk-log.md
```

### 推荐模板

```markdown
# Risk Log

## 风险编号

## 风险描述

## 风险等级

## 可能影响

## 应对方案

## 当前状态
```


---

### 9.19 <span style="color:#1a73e8">Prompt Design：提示词设计</span>

<span style="color:#1a73e8">Agent 应用需要记录 Prompt 的结构、版本和评估样例，避免提示词散落在代码或聊天记录中。</span>

### 输出文档

```text
docs/02-architecture/05-prompt-design.md
```

### 推荐模板

```markdown
# Prompt Design

## 1. Prompt 目标

## 2. 输入变量

## 3. 输出格式

## 4. System Prompt

## 5. Developer Prompt

## 6. Few-shot Examples

## 7. 禁止行为

## 8. 版本记录

## 9. 测试样例
```

---

### 9.20 <span style="color:#1a73e8">Memory Design：记忆设计</span>

<span style="color:#1a73e8">如果 Agent 需要长期理解用户，必须单独设计 Memory，而不是把所有历史记录都粗暴塞进上下文。</span>

### 输出文档

```text
docs/02-architecture/06-memory-design.md
```

### 推荐模板

```markdown
# Memory Design

## 1. 记忆目标

## 2. 短期记忆

## 3. 长期记忆

## 4. 用户画像

## 5. 记忆写入规则

## 6. 记忆读取规则

## 7. 用户可见、可编辑、可删除规则

## 8. 隐私和安全边界

## 9. 失败和回滚策略
```

---

### 9.21 <span style="color:#1a73e8">Agent Evaluation：Agent 评估</span>

<span style="color:#1a73e8">Agent 输出必须可评估。否则分类、总结、建议和记忆会逐渐失控。</span>

### 输出文档

```text
docs/02-architecture/07-agent-evaluation.md
```

### 推荐模板

```markdown
# Agent Evaluation

## 1. 评估目标

## 2. 分类准确性

## 3. 结构化完整性

## 4. 总结质量

## 5. 语气与边界

## 6. 失败兜底

## 7. 测试数据集

## 8. 人工 Review 规则

## 9. 回归测试规则
```


---

## 10. Codex / Claude Code 使用规范

### 10.1 什么时候使用 Codex / Claude Code

推荐在以下文档基本明确后再使用：

```text
docs/01-product/05-mvp-design.md
docs/02-architecture/01-technical-architecture.md
docs/02-architecture/03-api-design.md
docs/03-delivery/01-task-breakdown.md
```

也就是说，至少要明确：

```text
第一版做什么
技术怎么实现
接口怎么设计
任务怎么拆
```

---

### 10.2 不推荐的使用方式

```text
帮我做一个完整应用。
```

```text
你自由发挥，把这个项目写完。
```

```text
顺便把前端、后端、数据库、AI 都做了。
```

这些指令容易导致范围失控。

---

### 10.3 推荐的使用方式

```text
请先阅读以下文档：

- docs/01-product/05-mvp-design.md
- docs/02-architecture/01-technical-architecture.md
- docs/02-architecture/03-api-design.md
- docs/03-delivery/01-task-breakdown.md

现在只实现任务：
“新增记录接口”。

要求：
1. 不要实现其他任务；
2. 不要引入新的框架；
3. 保持现有分层结构；
4. 完成后运行测试；
5. 总结修改文件和测试结果。
```

---

## 11. AGENTS.md 标准模板

```markdown
# AGENTS.md

## Project Overview

This project is an Agent-powered application developed from idea discovery to MVP delivery.

The project follows this workflow:

Idea
→ Product Discovery
→ Product Definition
→ MVP Design
→ Architecture
→ Coding
→ Testing
→ Deployment
→ Iteration

## Required Reading

Before making code changes, read:

- docs/00-handbook/00-agent-app-development-handbook.md
- docs/01-product/01-idea.md
- docs/01-product/02-product-discovery.md
- docs/01-product/03-product-definition.md
- docs/01-product/05-mvp-design.md
- docs/02-architecture/01-technical-architecture.md
- docs/02-architecture/03-api-design.md
- docs/03-delivery/01-task-breakdown.md
- docs/04-governance/01-decision-log.md

## Development Rules

- Implement only the requested task.
- Do not introduce unrelated changes.
- Do not add new frameworks unless explicitly requested.
- Keep code structure consistent with the architecture document.
- Keep API responses consistent.
- Add or update tests when behavior changes.
- Run relevant tests after implementation when possible.
- Summarize changed files after each task.

## Review Rules

Before finishing, check:

- Does the code satisfy the requested task?
- Are there any unrelated changes?
- Are errors handled properly?
- Are logs meaningful?
- Are tests added or updated?

## Forbidden Actions

- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Do not remove existing features without explicit instruction.
- Do not hardcode secrets.
- Do not skip input validation.
```

---

## 12. CLAUDE.md 标准模板

```markdown
# CLAUDE.md

## Project Context

This project is an Agent-powered application developed from idea discovery to MVP delivery.

The project follows this workflow:

Idea
→ Product Discovery
→ Product Definition
→ MVP Design
→ Architecture
→ Coding
→ Testing
→ Deployment
→ Iteration

## Required Reading

Before coding, read:

- docs/00-handbook/00-agent-app-development-handbook.md
- docs/01-product/01-idea.md
- docs/01-product/02-product-discovery.md
- docs/01-product/03-product-definition.md
- docs/01-product/05-mvp-design.md
- docs/02-architecture/01-technical-architecture.md
- docs/02-architecture/03-api-design.md
- docs/03-delivery/01-task-breakdown.md
- docs/04-governance/01-decision-log.md

## Coding Guidelines

- Make small, focused changes.
- Do not rewrite large parts of the codebase without approval.
- Preserve existing architecture.
- Prefer simple implementation over over-engineering.
- Explain tradeoffs when there are multiple solutions.
- Run relevant tests after changes.
- Summarize changed files and test results.

## Forbidden Actions

- Do not silently change product scope.
- Do not introduce unrelated dependencies.
- Do not remove existing features without explicit instruction.
- Do not skip validation for user inputs.
- Do not hardcode secrets.
```

---

## 13. 推荐实际开发节奏

每一轮开发按照以下顺序：

```text
1. 讨论需求
2. 更新产品文档
3. 更新架构或接口文档
4. 拆解任务
5. 交给 Codex / Claude Code 实现一个小任务
6. 查看 diff
7. 运行测试
8. 手动体验
9. 记录 decision
10. 进入下一轮
```

不要跳过文档直接写代码。

不要一次性把太大范围交给 Agent。

不要让 Agent 自行扩大产品边界。

---

## 14. 当前阶段判断规则

如果项目还没有明确：

```text
目标用户是谁
核心痛点是什么
和现有工具的区别是什么
第一版 MVP 做什么
第一版不做什么
Agent 的能力边界是什么
数据结构是什么
接口是什么
```

那么项目不应该进入 Coding 阶段。

它大概率还处于：

```text
Product Discovery
```

或：

```text
Product Definition
```

阶段。

---

## 15. 第一阶段建议创建的文档

项目刚开始时，不需要一次性创建所有文档。

第一阶段只创建：

```text
README.md
AGENTS.md
CLAUDE.md
docs/00-handbook/00-agent-app-development-handbook.md
docs/01-product/01-idea.md
docs/01-product/02-product-discovery.md
```

原因：

```text
当前重点是明确 idea 和产品发现，不应过早进入架构和编码。
```

---

## 16. 后续推进顺序

固定按以下顺序推进：

```text
第 1 步：固定文档体系规范
第 2 步：生成 docs/00-handbook/00-agent-app-development-handbook.md
第 3 步：生成 docs/01-product/01-idea.md
第 4 步：生成 docs/01-product/02-product-discovery.md
第 5 步：继续讨论 Product Definition
第 6 步：进入 MVP Design
第 7 步：进入 Architecture
第 8 步：进入 Coding
第 9 步：Testing
第 10 步：Deployment
第 11 步：Iteration
```

---

## 17. 最终总结

Agent 应用开发的关键不是让 AI 尽快写代码，而是建立一套稳定、统一、可追溯的开发体系。

最终工作方式应该是：

```text
人负责判断方向；
ChatGPT 负责讨论和整理；
文档负责沉淀上下文；
Codex / Claude Code 负责实现；
测试和 review 负责保证质量；
Decision Log 负责保留关键决策。
```

本文档是整个项目的参考手册。

后续所有文档命名、目录结构、阶段划分、AI 工具使用方式，都应以本文档为准。
