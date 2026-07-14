# Local Development

Status: Active
Stage: H5 Demo Coding / Frontend Mock
Last Updated: 2026-07-14
Owner: Human + ChatGPT + Codex

## 1. Prerequisites

本机已确认可用：

- JDK 21
- Maven 3.9.9
- Node.js 24
- pnpm

## 2. Backend

Maven on this machine may default to Homebrew JDK 23. Use Temurin JDK 21 explicitly for this project.

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn spring-boot:run
```

Health check:

```bash
curl http://127.0.0.1:8080/api/health
```

Run tests:

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn test
```

## 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

当前前端处于独立 Mock 验证阶段，账户、记录、反馈和解析预览数据来自 `frontend/src/mock/`，不需要启动后端，也不配置 Vite 代理。

当前页面范围：

- Today：人生余额、补记日期、自然语言输入、Mock 理解、预览编辑、确认保存和准确度反馈。
- Life：基于真实本地记录的阶段洞察和历史记录管理。
- Me：人生账户、隐私说明、本地数据导出 / 清除和体验反馈。

Mock 行为：

- Mock 根据工作、学习、健康、关系、生活、休闲、睡眠等关键词和用户表达的时长生成不同结果。
- 人生币按 `活动分钟数 / 1440` 换算，不把已记录时间占比误标为人生币。
- Life 不展示假趋势、假成就或固定统计；记录不足时会明确说明暂不形成趋势结论。
- 账户、已确认记录、准确度反馈和 Me 页体验反馈保存在浏览器 `localStorage`。
- 当前前端不会请求 `http://127.0.0.1:8080`，后端是否启动不影响前端预览。

Build:

```bash
cd frontend
pnpm build
```

前端验证：

```bash
pnpm test
pnpm build
```

`pnpm test` 当前覆盖人生币换算、多个维度识别、状态词识别和估算标记；生产构建继续由 TypeScript 与 Vite 校验。

如需重置 Mock 体验数据，可在 Me 页先导出 JSON，再使用“清除数据”；也可以在浏览器开发者工具中清除该站点的 Local Storage。不要把关键词 Mock 输出用于验证真实 Agent 分类准确率。

## 4. Database

当前后端使用进程内存存储，尚未接入 MySQL。当前独立前端 Mock 则使用浏览器 `localStorage`，同样不依赖 MySQL。

MySQL 的引入时机留待测试环境和真实后端持久化方案确认，不属于当前前端原型任务。

Do not hardcode database passwords in project files. Use environment variables or local ignored config files.
