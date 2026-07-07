# Life Ontology（人生本体模型）草案

## 目标

定义 Life Wallet 如何理解“人生”。

本文件用于回答：

- 什么算作人生中的一个 Activity？
- Activity 如何归入 Life Dimension？
- Domain 和 Topic 如何演化？
- 系统是否理解人生质量、满意度、价值感？
- AI Agent 的能力边界在哪里？

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
