# API 参考 · API Reference

所有接口都遵循 REST 风格，返回 JSON。需要鉴权（标记 🔒）的接口需要携带 Auth.js 的 Session Cookie。

> Base URL：`http://localhost:3000/api` （生产请替换为你的域名）

---

## 鉴权 · Auth

### `POST /api/auth/register`

注册新用户。

**Body：**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "min-6-chars"
}
```

**响应：** `201 { user: { id, email, name, displayName } }`
**错误：** `409 email_exists` / `400 invalid_input`

---

### `POST /api/auth/callback/credentials`

由 `signIn('credentials', ...)` 调用。

### `GET /api/auth/session`

返回当前 session。

### `POST /api/auth/signout`

退出登录。

---

## 个人信息 · Profile 🔒

### `GET /api/profile`

返回当前用户的完整资料。

### `PATCH /api/profile`

更新资料。所有字段都可选：

```json
{
  "displayName": "Alice McAlice",
  "name": "alice",
  "bio": "writes about glass",
  "website": "https://alice.dev",
  "location": "Beijing",
  "image": "https://..."
}
```

### `POST /api/profile`

修改密码：

```json
{ "currentPassword": "old", "newPassword": "new" }
```

---

## 文章 · Posts

### `GET /api/posts`

列出 **公开 + 已发布** 的文章。

**查询参数：**

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页 |
| `locale` | `zh\|en` | — | 按语言过滤 |
| `tag` | string | — | 标签 slug |
| `category` | string | — | 分类 slug |
| `q` | string | — | 关键词 |

**响应：**

```json
{
  "items": [{
    "id": "...",
    "slug": "welcome-to-ink",
    "title": "...",
    "excerpt": "...",
    "coverImage": null,
    "locale": "zh",
    "visibility": "public",
    "published": true,
    "publishedAt": "...",
    "views": 12,
    "category": { "id": "...", "slug": "essays", "name": "随笔", "color": "#a78bfa" },
    "tags": [{ "tag": { "name": "公告", "slug": "公告" } }],
    "author": { "id": "...", "name": "Admin", "displayName": "Admin", "image": null },
    "_count": { "comments": 0 }
  }],
  "total": 3, "page": 1, "pageSize": 10, "pageCount": 1
}
```

---

### `POST /api/posts` 🔒

创建文章。任何登录用户均可。

```json
{
  "title": "我的新文章",
  "slug": "my-new-post",                  // 可选
  "excerpt": "...",                       // 可选
  "coverImage": "https://...",            // 可选
  "content": "# 正文 markdown",
  "locale": "zh",                         // "zh" | "en"
  "visibility": "public",                 // "public" | "private" | "unlisted"
  "allowEmbed": true,                     // 是否允许 raw HTML / iframe
  "categoryId": "...",                    // 可选
  "published": true,
  "tags": ["Next.js"]
}
```

---

### `GET /api/posts/[id]`

获取单篇文章原始数据（含未发布；用于编辑器加载）。

### `PATCH /api/posts/[id]` 🔒

更新文章。所有字段可选。仅作者本人或 admin 可调用，否则 `403 Forbidden`。

### `DELETE /api/posts/[id]` 🔒

同上，需作者本人或 admin。

---

### `GET /api/posts/[id]/export?format=md|html`

导出单篇文章。

- 公开 / 不公开（已发布）：任何人可下载
- 私有 / 草稿：只有作者或 admin 可下载

返回：
- `format=md` → `text/markdown` + `Content-Disposition: attachment; filename="...md"`
- `format=html` → `text/html` 自包含文档

---

## 分类 · Categories

### `GET /api/categories`

返回全站可见分类（owner 为 null 的全局 + 当前用户拥有的）。
查询 `?owner=me` 仅返回自己的 + 全局。

### `POST /api/categories` 🔒

```json
{ "name": "随笔", "description": "可选", "color": "#a78bfa", "icon": "Folder" }
```

新分类自动归属当前用户（`ownerId`），slug 自动生成。

### `PATCH /api/categories/[id]` 🔒

修改。仅 owner 或 admin。

### `DELETE /api/categories/[id]` 🔒

删除。分类下文章不会被删除，只是 `categoryId` 置 null。

---

## 评论 · Comments

### `GET /api/comments?postId=...`

获取一篇文章的评论。

### `POST /api/comments`

提交评论。**未登录用户必须提供 `guestName`**。

```json
{
  "postId": "...",
  "content": "Hello!",
  "guestName": "Alice",   // 仅游客
  "parentId": null        // 可选，回复
}
```

---

## 上传 / 渲染（管理员） 🔒

### `POST /api/upload`

`multipart/form-data`：

| 字段 | 说明 |
| --- | --- |
| `files` | 一个或多个 `.md` / `.mdx` 文件 |
| `locale` | 默认 locale |
| `published` | `"1"` 立即发布 / `"0"` 草稿 |

frontmatter 支持的字段见 [README.md → 写作流程](../README.md#写作流程)。

### `POST /api/render`

把 Markdown 渲染成 HTML（用于编辑器实时预览）：

```json
{ "content": "# hi", "allowEmbed": true }
```

---

## cURL 示例

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"hello123"}'

# 公开文章列表
curl http://localhost:3000/api/posts?pageSize=5

# 导出
curl -OJ http://localhost:3000/api/posts/<id>/export?format=md
```

需要鉴权的接口：先在浏览器登录，从 DevTools → Application → Cookies 复制
`next-auth.session-token`，加入：

```bash
curl -H 'cookie: next-auth.session-token=<token>' \
     -H 'content-type: application/json' \
     -X POST http://localhost:3000/api/posts -d '{...}'
```
