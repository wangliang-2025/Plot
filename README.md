# Ink — 现代笔记博客 · Liquid Glass UI

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> 一个用 Next.js 15 + Prisma + Auth.js 构建的全栈 **笔记 / 博客** 系统。
> 浅蓝紫 **Liquid Glass** 设计语言、流体玻璃材质、SVG morphing 背景，
> 支持注册 / 登录 / 个人信息、私有笔记、分类归档、网页嵌入、一键导出 .md / .html。

---

## ✨ 功能清单

### 用户与权限

- 🔐 **注册 / 登录**（Auth.js v5 + bcrypt）
- 👤 **个人信息编辑**：显示名称、简介、网站、所在地、头像
- 🔑 **修改密码**（验证当前密码）
- 👑 **角色**：`user` / `admin`，admin 可管理任意用户的内容

### 笔记 / 文章

- ✍️ **Markdown 编辑器**：工具栏（粗体/斜体/链接/标题/列表/引用/图片/表格/iframe）+ **键盘快捷键**（⌘/Ctrl + B / I / K / S）+ **实时预览**
- 📁 **分类系统**：每篇笔记可归入一个分类，分类有自定义颜色
- 🏷️ **标签系统**：多对多
- 🔒 **三级可见性**：
  - `public` — 列入首页与列表，所有人可见
  - `unlisted` — 不进列表，仅通过链接访问
  - `private` — 仅作者本人可见，未授权访问 404
- 📝 **草稿** / **发布** 切换
- 📤 **批量导入 `.md`**：管理员后台支持 frontmatter 自动解析
- 📥 **一键导出**：每篇笔记可下载为 `.md`（带 frontmatter）或独立 `.html`（自带样式）

### 阅读体验

- 🌗 **深色模式**（流体过渡）
- 🌐 **中英双语**（路径前缀 `/zh` ↔ `/en`）
- 💬 **评论系统**：游客 / 登录用户均可
- 🔍 **全文搜索**
- 📡 **RSS** + **sitemap** + **robots**
- 🌐 **嵌入网页 / iframe**：在 Markdown 中直接写 `<iframe>` 即可，自动包装成响应式玻璃容器
- 🎯 **目录侧栏**：支持滚动高亮当前章节
- 📊 **阅读时长** / **浏览次数**

### Markdown 渲染管道

| 特性 | 实现 |
| --- | --- |
| GFM（表格、删除线、任务列表） | `remark-gfm` |
| 代码高亮（双主题） | `rehype-pretty-code` (Shiki) |
| 数学公式 | `remark-math` + `rehype-katex` |
| 标题锚点 | `rehype-slug` + `rehype-autolink-headings` |
| 原始 HTML（白名单） | `rehype-raw` + `rehype-sanitize` |
| iframe / video / audio 嵌入 | sanitization 白名单允许 |
| 自动目录 | 自研 `extractToc` |

### Liquid Glass 设计系统

| 元素 | 描述 |
| --- | --- |
| 浅蓝紫极光配色 | `--aurora-1..4` HSL 变量，深浅模式自适应 |
| **真磨砂玻璃** | `backdrop-filter: blur(24px) saturate(180%)` |
| **SVG morphing 背景** | 三层流体 blob，独立速度无限平滑变形 |
| **玻璃组件** | `.glass` / `.card` / `.btn-accent` / `.input` / `.chip` |
| **流体动画** | `cubic-bezier(0.32, 0.72, 0, 1)` ⋅ 280–520ms |
| **Sheen / 流光** | 卡片 hover 时玻璃表面光的 sweep 效果 |
| **极光渐变文字** | `.gradient-text`，缓慢漂移背景 |
| **动态噪点** | SVG `feTurbulence` 防 banding |
| **滚动条** | 玻璃化、悬停加深 |
| **可访问性** | `prefers-reduced-motion` 自动减弱动画 |

---

## 🚀 快速开始

### ⚡ 一键启动（推荐 · 日常使用）

| 系统 | 操作 |
| --- | --- |
| **Windows** | 双击根目录的 **`start.bat`** |
| **macOS / Linux** | 在终端跑 `./start.sh` |
| **跨平台 npm** | `npm run launch` |

