# Local Development

Status: Draft
Stage: Coding
Last Updated: 2026-07-09
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

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8080`.

Build:

```bash
cd frontend
pnpm build
```

Proxy verification:

```bash
curl http://127.0.0.1:5173/api/health
```

## 4. Database

Milestone 1 does not connect to MySQL yet.

MySQL will be introduced in Milestone 2 when implementing the life account persistence.

Do not hardcode database passwords in project files. Use environment variables or local ignored config files.
