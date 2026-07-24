# Development & Deployment

Status: Active
Last Updated: 2026-07-24
Owner: Human + Codex

## 本地前端

```bash
cd frontend
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173`。账户、记录、反馈和 Life 页面均需要下方后端服务；Life Agent 额外需要 DeepSeek 密钥。

验证：

```bash
pnpm test
pnpm build
```

## 本地后端

使用 JDK 21。DeepSeek 密钥默认加密保存在数据库中，启动时解密加载到内存。首次配置前生成独立主密钥，两个文件都不能写入 `application.yml`、前端 `.env` 或 Git：

```bash
openssl rand -base64 32 > /tmp/life-wallet-deepseek-master-key
chmod 600 /tmp/life-wallet-deepseek-master-key
read -s DEEPSEEK_API_KEY_VALUE
printf '%s' "$DEEPSEEK_API_KEY_VALUE" > /tmp/life-wallet-deepseek-api-key
unset DEEPSEEK_API_KEY_VALUE
chmod 600 /tmp/life-wallet-deepseek-api-key
export DEEPSEEK_MASTER_KEY_FILE=/tmp/life-wallet-deepseek-master-key
export DEEPSEEK_API_KEY_FILE=/tmp/life-wallet-deepseek-api-key
```

首次启动会执行 Flyway V2，把 API Key 使用 AES-256-GCM 加密写入 `service_secret`，再加载到进程内存。确认导入成功后清空一次性导入文件；后续启动只需要主密钥文件：

```bash
: > /tmp/life-wallet-deepseek-api-key
```

再次放入非空 API Key 并重启会轮换数据库密文。数据库只保存密文、随机 nonce 和算法标识；主密钥仍应使用云 Secret Manager、systemd credentials 或权限为 `0600` 的文件保管。主密钥丢失后现有密文无法恢复。

不希望本地开发写数据库时，可以设置 `DEEPSEEK_SECRET_PERSISTENCE_ENABLED=false`，此时仍只从环境变量或受限文件加载到内存。

启动与验证：

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn test
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home mvn spring-boot:run
```

健康检查：`http://127.0.0.1:8080/api/health`。

### 数据库

不配置数据库变量时，后端使用 `backend/data/` 下的文件型 H2，并在启动时自动执行 Flyway 迁移，适合单机开发。该目录已被 Git 忽略。

账户、确认记录、反馈和 Agent 会话均使用该数据库。业务请求必须包含 `X-Life-Wallet-Owner-Key`；H5 会为新安装自动生成。不会扫描或导入旧的浏览器 `localStorage` 数据。

本地或服务器 MySQL 8.4：

```bash
export LIFE_WALLET_DB_PASSWORD='replace-with-a-strong-password'
export LIFE_WALLET_DB_ROOT_PASSWORD='replace-with-a-different-root-password'
docker compose -f deploy/mysql/compose.yml up -d

export DB_URL='jdbc:mysql://127.0.0.1:3306/life_wallet?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai'
export DB_USERNAME='life_wallet'
export DB_PASSWORD="$LIFE_WALLET_DB_PASSWORD"
```

数据库密码与 DeepSeek 密钥使用相同原则：只通过部署环境或 secret 文件/管理服务注入，不写入仓库。Flyway 会在 Spring Boot 启动时读取 `db/migration` 并自动校验、升级；不要在生产库手工修改已经执行过的迁移文件，结构变化应新增 `V2__...sql`。

可选配置：

| 环境变量 | 默认值 | 用途 |
|---|---|---|
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek 兼容 API 根地址 |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Agent 模型 |
| `DEEPSEEK_API_KEY` | 空 | 首次配置或轮换时直接注入，优先于导入文件 |
| `DEEPSEEK_API_KEY_FILE` | 空 | 首次配置或轮换时使用的受限导入文件 |
| `DEEPSEEK_MASTER_KEY_FILE` | 空 | 解密数据库密文的 Base64 32 字节主密钥文件 |
| `DEEPSEEK_SECRET_PERSISTENCE_ENABLED` | `true` | 是否启用 DeepSeek 密钥加密入库与启动加载 |
| `DB_URL` | 本地文件型 H2 | JDBC 地址；部署环境设置为 MySQL |
| `DB_USERNAME` | `sa` | 数据库用户 |
| `DB_PASSWORD` | 空 | 数据库密码 |
| `DB_POOL_SIZE` | `5` | 最大连接池大小 |

前端开发服务器默认代理 `/api` 到 `http://127.0.0.1:8080`。后端使用其他端口时：