脚本会自动：
1. 检查 Node.js 版本（需 ≥ 18）
2. 缺 `.env` 时自动从 `.env.example` 复制
3. 没装依赖就 `npm install`
4. 没建数据库就 `prisma db push` + 写入示例数据
5. 启动 dev 服务器
6. 等服务器就绪后**自动打开浏览器**

需要停止：双击 **`stop.bat`** / `./stop.sh` / `npm run stop` —— 或者直接在终端 `Ctrl + C`。

### 手动方式（按需）

```bash
npm install
copy .env.example .env       # macOS/Linux: cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

打开 <http://localhost:3000>。

### 默认账号

管理员（来自 `.env` 的 `ADMIN_*`）：

| 字段 | 值 |
| --- | --- |
| 邮箱 | `admin@example.com` |
| 密码 | `ChangeMe123!` |

普通用户可在 `/zh/register` 自行注册。

### 🔑 本地启动自动登录（开发体验）

`start.bat` / `npm run launch` 默认会让浏览器**自动用 admin 凭据登录**，免去每次手敲密码。
打开后右下角会有一个小气泡告诉你结果（"已自动登录"或失败原因），3 秒后消失。

| 想关闭？ | 怎么做 |
| --- | --- |
| **临时关闭一次** | 改 URL 把 `?autologin=1` 去掉，访问 `http://localhost:3000/zh` |
| **永久关闭** | `.env` 里改成 `DEV_AUTOLOGIN="0"` |
| **只对某次启动关闭** | `set OPEN_PATH=/zh && npm run launch` |

**安全说明**：自动登录所依赖的 `/api/dev/auto-login` 接口在 `NODE_ENV !== 'development'` 时一律返回 `403`，**不会跟着上线**。即便有人在生产环境意外访问 `?autologin=1`，组件也只会收到 403、轻轻提示一下、不做任何事。

---

## 📁 路由地图

### 公开页面

| 路径 | 说明 |
| --- | --- |
| `/[locale]` | 首页 — Hero + 最新文章 + 分类 + 标签 |
| `/[locale]/posts` | 文章列表（分页） |
| `/[locale]/posts/[slug]` | 文章详情 — 目录 / 评论 / 导出 / 嵌入 |
| `/[locale]/categories` | 分类列表 |
| `/[locale]/categories/[slug]` | 单分类下文章 |
| `/[locale]/tags` | 标签云 |
| `/[locale]/tags/[tag]` | 单标签下文章 |
| `/[locale]/search?q=` | 搜索 |
| `/[locale]/about` | 关于 |
| `/[locale]/login` | 登录 |
| `/[locale]/register` | 注册 |
| `/feed.xml` | RSS |
| `/sitemap.xml` | Sitemap |

### 用户中心（登录后）

| 路径 | 说明 |
| --- | --- |
| `/[locale]/notes` | 我的笔记（含草稿、私有、不公开） |
| `/[locale]/notes/new` | 新建笔记 |
| `/[locale]/notes/[id]/edit` | 编辑笔记 |
| `/[locale]/notes/categories` | 我的分类管理 |
| `/[locale]/profile` | 个人信息 + 修改密码 |

### 管理员（仅 admin 可见）

| 路径 | 说明 |
| --- | --- |
| `/[locale]/admin` | Dashboard — 全站统计 |
| `/[locale]/admin/posts` | 全部文章列表（任何作者） |
| `/[locale]/admin/upload` | 批量 .md 导入 |

### API

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | * | Auth.js |
| `/api/auth/register` | POST | 注册 |
| `/api/profile` | GET/PATCH/POST | 资料 / 改密 |
| `/api/posts` | GET/POST | 列表 / 创建 |
| `/api/posts/[id]` | GET/PATCH/DELETE | 单篇 CRUD |
| `/api/posts/[id]/export?format=md\|html` | GET | 导出 |
| `/api/categories` | GET/POST | 列表 / 创建 |
| `/api/categories/[id]` | PATCH/DELETE | 修改 / 删除 |
| `/api/comments` | GET/POST | 评论 |
| `/api/upload` | POST | 批量 .md 上传（admin） |
| `/api/render` | POST | 后台预览渲染 |

---

## 📁 目录结构

