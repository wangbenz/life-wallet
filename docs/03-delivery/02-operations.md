# Development & Deployment

Status: Active
Last Updated: 2026-07-15
Owner: Human + Codex

## 本地前端

```bash
cd frontend
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173`。当前前端是独立 Mock，数据保存在浏览器 `localStorage`，不需要后端。

验证：

```bash
pnpm test
pnpm build
```

## 本地后端

当前展示版不依赖后端。需要验证保留 API 时使用 JDK 21：

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn test
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn spring-boot:run
```

健康检查：`http://127.0.0.1:8080/api/health`。

## 测试环境

- Web Server：Nginx。
- 端口：TCP `15173`。
- 站点目录：`/var/www/life-wallet/`。
- 当前版本链接：`/var/www/life-wallet/current`。
- Nginx 配置：`deploy/nginx/life-wallet.conf`。
- 当前只部署 `frontend/dist/`，不部署后端和数据库。

## 发布

先在本地测试并构建：

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

回到项目根目录，为每次发布使用新编号：

```bash
RELEASE=YYYYMMDD-HHMMSS
ssh jd "mkdir -p /var/www/life-wallet/releases/$RELEASE"
rsync -az --delete frontend/dist/ "jd:/var/www/life-wallet/releases/$RELEASE/"
ssh jd "ln -sfn /var/www/life-wallet/releases/$RELEASE /var/www/life-wallet/current"
ssh jd "sudo nginx -t && sudo systemctl reload nginx"
```

Nginx 配置变化时：

```bash
scp deploy/nginx/life-wallet.conf jd:/tmp/life-wallet.conf
ssh jd "sudo install -m 0644 /tmp/life-wallet.conf /etc/nginx/sites-available/life-wallet"
ssh jd "sudo ln -sfn /etc/nginx/sites-available/life-wallet /etc/nginx/sites-enabled/life-wallet"
ssh jd "sudo nginx -t && sudo systemctl reload nginx"
```

## 冒烟测试

```bash
ssh jd "curl -fsSI http://127.0.0.1:15173/"
curl -fsSI http://<PUBLIC_IP>:15173/
```

确认首页及其 JS / CSS 返回 `200`，并在手机浏览器检查 Today、Life、Me、保存和刷新恢复。

## 回滚

```bash
ssh jd "ls -la /var/www/life-wallet/releases"
ssh jd "ln -sfn /var/www/life-wallet/releases/<PREVIOUS_RELEASE> /var/www/life-wallet/current"
ssh jd "sudo nginx -t && sudo systemctl reload nginx"
```

至少保留最近两个已验证版本。当前测试环境使用 HTTP + IP + 非标准端口；长期对外使用前再配置域名、合规检查和 HTTPS。
