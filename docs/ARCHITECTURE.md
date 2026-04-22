# 架构 · Architecture

## 1. 总体设计

Ink 是一个 **Next.js 15 全栈应用**：前端 React Server Components + Client Components，
后端使用 Next.js Route Handlers (`app/api/*/route.ts`)，无需独立 Node 服务。
所有渲染、API、鉴权、数据访问、Markdown 处理都在同一个进程内完成。

```
┌──────────────────────────────────────────────────────────────┐
│                     浏览器 (访客 / 用户 / 管理员)             │
└──────────────────────────────────────────────────────────────┘
                                ↑↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│   Next.js 15 (App Router)                                    │
│                                                              │
│   ┌──────────────┐    ┌────────────────┐    ┌────────────┐  │
│   │ Middleware   │ →  │  React Server  │ →  │  HTML/JSX  │  │
│   │ (next-intl)  │    │   Components   │    │            │  │
│   └──────────────┘    └───────┬────────┘    └────────────┘  │
│                               ↓                              │
│                ┌──────────────────────────┐                  │
│                │  lib/posts.ts            │ ← 文章 + 可见性  │
│                │  lib/categories.ts       │ ← 分类           │
│                │  lib/markdown.ts         │ ← rehype 管道    │
│                │  lib/export.ts           │ ← md/html 导出   │
│                │  lib/auth.ts             │ ← Auth.js        │
│                └──────────────┬───────────┘                  │
│                               ↓                              │
│   ┌────────────────────────────────────────────────────────┐│
│   │  Route Handlers (app/api/**/route.ts)                  ││
│   │  · auth / posts / comments / categories / profile      ││
│   │  · upload / render / export                            ││
│   └──────────────────────────┬─────────────────────────────┘│
└──────────────────────────────┼───────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │   Prisma Client      │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ SQLite / Postgres    │
                    └──────────────────────┘
```

## 2. 数据模型

详见 `prisma/schema.prisma`。核心关系：

```
User ─┬─< Post ─┬─< PostTag >─ Tag
      │         ├─< Comment
      │         └─> Category (m..1)
      │
      ├─< Comment
      └─< Category (owned)
```

关键扩展字段：

| 模型 | 字段 | 说明 |
| --- | --- | --- |
| `User` | `displayName` | 公开展示用名称（与 `name` 分开） |
| `User` | `bio` / `website` / `location` / `image` | 个人信息 |
| `User` | `role` | `user` / `admin` |
| `Post` | `visibility` | `public` / `unlisted` / `private` |
| `Post` | `allowEmbed` | 是否允许 iframe / video 等 raw HTML |
| `Post` | `categoryId` | 一对多归属 |
| `Category` | `ownerId` | `null` 为全站共享分类，否则用户私有 |
| `Category` | `color` / `icon` | 用于 UI 渐变 |

可见性矩阵：

| visibility | 出现在公共列表 | sitemap | RSS | 直接 URL |
| --- | --- | --- | --- | --- |
| `public` (published) | ✅ | ✅ | ✅ | 任何人可见 |
| `unlisted` (published) | ❌ | ❌ | ❌ | 只要拿到链接就可见 |
| `private` | ❌ | ❌ | ❌ | 仅作者本人 / admin 可见，未授权 404 |
| 草稿 (`!published`) | ❌ | ❌ | ❌ | 仅作者本人可见 |

## 3. 路由结构