```
ink-blog/
├── prisma/
│   ├── schema.prisma        # User / Post / Tag / Category / Comment
│   ├── seed.ts              # 初始管理员 + 分类 + 示例笔记
│   └── dev.db               # SQLite（自动）
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根 metadata
│   │   ├── globals.css      # ★ Liquid Glass 设计系统
│   │   ├── sitemap.ts / robots.ts / feed.xml
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Auth.js
│   │   │   ├── auth/register/        # 注册
│   │   │   ├── profile/              # 个人信息
│   │   │   ├── posts/[id]/export/    # 导出
│   │   │   ├── categories/[id]/      # 分类 CRUD
│   │   │   └── ...
│   │   └── [locale]/
│   │       ├── layout.tsx
│   │       ├── page.tsx              # 首页
│   │       ├── posts/                # 公开文章
│   │       ├── tags/ · categories/   # 索引
│   │       ├── search/ · about/
│   │       ├── login/ · register/
│   │       ├── profile/              # 个人信息
│   │       ├── notes/                # ★ 我的笔记
│   │       │   ├── page.tsx
│   │       │   ├── new/ · [id]/edit/
│   │       │   └── categories/       # 分类管理
│   │       └── admin/                # 管理员
│   ├── components/
│   │   ├── blob-background.tsx       # ★ SVG morphing 流体背景
│   │   ├── site-header.tsx           # 玻璃化导航
│   │   ├── site-footer.tsx
│   │   ├── theme-toggle.tsx · locale-switcher.tsx
│   │   ├── post-card.tsx · markdown-content.tsx · table-of-contents.tsx
│   │   ├── post-editor.tsx           # ★ 带工具栏 + 快捷键
│   │   ├── post-actions.tsx          # ★ 导出 / 复制链接
│   │   ├── comments-section.tsx
│   │   ├── login-form.tsx · register-form.tsx
│   │   ├── profile-form.tsx · password-form.tsx
│   │   ├── category-manager.tsx      # ★ 分类增删
│   │   └── upload-form.tsx
│   ├── lib/
│   │   ├── db.ts · auth.ts · utils.ts
│   │   ├── markdown.ts               # ★ rehype-raw + sanitize
│   │   ├── posts.ts                  # ★ visibility / category 过滤
│   │   ├── categories.ts             # ★ 分类数据访问
│   │   └── export.ts                 # ★ md / html 导出
│   ├── i18n/ · messages/             # 中英文
│   └── middleware.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
├── README.md · LICENSE
└── (config files)
```

---

## 📜 可用脚本

| 命令 | 用途 |
| --- | --- |
| `npm run launch` | **一键启动**（自动 setup + 开发服务器 + 自动打开浏览器） |
| `npm run setup` | 仅做环境准备（依赖 / 数据库），不启动服务器 |
| `npm run stop` | 停止 3000 端口上的开发服务器 |
| `npm run dev` | 仅启动开发服务器（不做检查） |
| `npm run build` | 生产构建（含 `prisma generate`） |
| `npm run start` | 生产服务器 |
| `npm run typecheck` | TypeScript 检查 |
| `npm run lint` | ESLint |
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:migrate` | 创建迁移 |
| `npm run db:seed` | 初始化数据 |
| `npm run db:studio` | Prisma Studio |
| `npm run db:backup` | **一键备份**当前 SQLite 数据库到 `prisma/backups/` |
| `npm run db:list-backups` | 列出所有可用备份 |
| `npm run db:restore -- --latest` | 还原最新一份备份（还原前自动再快照一次，可逆） |

---

## 🔧 配置项

```bash
DATABASE_URL="file:./dev.db"          # 生产：换成 Postgres / Turso
AUTH_SECRET="..."                     # openssl rand -base64 32
AUTH_TRUST_HOST=true                  # 反代 / Vercel 必须

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_NAME="Admin"

