# Current Status

Status: Active
Stage: H5 Demo Validation
Last Updated: 2026-07-24
Owner: Human + Codex

## 当前目标

验证 Life Wallet 是否值得持续做，而不是继续扩充页面或功能。

当前核心假设：

1. 用户愿意用自然语言连续记录生活。
2. 用户基本接受 AI 对活动、维度和时长的理解。
3. 剩余天数和已记录时长能帮助用户看见生活分布，并愿意回来。

## 已完成

### 前端 H5

- `Today｜Life｜Me` 三个真实响应式页面，不包含假手机框和假状态栏。
- Today：自然语言经后端规则服务生成预览，用户修改和确认后写入数据库；支持同日多段、历史补记、覆盖修改、删除和准确度反馈。
- Life Agent：通过自定义 Agent Runtime 和 DeepSeek Tool Calling 查询、新增、修改或删除数据库记录；写操作先生成待确认动作，用户确认后调用后端记录 API。
- Life：只基于已确认记录生成洞察和历史回看；低样本不强调精确画像，历史卡片突出 Agent 修改并收拢手动修正与删除。
- Me：账户设置、本地数据导出 / 清除、隐私说明，以及可保存并复制给体验邀请人的反馈。
- 账户、已确认记录、两类反馈和 Agent 对话均按安装级 `ownerKey` 保存在数据库；不迁移历史 `localStorage` 数据。
- Today 与 Life Agent 支持浏览器语音转文字；不支持时自动保留键盘输入，识别过程可能由浏览器或系统的在线服务完成。
- 视觉以“清爽小程序 + 温和生活手账”为准，使用 Lucide 功能图标、统一 H5 日期选择、44px 主要触控目标和轻量微交互。

### 后端 Agent 能力

- 新增 `POST /api/agent/chat`，包含最多 4 步的 Agent 循环、DeepSeek 模型适配、白名单 Tool、数据库会话和 `clientTurnId` 持久化幂等。
- 读 Tool 只能查询本轮客户端提供的记录快照；写 Tool 只能生成 `NEEDS_CONFIRMATION` 动作，不能绕过前端直接修改数据。
- 账户、Today 预览/确认、最近记录、反馈和清除 API 已被当前 H5 实际使用；规则版轻量解析与 DeepSeek 对话 Agent 各自承担明确流程。
- 已新增 Flyway V1 数据库迁移，覆盖账户、记录、活动、维度汇总、两类反馈、Agent 会话和轮次；本地默认使用文件型 H2，生产目标为 MySQL 8.4。
- H5 的账户、记录、反馈、导出和清除已接入后端；Agent 本轮最多携带 20 条必要记录字段。
- DeepSeek 密钥已支持 AES-256-GCM 加密入库与启动加载；首次配置或轮换通过受限导入文件完成，数据库只保存密文，独立主密钥仍由服务器文件保管。

### 测试与部署

- 后端 29 项迁移 / JDBC / 密钥 / Agent 测试、前端 14 项 API / 日历 / 规则测试、TypeScript 和 Vite 生产构建通过。
- 本版 H5、Spring Boot 后端和 MySQL 已部署到京东云测试环境，TCP `15173` 的页面与 `/api` 公网访问已验证；DeepSeek 密钥和 HTTPS 尚未配置。
- 发布、验证和回滚见 `docs/03-delivery/02-operations.md`。

## 当前边界

第一版只验证：

```text
剩余天数估算
→ 自然语言记录
→ AI 理解与估算
→ 用户确认
→ 已记录时长反馈
→ 近期洞察
```

已确认记录也可以通过 Life Agent 对话查询或发起修改 / 删除；这仍属于同一记录闭环，不扩展为通用问答。

暂不做微信小程序、登录、多用户、支付、社交、打卡成就、复杂 Memory、RAG、向量数据库和强建议型人生教练。

## 下一步

1. 邀请 5-10 个目标用户完成 7 个记录日验证。
2. 记录完成率、单次记录成本、解析准确度反馈和第 7 个记录日回访意愿。
3. 根据真实反馈调整 Today / Life / Me，不用假数据填充页面。
4. 为测试环境配置轮换后的 DeepSeek 密钥与 HTTPS，再验证真实语音和 Agent 稳定性。
5. 需要跨用户汇总反馈时，再增加鉴权和服务端持久化，不提前上传完整本地数据。

## 活跃事实源

- 产品边界：`docs/01-product/03-product-definition.md`
- 领域分类：`docs/01-product/08-life-ontology.md`
- 系统与 API：`docs/02-architecture/`
- Agent：`docs/02-architecture/04-agent-design.md`
- 任务：`docs/03-delivery/01-task-breakdown.md`
- 运行与部署：`docs/03-delivery/02-operations.md`
- 历史材料：`docs/archive/`