```bash
cd frontend
VITE_AGENT_PROXY_TARGET=http://127.0.0.1:18081 pnpm dev
```

## 测试环境

- Web Server：Nginx。
- 端口：TCP `15173`。
- 站点目录：`/var/www/life-wallet/`。
- 当前版本链接：`/var/www/life-wallet/current`。
- Nginx 配置：`deploy/nginx/life-wallet.conf`。
- 当前已部署本版 `frontend/dist/`、Spring Boot 后端与测试数据库；Nginx `/api/` 反向代理到只监听本机的 `127.0.0.1:18080`。
- 后端由 systemd 的 `life-wallet-api.service` 托管，MySQL 由 `/opt/life-wallet-test/compose.yml` 托管。测试机复用已缓存的 MySQL 8.0 镜像，Compose 默认仍为 MySQL 8.4，可通过服务器 `.env` 的 `MYSQL_IMAGE` 覆盖。
- DeepSeek 一次性导入文件当前已清空，API Key 以 AES-256-GCM 密文保存在数据库中；服务重启从数据库解密加载和真实 Agent 调用均已验证。HTTPS 仍未配置，不能保证手机麦克风能力。

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

测试服务器使用 `deploy/test/compose.yml` 运行 MySQL，并使用 `deploy/test/life-wallet-api.service` 和系统 JRE 21 托管后端。服务器目录 `/opt/life-wallet-test/` 包含 Compose、后端 jar、权限为 `0600` 的数据库环境文件、DeepSeek 导入文件和加密主密钥文件；这些秘密不进入 Git。后端只监听 `127.0.0.1:18080`，由 Nginx `/api/` 代理。

测试服务器首次配置或轮换 DeepSeek 密钥：

```bash
# 仅首次执行；不要覆盖已经用于加密数据库密文的主密钥。
ssh jd "sudo sh -c 'umask 077; test -s /opt/life-wallet-test/secrets/deepseek-master-key || openssl rand -base64 32 > /opt/life-wallet-test/secrets/deepseek-master-key; chown life-wallet:life-wallet /opt/life-wallet-test/secrets/deepseek-master-key'"
scp /secure/path/deepseek-api-key jd:/tmp/deepseek-api-key
ssh jd "sudo install -o life-wallet -g life-wallet -m 0600 /tmp/deepseek-api-key /opt/life-wallet-test/secrets/deepseek-api-key && rm -f /tmp/deepseek-api-key"
ssh jd "sudo systemctl restart life-wallet-api"
# 日志确认已经加密写入数据库后，清空一次性导入文件，主密钥文件必须保留。
ssh jd "sudo -u life-wallet sh -c ': > /opt/life-wallet-test/secrets/deepseek-api-key'"
```

后端更新后执行：

```bash
scp backend/target/life-wallet-api-0.0.1-SNAPSHOT.jar jd:/tmp/life-wallet-api.jar
ssh jd "sudo install -m 0644 /tmp/life-wallet-api.jar /opt/life-wallet-test/life-wallet-api.jar && sudo systemctl restart life-wallet-api"
```

## 冒烟测试

```bash
ssh jd "curl -fsSI http://127.0.0.1:15173/"
curl -fsSI http://<PUBLIC_IP>:15173/
```

确认首页及其 JS / CSS 返回 `200`，并在手机浏览器检查 Today、Life、Me、保存和刷新恢复。

DeepSeek 密钥配置后还需检查：

- 未登录用户无法从前端源码、响应、错误或日志中读到 DeepSeek 密钥。
- 查询已有记录会返回真实卡片，新增 / 修改 / 删除都先出现确认卡。
- DeepSeek 不可用时返回清晰错误，原有本地记录不受影响。
- 在 HTTPS 手机浏览器中分别验证允许和拒绝麦克风权限；不支持语音时仍能输入文字。

## 回滚

```bash
ssh jd "ls -la /var/www/life-wallet/releases"
ssh jd "ln -sfn /var/www/life-wallet/releases/<PREVIOUS_RELEASE> /var/www/life-wallet/current"
ssh jd "sudo nginx -t && sudo systemctl reload nginx"
```

至少保留最近两个已验证版本。当前测试环境使用 HTTP + IP + 非标准端口；账户与 Agent 标识已通过 `getRandomValues` 兼容该环境，但它仍不满足可靠的麦克风安全上下文要求。真实 Agent 已可用，完成 HTTPS 前仍不能把它描述为语音完整可用环境。
