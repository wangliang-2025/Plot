/**
 * GitHub REST API v3 client.
 *
 * Reads public profile + repositories. Works unauthenticated (60 req/hr per
 * IP); setting GITHUB_ACCESS_TOKEN raises the rate limit to 5,000 req/hr and
 * unlocks access to private repos/orgs you own.
 *
 * Docs: https://docs.github.com/en/rest
 */

const GITHUB_API = 'https://api.github.com';

// ISR: refresh every hour by default so a busy page doesn't hit the API.
const REVALIDATE_SECONDS = 60 * 60;

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  blog: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
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
  license: { spdx_id: string | null; name: string | null } | null;
  topics?: string[];
  owner: { login: string; avatar_url: string };
}

export interface GitHubProfile {
  user: GitHubUser;
  repos: GitHubRepo[];
}

interface FetchOptions {
  noCache?: boolean;
  revalidate?: number;
}

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_ACCESS_TOKEN?.trim();
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: opts.noCache
      ? { revalidate: 0 }
      : { revalidate: opts.revalidate ?? REVALIDATE_SECONDS, tags: ['github'] },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export function isGithubConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GITHUB_USERNAME?.trim());
}

export function getGithubUsername(): string | null {
  const u = process.env.NEXT_PUBLIC_GITHUB_USERNAME?.trim();
  return u && u.length > 0 ? u : null;
}

export async function fetchGithubUser(username: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);
}

export async function fetchGithubRepos(
  username: string,
  options: {
    perPage?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    type?: 'all' | 'owner' | 'member';
  } = {}
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    sort: options.sort ?? 'updated',
    direction: 'desc',
    per_page: String(options.perPage ?? 30),
    type: options.type ?? 'owner',
  });
  return githubFetch<GitHubRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?${params.toString()}`
  );
}

export async function fetchGithubProfile(username: string): Promise<GitHubProfile> {
  const [user, repos] = await Promise.all([
    fetchGithubUser(username),
    fetchGithubRepos(username, { perPage: 30, sort: 'updated', type: 'owner' }),
  ]);
  return { user, repos };
}

/**
 * Safe variant — returns a typed discriminated union so pages can render
 * a graceful fallback UI when the username is missing or the API is down.
 */
export async function safeGetGithubProfile(): Promise<
  | { ok: true; data: GitHubProfile; username: string }
  | { ok: false; reason: 'unconfigured' }
  | { ok: false; reason: 'fetch_failed'; error: string; username: string }
> {
  const username = getGithubUsername();
  if (!username) return { ok: false, reason: 'unconfigured' };
  try {
    const data = await fetchGithubProfile(username);
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

/** GitHub Linguist language colors (curated subset). */
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
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
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
  MDX: '#fcb32c',
  Solidity: '#AA6746',
};

export function languageColor(lang: string | null | undefined): string {
  if (!lang) return '#9ca3af';
  return LANGUAGE_COLORS[lang] ?? '#a78bfa';
}
