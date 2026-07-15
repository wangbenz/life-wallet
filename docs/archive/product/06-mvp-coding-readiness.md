# MVP Coding Readiness

Status: Confirmed
Stage: MVP Coding Readiness
Last Updated: 2026-07-09
Owner: Human + ChatGPT + Codex

## 1. 目标

本文件用于明确 Life Wallet 第一版进入代码阶段前的最小边界。

阶段原则：

> 不再继续扩大 Product Discovery。先做一个短平快的 H5 Agent Demo，用真实可运行产品验证核心体验。

## 2. 第一版一句话

第一版先做一个 H5 Agent Demo：

> 用户设置生日和预期寿命后，在 Today 页和 Agent 对话记录今天，系统解析 Activity、分类、生成今日人生账单和总结；Life / Me 只做最小可用。

## 3. 第一版载体

最终产品目标仍然是微信小程序。

当前第一版先采用 H5 Demo：

- 更快开发。
- 更快部署测试环境。
- 更容易发链接给用户体验。
- 不依赖微信审核、体验版、测试成员和真机调试。

## 4. 第一版页面

底部结构：

```text
Today（Agent）｜Life（人生）｜Me（我的）
```

第一版优先级：

1. Today：核心页面，必须完成。
2. Me：生日和预期寿命设置，必须完成。
3. Life：轻量历史 / 占位，可以极简。

## 5. 第一版 Agent 能力

必须做：

- 接收用户自然语言记录。
- 识别用户意图：记录今天 / 修改记录 / 查看总结。
- 抽取 Activity。
- 估算时长。
- 归入 Life Dimension。
- 生成今日总结。
- 让用户确认或重新生成。

暂不做：

- 复杂长期 Memory。
- RAG。
- 多工具调用。
- 主动推送。
- 通用问答。
- 周报 / 月报。

## 6. 第一版数据

必须存：

- 用户生日。
- 用户预期寿命。
- 每日记录原文。
- AI 解析出的 Activity。
- Life Dimension 分类。
- 今日总结。
- 用户对解析结果的简单反馈。

暂不存：

- 复杂画像。
- 完整长期 Memory。
- 向量数据。
- 外部数据源。

## 7. 第一版技术路线

建议技术路线：

- Frontend：H5。
- Backend：Spring Boot。
- Database：MySQL。
- Cache：暂不引入，必要时后续加 Redis。
- AI：先封装简单 LLM 调用。
- Agent：自定义轻量 Life Agent 工作流。

第一版不使用 LangChain4j 做核心 Agent 编排。

## 8. 进入代码阶段的条件

以下条件满足后，可以进入代码阶段：

- 第一版产品边界已确认。
- 技术架构最小版已确认。
- API 设计最小版已确认。
- 任务拆分已确认。

## 9. 当前结论

当前可以进入 Architecture 和 Task Breakdown。

完成最小架构和任务拆分后，即可开始第一版代码实现。
