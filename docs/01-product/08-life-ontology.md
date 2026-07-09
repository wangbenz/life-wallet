# Life Ontology（人生本体模型）草案

Status: Draft
Stage: Product Discovery
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 目标

定义 Life Wallet 如何理解“人生”。

本文件用于回答：

- 什么算作人生中的一个 Activity？
- Activity 如何归入 Life Dimension？
- Domain 和 Topic 如何演化？
- 系统是否理解人生质量、满意度、价值感？
- AI Agent 的能力边界在哪里？

Session 002 后，本文件成为下一阶段 Product Discovery 的默认主题。

需要重点回答：

1. 什么是一次 Activity？
2. 什么事情值得记录？
3. 一天如何定义？
4. Life Dimension 最终有哪些？
5. Domain 如何演化？
6. Memory 如何形成？
7. Agent 如何利用长期 Memory 生成 Insight？

## 当前已确定

### Life Unit

```text
1 day = 1 life coin
```

每天固定消耗 1 元人生。

### Activity

Activity 是用户自然语言中可被 AI 识别的生活事件。

最小结构：

```json
{
  "title": "学习 Java",
  "duration": 120,
  "dimension": "成长",
  "domain": "代码",
  "topic": "Java"
}
```

### Life Dimension

固定维度：

- 成长
- 创造
- 关系
- 健康
- 生活
- 休闲
- 睡眠

## 待定义

### 1. Activity 边界

需要确定：

- 多细算一个 Activity？
- 没有明确时间的活动如何处理？
- 情绪、思考、发呆、陪伴是否算 Activity？

### 2. Life Quality

需要确定：

- 是否存在人生质量？
- 是否评分？
- 是否由用户主观评价？
- 是否由 AI 推断？

### 3. Memory

需要确定：

- 哪些事实进入长期记忆？
- 哪些趋势进入长期记忆？
- 记忆如何被用户查看、修正和删除？

### 4. Agent Boundary

需要确定：

- AI 只理解和总结，还是主动建议？
- AI 是否可以发现风险？
- AI 是否可以挑战用户的行为模式？

阶段性边界：

- 第一版 AI 以理解、分类、估算、总结和温和反馈为主。
- 不做心理诊断、治疗建议或危机干预。
- 不主动命令用户改变行为，不使用羞耻感或惩罚式表达。
- 不追求分钟级时间审计；对模糊记录可以估算，但应让用户知道这是估算。
- 不要求用户理解或配置 Dimension / Domain / Topic。

仍需继续确认：

- 用户主动询问“我该怎么调整”时，AI 可以回答到什么程度？
- AI 能否指出风险模式，例如长期睡眠不足、持续缺少关系投入？

Session 002 阶段性原则：

> Agent 的能力边界由用户当前 Context 决定，而不是由问题本身决定。

这意味着 Agent 不是通用聊天机器人，也不是百科或搜索引擎。它原则上不回答与用户人生记录无关的通识问题。

但如果问题与用户当前记录、目标、学习内容、工作内容、健康状态或长期 Memory 高度相关，Agent 可以提供简短、克制、面向成长的回答，并引导用户把相关内容纳入记录或复盘。

示例：

```text
昨天记录：今天学习 Java 两小时。
今天询问：HashMap 为什么线程不安全？
```

这种问题虽然属于 Java 通识知识，但因为它与用户当前学习上下文直接相关，Agent 可以简要回答，并进一步帮助用户整理学习记录或生成复盘建议。
