import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// No global seed categories — users create their own from the UI.
const categories: Array<{
  name: string;
  slug: string;
  description: string;
  color: string;
}> = [];

// No sample posts shipped by the seed — the admin starts with an empty
// workspace and writes their own. Kept for reference only.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _samplePostsZhRef = [
  {
    slug: 'welcome-to-ink',
    title: '欢迎来到 Ink',
    excerpt: '一个用 Liquid Glass 设计语言构筑的现代笔记博客，支持 Markdown、代码高亮、数学公式、嵌入网页与一键导出。',
    locale: 'zh',
    visibility: 'public' as const,
    category: '随笔',
    tags: ['公告', '入门'],
    coverImage: null,
    content: `# 欢迎来到 Ink

> 用文字记录思考，用玻璃折射光线。

这是 **Ink** 笔记博客的第一篇文章，演示你能在文章里使用的所有 Markdown 特性。

## 为什么选择 Ink？

- 全新 **Liquid Glass** 设计语言：浅蓝紫流体背景 + 半透明卡片
- **Markdown** 全面支持：表格、任务列表、KaTeX、代码高亮
- **三级可见性**：公开 / 不公开 / 私有
- 一键 **导出**：Markdown 与 HTML
- 可在文中 **嵌入网页**：iframe / 视频 / 文档

## Markdown 一览

### 文本

普通段落，**加粗**，*斜体*，~~删除线~~，\`内联代码\`，以及 [链接](https://nextjs.org)。

### 列表

- 项目一
- 项目二
  - 子项 A
  - 子项 B

1. 步骤一
2. 步骤二
3. 步骤三

### 引用

> 我们写下，是为了记得；我们记得，是为了走得更远。

### 代码块（带语法高亮）

\`\`\`tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

\`\`\`python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

### 表格

| 特性       | 说明                       |
| ---------- | -------------------------- |
| Markdown   | GFM 完整支持               |
| 代码高亮   | Shiki 引擎                 |
| 数学公式   | KaTeX                      |
| 主题       | 浅色 / 深色                |
| 嵌入       | iframe / video / audio    |

### 数学

行内：$E = mc^2$

块级：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

### 任务清单

- [x] 完成 Liquid Glass 视觉
- [x] 上线注册 / 个人信息
- [x] 笔记分类
- [ ] 写更多文章

### 嵌入网页

直接在 Markdown 里写 iframe 即可：

<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-0.20,51.49,-0.07,51.55&layer=mapnik" width="100%" height="380"></iframe>

## 接下来

- 在 \`/notes\` 管理你的笔记，包括草稿和私有笔记
- 在 \`/profile\` 完善个人信息
- 在 \`/categories\` 浏览分类

祝你写作愉快。
`,
  },
  {
    slug: 'liquid-glass-design',
    title: '关于 Liquid Glass 设计',
    excerpt: '本站 UI 的设计哲学：流体玻璃、半透明、动态模糊与平滑过渡。',
    locale: 'zh',
    visibility: 'public' as const,
    category: '技术',
    tags: ['设计', 'UI'],
    coverImage: null,
    content: `# 液态玻璃设计

灵感来自 Apple visionOS 的 *Glass* 材质与近几年 SaaS 产品的渐变流体趋势。

## 关键技术

| 技术 | 作用 |
| --- | --- |
| \`backdrop-filter\` | 真实磨砂玻璃 |
| SVG morphing | 流体变形背景 |
| CSS gradient | 极光渐变 |
| \`cubic-bezier(0.32, 0.72, 0, 1)\` | 流体缓动曲线 |

## 配色

主色板基于 *浅蓝紫*：

- Aurora 1 \`hsl(252 90% 75%)\`
- Aurora 2 \`hsl(220 100% 78%)\`
- Aurora 3 \`hsl(285 90% 80%)\`
- Aurora 4 \`hsl(195 95% 78%)\`

> 在深色模式下，自动切换到更深、饱和度更高的对应色。
`,
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _samplePostsEnRef = [
  {
    slug: 'hello-world',
    title: 'Hello, world',
    excerpt: 'A first post that walks through every Markdown feature this blog supports — code, math, tables and embedded iframes.',
    locale: 'en',
    visibility: 'public' as const,
    category: 'tech',
    tags: ['Welcome'],
    coverImage: null,
    content: `# Hello, world

Welcome to **Ink**, a modern note-style blog with a *Liquid Glass* aesthetic.

## Markdown features

\`\`\`ts
export async function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Math: $a^2 + b^2 = c^2$

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

| Feature | Status |
| --- | --- |
| GFM | yes |
| Math | yes |
| Code highlight | yes |
| Embeds | yes |

Embed any page directly:

<iframe src="https://example.com" width="100%" height="320"></iframe>
`,
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  console.log('→ Seeding admin:', adminEmail);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin', name: adminName, displayName: adminName, password: passwordHash },
    create: {
      email: adminEmail,
      name: adminName,
      displayName: adminName,
      role: 'admin',
      password: passwordHash,
      bio: 'Site owner & curator',
    },
  });

  console.log('→ Seeding categories…');
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const existing = await prisma.category.findFirst({
      where: { slug: c.slug, ownerId: null },
    });
    const cat = existing
      ? await prisma.category.update({ where: { id: existing.id }, data: { ...c } })
      : await prisma.category.create({ data: { ...c, ownerId: null } });
    catMap[c.name] = cat.id;
    catMap[c.slug] = cat.id;
  }

  console.log('→ Seeding posts…');
  const posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    locale: string;
    visibility: 'public';
    category: string;
    tags: string[];
    coverImage: string | null;
    content: string;
  }> = []; // no sample posts shipped
  for (const p of posts) {
    const exists = await prisma.post.findUnique({ where: { slug: p.slug } });
    if (exists) {
      console.log(`  · skip (exists): ${p.slug}`);
      continue;
    }
    const tagConnections: { tagId: string }[] = [];
    for (const name of p.tags) {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}-]/gu, '');
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      tagConnections.push({ tagId: tag.id });
    }
    await prisma.post.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        coverImage: p.coverImage,
        locale: p.locale,
        visibility: p.visibility,
        published: true,
        publishedAt: new Date(),
        allowEmbed: true,
        authorId: admin.id,
        categoryId: catMap[p.category] ?? null,
        tags: tagConnections.length ? { create: tagConnections } : undefined,
      },
    });
    console.log(`  · created: ${p.slug}`);
  }

  console.log('✔ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
