# Plot 项目部署手册（GitHub + Vercel + Neon）

本文档用于从零开始完成 `Plot` 项目的生产部署，并沉淀实际踩坑（尤其是 Prisma + Neon 的迁移锁问题）与排障手册。

---

## 1. 总览与目标

- 技术栈：`Next.js 15` + `Prisma 5` + `PostgreSQL (Neon)` + `Vercel`
- 部署目标：
  - 代码托管到 GitHub
  - Vercel 自动构建与发布
  - Neon 作为生产数据库
  - Prisma 迁移流程稳定、可重复、可排障

---

## 2. 前置准备

### 2.1 本地环境

- Node.js：建议 `20 LTS`
- npm：建议 `10+`
- Git：建议 `2.40+`
- 可选工具：`Vercel CLI`、`Neon CLI`、`psql`

常用检查命令：

```bash
node -v
npm -v
git --version
```

### 2.2 账号准备

- GitHub 账号（代码仓库）
- Vercel 账号（部署）
- Neon 账号（PostgreSQL）

---

## 3. GitHub 管理与初始化

### 3.1 新建仓库并推送

```bash
git init
git add .
git commit -m "chore: initialize project"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3.2 分支策略（推荐）

- `main`：生产分支，只接收可发布代码
- `dev`：日常开发分支
- `feature/*`：功能分支
- `hotfix/*`：线上紧急修复

### 3.3 PR 规范（建议）

- 每个 PR 控制在单一主题（功能/修复/重构）
- 必须包含：
  - 变更说明
  - 影响范围
  - 验证步骤
  - 数据库变更说明（如有）

---

## 4. Neon 数据库配置（重点）

## 4.1 创建项目与数据库

1. 登录 [Neon 控制台](https://console.neon.tech/)
2. 创建项目（区域尽量靠近 Vercel 部署区域）
3. 使用默认数据库（如 `neondb`）与默认角色（如 `neondb_owner`）

### 4.2 生成两条连接串（关键）

在 Neon 的 **Connect / Connection details** 页面中，你需要分别复制两条：

1. `Connection pooling = ON` 时的连接串  
   - 用于应用运行
   - 配置给 `DATABASE_URL`
2. `Connection pooling = OFF` 时的连接串  
   - 用于 Prisma 迁移
   - 配置给 `DIRECT_URL`

判定规则（快速）：

- `DATABASE_URL`：通常 host 包含 `-pooler`
- `DIRECT_URL`：通常 host 不包含 `-pooler`

### 4.3 Prisma schema 配置

`prisma/schema.prisma` 必须包含：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4.4 环境变量模板

本地 `.env` 与线上 Vercel 环境变量都应包含：

```env
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="..."
AUTH_TRUST_HOST=true
```

---

## 5. Vercel 部署配置

### 5.1 导入 GitHub 仓库

1. 打开 [Vercel New Project](https://vercel.com/new)
2. 选择 GitHub 仓库并导入
3. Framework 自动识别为 `Next.js`

### 5.2 配置环境变量

在 Vercel Project Settings -> Environment Variables 中配置：

- `DATABASE_URL`（pooler）
- `DIRECT_URL`（direct）
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- 其余业务变量（如站点 URL、管理员账号、第三方 API）

### 5.3 构建命令建议

推荐把“迁移”和“构建”分离，避免并发抢锁：

- Build Command：`prisma generate && next build`
- 迁移命令单独执行：`prisma migrate deploy`

如果你的平台只支持单命令，可以临时用：

```bash
prisma generate && prisma migrate deploy && next build
```

但此方式在并发部署下更容易出现迁移锁等待。

### 5.4 首次上线后检查

- 打开线上页面确认可访问
- 访问登录、文章列表、文章详情、写入接口
- 查看 Vercel Functions 日志是否存在 `Prisma` 错误

---

## 6. 标准发布流程（推荐）

1. 本地开发并验证
2. 推送 `dev` -> 发起 PR -> 合并到 `main`
3. 触发 Vercel 自动部署
4. 发布后冒烟测试
5. 观察 15~30 分钟日志与数据库指标

发布前本地命令建议：

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run lint
npm run build
```

---

## 7. Prisma/Neon 常见坑与解决方案

### 7.1 P1002：advisory lock 超时（本项目已遇到）

错误特征：

- `Timed out trying to acquire a postgres advisory lock`
- `Elapsed: 10000ms`

根因高频项：

- 并发部署导致多个 `migrate deploy` 同时执行
- 迁移连接未用 `DIRECT_URL`
- Neon 短时冷启动或网络抖动

解决方案：

1. 配置 `directUrl` 并设置 `DIRECT_URL`
2. 将迁移步骤独立为串行单实例执行
3. 避免多个 pipeline 重复执行迁移
4. 必要时重试一次确认非瞬时抖动

### 7.2 线上能连库但写入失败

排查顺序：

1. 检查 Vercel 环境变量是否缺失/拼写错误
2. 检查 DB 用户权限
3. 检查 Prisma schema 与数据库版本是否一致

### 7.3 `prisma generate` 正常但 `migrate deploy` 失败

说明：

- Prisma Client 生成只依赖 schema，不代表迁移可执行
- 迁移失败通常是连接、权限、锁、网络问题

### 7.4 环境变量配置反了

典型现象：

- `DATABASE_URL` 配成 direct
- `DIRECT_URL` 未配置或配成 pooler

修复：

- 重新复制 Neon 两条连接串并对调到正确变量

---

## 8. 常用命令速查

### 8.1 Git 日常更新

```bash
# 查看状态
git status

# 拉取最新
git pull origin main

# 新建功能分支
git checkout -b feature/your-feature

# 提交变更
git add .
git commit -m "feat: your change"

# 推送分支
git push -u origin feature/your-feature
```

### 8.2 Prisma 与数据库

```bash
# 校验 schema
npx prisma validate

# 生成客户端
npx prisma generate

# 查看迁移状态
npx prisma migrate status

# 执行生产迁移
npx prisma migrate deploy

# 开发阶段创建迁移
npx prisma migrate dev --name your_change
```

### 8.3 Next.js 构建与运行

```bash
# 开发
npm run dev

# 生产构建
npm run build

# 启动生产
npm run start
```

---

## 9. 线上问题排障 SOP

### 9.1 5 分钟内快速定位

1. 看 Vercel 最新部署日志是否失败
2. 看 Functions 日志是否有 Prisma 错误
3. 看 Neon 控制台是否有连接异常或高负载
4. 对照最近变更（代码、环境变量、迁移）

### 9.2 恢复优先级

1. 先恢复服务可用（回滚应用版本）
2. 再定位根因
3. 最后修复并补监控/流程

---

## 10. Neon 与 Vercel 管理建议

### 10.1 Neon 管理

- 生产和开发分支隔离（或分项目）
- 定期查看慢查询与连接峰值
- 关键变更前做备份快照

### 10.2 Vercel 管理

- 限制生产环境变量可编辑权限
- 开启部署通知与失败告警
- 定期清理无用预览部署和历史分支

---

## 11. 安全与合规建议

- `.env` 永不入库
- 管理员初始密码上线前必须替换
- `AUTH_SECRET` 使用高强度随机串
- 按季度轮换数据库密码与关键 token

---

## 12. 发布检查清单（可复制）

- [ ] `DATABASE_URL` / `DIRECT_URL` 配置正确
- [ ] `schema.prisma` 已配置 `directUrl`
- [ ] 本地 `prisma validate` 通过
- [ ] 本地 `prisma migrate status` 无异常
- [ ] 生产迁移只执行一次（串行）
- [ ] `next build` 成功
- [ ] 发布后冒烟测试通过
- [ ] 日志与监控 15 分钟内无异常

