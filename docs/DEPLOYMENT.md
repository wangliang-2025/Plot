# 部署指南 · Deployment

本文档涵盖三种主流部署方式：

1. ☁️ **Vercel**（最简单，1 分钟上线）
2. 🐳 **Docker / 自托管 VPS**
3. 🖥️ **Node 直接 `npm start`**

> 无论哪种方式，都先做 [生产前检查表](#生产前检查表)。

---

## 0. 生产前检查表

- [ ] `.env` 中 `AUTH_SECRET` 已替换为 `openssl rand -base64 32` 生成的随机串
- [ ] `.env` 中 `ADMIN_PASSWORD` 已修改为强密码
- [ ] `NEXT_PUBLIC_SITE_URL` 已设为正式域名（影响 RSS、sitemap、OG）
- [ ] `NEXT_PUBLIC_SITE_NAME` / `_DESCRIPTION` / `_AUTHOR` 已自定义
- [ ] 如部署在反代后（Nginx / Cloudflare），保留 `AUTH_TRUST_HOST=true`
- [ ] 数据库已从 SQLite 切换到生产级方案（见下文）

---

## 1. ☁️ Vercel

### 1.1 数据库选择

Vercel 是无状态 Serverless 平台，**SQLite 不可直接使用**（每次冷启动文件会丢）。请选其中一个：

| 选项 | 适合 | 改动 |
| --- | --- | --- |
| **Turso (libSQL)** | 想保留 SQLite 风格、零成本起步 | 改 schema |
| **Vercel Postgres** | 与 Vercel 平台无缝集成 | 改 schema |
| **Neon / Supabase** | 任意 Postgres 提供商均可 | 改 schema |

#### 切换到 Postgres（推荐）

编辑 `prisma/schema.prisma`：

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

然后在本地：

```bash
npx prisma migrate dev --name init
```

把生成的 `prisma/migrations` 目录提交到 git。

#### 切换到 Turso（保留 SQLite 体验）

```bash
npm install @libsql/client @prisma/adapter-libsql
```

参考 [Prisma + Turso 官方文档](https://docs.turso.tech/sdk/ts/orm/prisma)，把 `lib/db.ts` 改成使用 `PrismaLibSQL` 适配器。

### 1.2 部署步骤

1. 把项目推到 GitHub。
2. <https://vercel.com/new> → 选择仓库 → Import。
3. **Environment Variables** 里填入 `.env` 中所有变量（注意 `DATABASE_URL` 用线上数据库的连接串）。
4. 点击 **Deploy**。

### 1.3 首次部署后

进入 Vercel 项目 → Deployments → 最新 deployment → Functions → 任意函数日志，确认无报错。

通过 SSH/CLI 或 Vercel CLI 在线上数据库跑一次 seed：

```bash
# 本地用线上 DATABASE_URL
DATABASE_URL='postgres://...' npm run db:push
DATABASE_URL='postgres://...' ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='strong-pwd' npm run db:seed
```

---

## 2. 🐳 Docker / 自托管 VPS

适合放在自己的 VPS，无需平台依赖。SQLite 也能用（数据库文件挂卷持久化）。

### 2.1 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

### 2.2 docker-compose.yml

```yaml
services:
  blog:
    build: .
    image: ink-blog:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/prisma   # 把 SQLite 文件持久化
    restart: unless-stopped
```

> 把 `.env` 里的 `DATABASE_URL` 改成 `file:/app/prisma/dev.db` 即可。

### 2.3 启动

```bash
# 本地构建并启动
docker compose up -d --build

# 首次需要初始化数据库
docker compose exec blog npx prisma db push
docker compose exec blog npm run db:seed
```

### 2.4 反向代理（Nginx 示例）

```nginx
server {
    listen 80;
    server_name blog.yoursite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

记得用 Certbot 加 HTTPS：

```bash
sudo certbot --nginx -d blog.yoursite.com
```

---

## 3. 🖥️ Node 直接启动（简单 VPS / Windows）

```bash
# 一次
npm install
npm run db:push
npm run db:seed
npm run build

# 启动
npm start
```

可以用 `pm2` 守护：

```bash
npm install -g pm2
pm2 start "npm start" --name ink-blog
pm2 save
pm2 startup
```

---

## 4. 数据库迁移与备份

### 4.1 生成迁移

修改 `prisma/schema.prisma` 后：

```bash
npx prisma migrate dev --name your_change
```

把 `prisma/migrations/` 提交。生产侧：

```bash
npx prisma migrate deploy
```

### 4.2 备份

- **SQLite**：直接拷贝 `dev.db` 文件即可。建议加到 cron：

  ```bash
  cp /app/prisma/dev.db /backups/dev-$(date +%F).db
  ```

- **Postgres**：用 `pg_dump`。

---

## 5. 自定义域名 & HTTPS

不论 Vercel 还是自托管，配置域名后：

1. 把 `NEXT_PUBLIC_SITE_URL` 改成 `https://your.domain`
2. 重新部署一次（让 sitemap/RSS/OG 都用上新域名）

---

## 6. 故障排查

| 现象 | 可能原因 |
| --- | --- |
| 登录后跳回登录页 | `AUTH_SECRET` 在不同环境不一致 / `AUTH_TRUST_HOST` 未设 |
| `prisma` 找不到 schema | `npm run build` 应自动 `prisma generate`，确认未跳过 `postinstall` |
| 上传 .md 文件 413 | Next.js Server Action body 限额，已经在 `next.config.mjs` 设到 10MB，过大可调 |
| 中文乱码 | 数据库非 UTF-8，Postgres 建库时加 `ENCODING 'UTF8'` |
| Vercel 上写入失败 | SQLite 文件被冷启动重置，必须切到 Postgres / Turso |