NEXT_PUBLIC_SITE_URL="https://your.site"
NEXT_PUBLIC_SITE_NAME="Ink"
NEXT_PUBLIC_SITE_DESCRIPTION="..."
NEXT_PUBLIC_SITE_AUTHOR="..."
```

---

## 📝 写作流程

### 在线写作

1. 注册或登录 → 顶部点 **「我的笔记」**
2. 点 **新笔记**，选择：
   - **可见性**：公开 / 不公开 / 私有
   - **分类**（可选）
   - **标签**（逗号分隔）
   - **嵌入**：是否允许 iframe（默认开）
3. Markdown 输入 + 工具栏快速插入 / 实时预览
4. 选 **保存草稿** 或 **立即发布**

### 嵌入网页 / 视频

启用 **嵌入** 后，在正文里直接写：

```html
<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=..." width="100%" height="380"></iframe>
```

会被自动包成响应式玻璃容器。也支持 `<video>` / `<audio>` / `<source>`。
脚本和事件处理器会被 sanitizer 过滤。

### 一键导出

文章顶部 **导出** 菜单：
- **Markdown**：附带 frontmatter（标题、slug、日期、标签、分类）
- **HTML**：自包含 + KaTeX CDN，可独立离线打开
- **复制链接**

### 批量上传 .md（管理员）

`/admin/upload` 拖入或选择 `.md` 文件。Frontmatter：

```md
---
title: 我的文章
slug: my-post
date: 2026-04-19
tags: [react, 笔记]
cover: https://...
category: 技术
locale: zh
visibility: public        # public / private / unlisted
published: true
---
```

---

## 💾 数据备份

本地开发时数据全部在 `prisma/dev.db`（SQLite 单文件）里，**不会随 git 提交**。
项目内置一套备份/还原系统保护它，启停时**自动**触发，无需手动干预。

### 自动机制

| 时机 | 触发 | 标签 |
| --- | --- | --- |
| 每次 `start.bat` / `npm run launch` | 启动前 | `auto-launch` |
| 每次 `stop.bat` / `npm run stop` | 关闭前 | `auto-stop` |

> 备份失败时**不会阻塞**启动 / 关闭，只是打一行黄色警告。
> 首次启动（dev.db 还不存在）会自动跳过，避免无意义的"空备份"。

### 手动命令

```bash
# 备份当前数据库
npm run db:backup

# 备份并打个标签（推荐在做破坏性 schema 变更前用）
npm run db:backup -- before-add-gitee-field

# 列出所有备份
npm run db:list-backups

# 还原最新备份（还原前会先把当前库快照一份，可后悔）
npm run db:restore -- latest

# 还原列表里的第 3 份
npm run db:restore -- 3

# 还原指定文件
npm run db:restore -- dev.db.20260419-213000
```

### 轮转策略（按 label 分桶，互不影响）

| 备份类型 | 文件名特征 | 保留份数 |
| --- | --- | --- |
| 启动前自动备份 | `*-auto-launch` | 最近 **10** 份 |
| 关闭前自动备份 | `*-auto-stop` | 最近 **10** 份 |
| 手动无标签备份 | `dev.db.<时间戳>` | 最近 **20** 份（可 `--keep N` 调整）|
| **手动里程碑备份**（自定义 label） | `*-before-vercel` 等 | **永久保留** |
| 还原前安全快照 | `*.before-restore.*` | **永久保留** |

正因为"自定义 label 永久保留"，所以重要节点（升级、迁移、schema 改动前）**强烈建议手动 `npm run db:backup -- xxx`** 给这一刻起个好记的名字 —— 它绝不会被启停产生的自动备份冲掉。

**自动安全快照**：每次执行 `db:restore` 时，脚本会先把**当前**数据库再备份一份，文件名带 `before-restore.<时间戳>`。"还原错了想反悔" → 再跑一次 `npm run db:restore -- latest` 即可滚回去。

备份目录 `prisma/backups/` 已加入 `.gitignore`，建议把它顺便挂到 OneDrive / 坚果云做异地冷备。

备份文件会落到 `prisma/backups/`，已加入 `.gitignore`。
建议把这个目录顺便挂到 OneDrive / 坚果云做异地冷备。

> 生产环境（Vercel + Postgres / Turso）不要用这套 — 云数据库自己有定时快照。

---

## 🚀 部署

详见 **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Vercel / Docker / Node.

> 部署 Vercel 时，把 `prisma/schema.prisma` 中的 `provider = "sqlite"` 改成 `"postgresql"`，并使用 Vercel Postgres / Neon / Supabase / Turso 之一。

---

## 📚 进一步阅读

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — 整体架构
- [docs/API.md](./docs/API.md) — REST API 详细文档
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — 部署指南

---

## 📄 License

MIT