详见 [README.md → 路由地图](../README.md#-路由地图)。

## 4. 鉴权与权限

- **Auth.js v5** + **PrismaAdapter** + **Credentials**（Email + Password）
- Session 策略：`jwt`
- 注册 `/api/auth/register` → bcrypt(10) 散列密码 → 创建 `User`，role 默认 `user`
- 登录后 JWT 中携带 `id` + `role`
- **权限规则**：

| 操作 | 谁能做 |
| --- | --- |
| 浏览公共内容 | 任何人 |
| 注册 / 登录 | 任何人 |
| 创建 / 编辑 / 删除自己的笔记 | 已登录用户 |
| 编辑 / 删除别人的笔记 | admin |
| 创建 / 编辑 / 删除自己的分类 | 已登录用户（其他用户不可改） |
| 删除全局分类（`ownerId=null`） | admin |
| 批量上传 .md | admin |
| 评论 | 任何人（游客需填名字） |

## 5. Markdown 渲染管道

```ts
unified()
  .use(remarkParse)
  .use(remarkGfm)            // 表格 / 删除线 / 任务列表
  .use(remarkMath)           // $...$ / $$...$$
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)            // ★ 启用原始 HTML
  .use(rehypeSanitize, schema) // ★ 严格白名单：iframe / video / audio / span 等可以；script 等禁止
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeKatex)
  .use(rehypePrettyCode, { theme }) // Shiki 双主题
  .use(rehypeStringify);
```

Sanitizer 白名单允许的标签 / 属性详见 `src/lib/markdown.ts`。如果某篇笔记
`allowEmbed = false`，rehype-raw + sanitize 阶段会被跳过，原始 HTML 全部 escape。

iframe 输出会被包成 `<div class="embed-wrapper">…</div>` 以提供响应式玻璃容器。

## 6. 导出

`/api/posts/[id]/export?format=md|html` 提供两种格式：

- **Markdown**：恢复原始内容 + frontmatter（title、slug、tags、category、author 等）
- **HTML**：完整自包含 HTML 文档（含 KaTeX CDN 与全套样式）

可见性受 GET 端的 `auth()` 校验：私有 / 草稿仅作者或 admin 可下载。

## 7. UI 设计系统：Liquid Glass

定义在 `src/app/globals.css`，分三层：

### 7.1 设计 token

```css
--aurora-1..4    极光配色（HSL，深浅模式各一套）
--glass-bg       /* 主玻璃背景 */
--glass-border   /* 玻璃描边 */
--glass-shadow   /* 多层阴影 + 内高光 */
--glass-blur     /* 24px 默认 */
--ease-fluid     /* cubic-bezier(0.32, 0.72, 0, 1) */
--dur-fluid      /* 520ms */
```

### 7.2 原子类

- `.glass` / `.glass-strong` / `.glass-soft`：基础磨砂材质
- `.card` / `.card-hover`：圆角玻璃卡片 + 悬浮抬升 + 流光
- `.btn-accent` / `.btn-secondary` / `.btn-ghost`：药丸按钮
- `.input` / `.textarea`：玻璃输入
- `.chip`：标签药丸
- `.badge-public/private/unlisted/draft`：状态徽章
- `.gradient-text`：极光渐变文字（带漂移动画）
- `.glass-sheen`：悬停时玻璃表面流光 sweep

### 7.3 动态背景

`<BlobBackground />`（`fixed inset-0 -z-10`）渲染 3 个高斯模糊后的 SVG 路径，
每个用 `<animate>` 在 3 个 morph 路径间无限插值。再叠加 SVG `feTurbulence`
噪点防 banding。

### 7.4 可访问性

- `prefers-reduced-motion: reduce` 全局减弱动画到 0.01ms
- 颜色对比度满足 WCAG AA
- 键盘快捷键 + 焦点环 (`:focus-visible`)

## 8. 国际化

- 路径前缀（`localePrefix: "always"`）
- 中间件做 `/` → `/zh` 重定向
- `getTranslations()` (RSC) / `useTranslations()` (Client)
- 所有公开页 + 用户中心都已翻译

## 9. 性能要点

- RSC 默认在服务端渲染，热路径数据库查询仅 1–3 条
- 公共列表 `published + visibility = public` 命中索引 `[visibility, published, publishedAt]`
- Markdown 渲染发生在服务端，**没有运行时 Shiki**（包体积友好）
- `next-themes` 仅用于 class 切换，无 hydration mismatch

## 10. 安全

- 密码 bcrypt cost 10
- 所有写入端点用 Zod 校验请求体
- 私有 / 草稿 / 未发布在 `lib/posts.ts` 与各 API handler 双重校验
- HTML sanitization 严格白名单，禁止 `<script>`、`onclick` 等
- Auth.js JWT 由 `AUTH_SECRET` 签名

## 11. 扩展建议

| 想加的功能 | 改动位置 |
| --- | --- |
| OAuth（GitHub / Google） | `lib/auth.ts` 增加 provider |
| PDF 导出 | `lib/export.ts` + `puppeteer-core` |
| 图片上传 | 新增 `/api/upload-image` → S3/R2 / 本地 |
| 全文索引 | SQLite FTS5 或 Meilisearch |
| 邮件订阅 | 新建 Subscriber 模型 + cron |
| 评论审核 | `Comment.approved` 默认 false + 审批 UI |
