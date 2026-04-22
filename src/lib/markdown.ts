import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

// ─── Sanitize schemas ────────────────────────────────────────────────
// Common presentational tags allowed in both schemas.
const baseExtraTags = [
  'figure',
  'figcaption',
  'details',
  'summary',
  'mark',
  'kbd',
  'sup',
  'sub',
  'span',
  'div',
];

const baseAttributes = {
  ...defaultSchema.attributes,
  img: [...(defaultSchema.attributes?.img ?? []), 'loading', 'decoding'],
  a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
  div: ['className', 'class', 'data*'],
  span: ['className', 'class', 'data*', 'style'],
  code: [...(defaultSchema.attributes?.code ?? []), 'className', 'data*'],
  pre: [...(defaultSchema.attributes?.pre ?? []), 'className', 'data*', 'style'],
  figure: ['className', 'class', 'data*'],
};

// Stricter schema: NO iframe / video / audio (used when allowEmbed=false)
const safeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...baseExtraTags],
  attributes: baseAttributes,
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https', 'data'],
  },
};

// Permissive schema: allow iframe / video / audio for embedding external content.
const embedSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    ...baseExtraTags,
    'iframe',
    'video',
    'audio',
    'source',
  ],
  attributes: {
    ...baseAttributes,
    iframe: [
      'src',
      'width',
      'height',
      'allow',
      'allowfullscreen',
      'frameborder',
      'loading',
      'referrerpolicy',
      'sandbox',
      'title',
      'name',
    ],
    video: [
      'src',
      'controls',
      'autoplay',
      'loop',
      'muted',
      'poster',
      'width',
      'height',
    ],
    audio: ['src', 'controls', 'loop', 'muted'],
    source: ['src', 'type'],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https', 'data'],
  },
};

const buildProcessor = (allowEmbed: boolean) => {
  const schema = allowEmbed ? embedSchema : safeSchema;
  // Always apply rehypeRaw + rehypeSanitize so that any raw HTML from user
  // markdown is parsed into real HAST nodes and then sanitized. Skipping
  // sanitize combined with `rehypeStringify({ allowDangerousHtml: true })`
  // would expose an XSS hole.
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['heading-anchor'] },
    })
    .use(rehypeKatex)
    .use(rehypePrettyCode, {
      theme: { dark: 'github-dark', light: 'github-light' },
      keepBackground: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true });
};

export async function renderMarkdown(
  markdown: string,
  opts: { allowEmbed?: boolean } = {}
): Promise<string> {
  const file = await buildProcessor(opts.allowEmbed ?? true).process(markdown);
  let html = String(file);
  // Wrap iframes for responsive display (only present when allowEmbed=true).
  html = html.replace(
    /<iframe([^>]*)><\/iframe>/g,
    '<div class="embed-wrapper"><iframe$1 loading="lazy"></iframe></div>'
  );
  return html;
}

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n');
  const toc: TocItem[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    const text = match[2].replace(/[#*`_~]/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');

    if (id) toc.push({ id, text, depth });
  }

  return toc;
}
