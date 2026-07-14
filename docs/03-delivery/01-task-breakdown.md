# Task Breakdown

Status: Active
Stage: H5 Demo Coding / Frontend Prototype Validation
Last Updated: 2026-07-14
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
预览并确认今日人生账单
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
- 早期联调阶段曾配置 Vite `/api` 代理并验证前后端健康检查；当前独立前端 Mock 模式已移除该代理。
- 已验证后端测试、前端构建和两端独立启动。

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
- 当前前端通过 Mock 函数和 `localStorage` 读写账户；后端账户 API 保留但未被当前原型调用。

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
- 当前前端提交记录后先显示短暂理解状态，再根据关键词和时长表达生成不同的本地 Mock 结果；只有用户确认后才写入本地记录。

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

Status: Done

- 保存解析结果。
- 计算 Dimension 汇总。
- 计算人生支出占比。
- Today 页展示今日总结和主要 Activity。
- Life 页展示最近记录的极简列表。

验收：

- 用户提交记录后，可以看到今日人生账单。
- 刷新页面后记录仍存在。

完成记录：

- 后端已保存每条记录对应的 Agent 解析结果，并提供 `GET /api/life/recent-records` 返回最近 10 条记录。
- Life 页已展示最近记录的日期、Agent 总结、主要维度和 Activity 数量。
- 前端启动时会重新读取 Today 记录和最近记录；提交新记录后会立即同步到 Life 页。
- 当前 Demo 使用进程内存存储，浏览器刷新可恢复记录；服务重启后的长期持久化留待测试环境引入 MySQL 时完成。
- 当前独立前端 Mock 原型改用浏览器 `localStorage` 恢复账户和已确认记录，不依赖后端进程。

## 7. Frontend Prototype：独立 Mock 与第一轮原型强化

Status: Done

目标：

- 前端可脱离后端独立运行，快速验证视觉和核心交互。
- 页面使用真实 H5 响应式布局，不绘制假手机框和假系统状态栏。
- Today、Life、Me 三页形成可完整演示的原型。

完成记录：

- 新增 `frontend/src/mock/data.ts`，集中提供账户、记录预览、确认保存、今日记录和最近记录的 Promise Mock 函数。
- 移除当前前端的后端 `fetch` 依赖和 Vite API 代理。
- Today 已实现人生余额说明、快捷记录、AI 理解提示、账单预览、回填修改和确认保存。
- Life 已实现概览、趋势、时间轴和成就四个子页面。
- Me 已实现小程序风格的个人信息、数据摘要、账户设置、AI 提醒和数据服务入口。
- 已统一 SVG 图标、卡片、底部导航和绿色视觉体系，并完成移动视口无横向溢出检查。
- 已通过 TypeScript 与 Vite 生产构建验证。

历史边界说明：

- 第一轮 Mock 分析结果曾是固定数据，仅用于 UI 验证；Milestone 6A 已升级为轻量关键词和时长解析，但仍不代表真实 Agent 准确率。
- 当前前端不代表真实 Agent、Memory 或长期趋势统计已经完成。
- 后端现有代码没有删除，后续根据用户反馈决定重新接入时机。

## 8. Milestone 6：反馈与测试环境

Status: In Progress

### 6A：前端产品收缩与本地反馈

Status: Done

- 删除成就、连续打卡、固定统计和无真实数据支撑的趋势页面。
- Life 收敛为“洞察 / 记录”，全部内容从本地已确认记录计算。
- 修正人生币换算，明确已记录时间与未记录时间。
- Today 页面提供“准确 / 部分准确 / 不准确”反馈并保存到本地。
- Me 只保留账户、数据管理、隐私说明和反馈能力。
- 增加真实空状态、基础错误处理和核心交互测试。

完成记录：

- 已删除成就、连续打卡、固定统计和假长期趋势。
- Life 已收敛为“洞察 / 记录”，阶段信息按真实记录日逐步出现。
- 人生币统一按 `活动分钟数 / 1440` 换算，页面同时说明不要求补齐全天。
- Today 已支持记录日期、表达提示、多行输入、预览编辑、同日多段记录、历史修正和准确度反馈。
- Me 已收敛为账户、隐私说明、本地 JSON 导出、二次确认清除和本地反馈。
- 已新增前端 Mock 分析测试，并完成生产构建、移动视口无横向溢出和核心浏览器交互验证。

### 6B：测试环境与后端反馈（后续）

- 准备测试环境部署方式。
- 外部测试需要服务端汇总时，再实现反馈 API。
- 根据验证结果决定是否恢复前后端集成。

验收：

- 用户可以提交并在刷新后保留反馈。
- Life 不展示与真实记录矛盾的长期统计。
- 成就和连续打卡不再进入首版页面。
- Demo 可以部署到测试环境供外部体验。

## 9. 第一版不做

- 微信小程序。
- 微信登录。
- 周报 / 月报。
- 复杂 Memory。
- RAG。
- 向量数据库。
- Redis。
- 支付。
- 多用户权限系统。

## 10. 推荐推进顺序

1. 完成 Milestone 6A 的前端产品收缩和本地反馈闭环。
2. 用 5-10 个目标用户验证 7 个记录日的核心闭环。
3. 准备可分享的 H5 测试环境。
4. 根据验证结果继续调整 Today / Life / Me。
5. 再决定前端重新接入现有后端 API 的范围与顺序。
6. 用户明确要求 Agent 实现时，推进最小自定义 Agent vertical slice。
