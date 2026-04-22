/**
 * Gitee Open API v5 客户端
 * 仅读取公开数据，无需 token 即可工作（速率上限 60 次/小时）
 * 配置 GITEE_ACCESS_TOKEN 后上限提升到 5000 次/小时
 *
 * 文档：https://gitee.com/api/v5/swagger
 */

const GITEE_API = 'https://gitee.com/api/v5';

// ISR：默认 1 小时刷新一次，避免频繁打 API
const REVALIDATE_SECONDS = 60 * 60;

export interface GiteeUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  blog: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  stared: number;
  watched: number;
  created_at: string;
}

export interface GiteeRepo {
  id: number;
  full_name: string;
  human_name: string;
  name: string;
  description: string | null;
  language: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  private: boolean;
  html_url: string;
  homepage: string | null;
  pushed_at: string;
  updated_at: string;
  created_at: string;
  license: string | null;
  owner: { login: string; avatar_url: string };
}

export interface GiteeProfile {
  user: GiteeUser;
  repos: GiteeRepo[];
}

interface FetchOptions {
  /** 强制不缓存（默认走 ISR 缓存） */
  noCache?: boolean;
  /** 自定义 revalidate 秒数 */
  revalidate?: number;
}

function withAuth(url: string): string {
  const token = process.env.GITEE_ACCESS_TOKEN?.trim();
  if (!token) return url;
  return url + (url.includes('?') ? '&' : '?') + `access_token=${encodeURIComponent(token)}`;
}

async function giteeFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = withAuth(`${GITEE_API}${path}`);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: opts.noCache
      ? { revalidate: 0 }
      : { revalidate: opts.revalidate ?? REVALIDATE_SECONDS, tags: ['gitee'] },
  });
  if (!res.ok) {
    throw new Error(`Gitee API ${res.status} on ${path}: ${await res.text().catch(() => '')}`);
  }
  return (await res.json()) as T;
}

/** 是否配置了 Gitee 用户名 */
export function isGiteeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GITEE_USERNAME?.trim());
}

export function getGiteeUsername(): string | null {
  const u = process.env.NEXT_PUBLIC_GITEE_USERNAME?.trim();
  return u && u.length > 0 ? u : null;
}

export async function fetchGiteeUser(username: string): Promise<GiteeUser> {
  return giteeFetch<GiteeUser>(`/users/${encodeURIComponent(username)}`);
}

export async function fetchGiteeRepos(
  username: string,
  options: { perPage?: number; sort?: 'created' | 'updated' | 'pushed' | 'full_name'; type?: 'all' | 'owner' | 'personal' | 'public' } = {}
): Promise<GiteeRepo[]> {
  const params = new URLSearchParams({
    sort: options.sort ?? 'updated',
    direction: 'desc',
    per_page: String(options.perPage ?? 30),
    type: options.type ?? 'personal',
  });
  return giteeFetch<GiteeRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?${params.toString()}`
  );
}

/** 获取完整的 Gitee 个人主页数据；任一接口失败都会向外抛 */
export async function fetchGiteeProfile(username: string): Promise<GiteeProfile> {
  const [user, repos] = await Promise.all([
    fetchGiteeUser(username),
    fetchGiteeRepos(username, { perPage: 30, sort: 'updated', type: 'personal' }),
  ]);
  return { user, repos };
}

/**
 * 安全获取：失败时返回 null，让页面渲染降级 UI
 * 不会让整个 page 渲染崩掉
 */
export async function safeGetGiteeProfile(): Promise<
  | { ok: true; data: GiteeProfile; username: string }
  | { ok: false; reason: 'unconfigured' }
  | { ok: false; reason: 'fetch_failed'; error: string; username: string }
> {
  const username = getGiteeUsername();
  if (!username) return { ok: false, reason: 'unconfigured' };
  try {
    const data = await fetchGiteeProfile(username);
    return { ok: true, data, username };
  } catch (err) {
    return {
      ok: false,
      reason: 'fetch_failed',
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
}

/** 常见编程语言对应的颜色（参考 GitHub Linguist） */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  PowerShell: '#012456',
  Lua: '#000080',
  R: '#198CE7',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Perl: '#0298c3',
  ObjectiveC: '#438eff',
  'Objective-C': '#438eff',
  Vim: '#199f4b',
  Markdown: '#083fa1',
  Dockerfile: '#384d54',
};

export function languageColor(lang: string | null | undefined): string {
  if (!lang) return '#9ca3af';
  return LANGUAGE_COLORS[lang] ?? '#a78bfa';
}
