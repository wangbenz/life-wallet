# Current Status

Status: Active
Stage: H5 Demo Validation
Last Updated: 2026-07-15
Owner: Human + Codex

## 当前目标

验证 Life Wallet 是否值得持续做，而不是继续扩充页面或功能。

当前核心假设：

1. 用户愿意用自然语言连续记录生活。
2. 用户基本接受 AI 对活动、维度和时长的理解。
3. “1 天 = 1 元人生”的反馈能帮助用户看见生活分布，并愿意回来。

## 已完成

### 前端 H5

- `Today｜Life｜Me` 三个真实响应式页面，不包含假手机框和假状态栏。
- Today：人生余额、自然语言记录、Mock 理解、预览修改、确认保存和准确度反馈。
- Life：只基于已确认记录生成洞察和历史回看，不展示假趋势、成就或连续打卡。
- Me：账户设置、本地数据导出 / 清除、隐私说明和体验反馈。
- Mock、账户、记录和反馈统一保存在前端与浏览器 `localStorage`，当前不请求后端。
- 视觉以“清爽小程序 + 温和生活手账”为准，使用 Lucide 功能图标和轻量微交互。

### 后端保留能力

- Spring Boot 人生账户、Today 记录、规则版轻量 Agent 和最近记录 API 已跑通。
- 当前展示版未接入这些 API；后端代码保留用于后续真实 Agent 与持久化演进。

### 测试与部署

- 前端 Mock 测试、TypeScript 和 Vite 生产构建通过。
- H5 已部署到京东云 Nginx，TCP `15173` 公网访问已验证。
- 发布、验证和回滚见 `docs/03-delivery/02-operations.md`。

## 当前边界

第一版只验证：

```text
人生余额
→ 自然语言记录
→ AI 理解与估算
→ 用户确认
→ 人生支出反馈
→ 近期洞察
```

暂不做微信小程序、登录、多用户、支付、社交、打卡成就、复杂 Memory、RAG、向量数据库和强建议型人生教练。

## 下一步

1. 邀请 5-10 个目标用户完成 7 个记录日验证。
2. 记录完成率、单次记录成本、解析准确度反馈和第 7 个记录日回访意愿。
3. 根据真实反馈调整 Today / Life / Me，不用假数据填充页面。
4. 需要跨用户汇总反馈时，再接入后端、鉴权和持久化。
5. 用户明确要求 Agent 实现时，按 `docs/02-architecture/04-agent-design.md` 开始最小自定义 Agent vertical slice。

## 活跃事实源

- 产品边界：`docs/01-product/03-product-definition.md`
- 领域分类：`docs/01-product/08-life-ontology.md`
- 系统与 API：`docs/02-architecture/`
- Agent：`docs/02-architecture/04-agent-design.md`
- 任务：`docs/03-delivery/01-task-breakdown.md`
- 运行与部署：`docs/03-delivery/02-operations.md`
- 历史材料：`docs/archive/`
