# Local Development

Status: Active
Stage: H5 Demo Coding / Frontend Mock
Last Updated: 2026-07-11
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

当前前端处于 Mock UI 调试阶段，所有账户、记录与解析预览数据均来自 `frontend/src/mock/data.ts`，不需要启动后端，也不配置 Vite 代理。

当前页面范围：

- Today：人生余额、自然语言输入、2 秒模拟理解、账单预览、修改和确认保存。
- Life：概览、趋势、时间轴、成就。
- Me：个人信息、人生数据摘要、账户设置、AI 提醒和数据服务入口。

Mock 行为：

- 无论输入什么内容，记录预览都会返回同一份固定分析结果。
- 账户设置与确认后的记录保存在浏览器 `localStorage`。
- 趋势、时间轴、成就和部分 Me 数据是用于视觉验证的静态展示数据。
- 当前前端不会请求 `http://127.0.0.1:8080`，后端是否启动不影响前端预览。

Build:

```bash
cd frontend
pnpm build
```

前端验证：

```bash
pnpm build
```

如需重置 Mock 体验数据，可在浏览器开发者工具中清除该站点的 Local Storage 后刷新页面。不要把 Mock 输出用于验证真实 Agent 分类准确率。

## 4. Database

当前后端使用进程内存存储，尚未接入 MySQL。当前独立前端 Mock 则使用浏览器 `localStorage`，同样不依赖 MySQL。

MySQL 的引入时机留待测试环境和真实后端持久化方案确认，不属于当前前端原型任务。

Do not hardcode database passwords in project files. Use environment variables or local ignored config files.
