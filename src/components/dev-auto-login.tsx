'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Sparkles, Check } from 'lucide-react';

/**
 * 仅开发环境工作的自动登录组件
 *
 * 触发条件（必须同时满足）：
 *   1. process.env.NODE_ENV === 'development'
 *   2. 当前 URL 含 ?autologin=1
 *   3. 当前 session 未登录
 *
 * 行为：
 *   - fetch /api/dev/auto-login 拿到 admin 凭据
 *   - 调 next-auth 客户端 signIn('credentials', ...)
 *   - 成功后清掉 URL 上的 ?autologin 参数（避免刷新时重复触发）
 *   - 在屏幕右下角显示一个小"已自动登录"提示气泡，3 秒后消失
 *
 * 生产环境：组件渲染但内部 useEffect 第一行就 return，无副作用。
 */
export function DevAutoLogin() {
  const { data: session, status } = useSession();
  const [bubble, setBubble] = useState<'pending' | 'ok' | 'fail' | null>(null);
  const [bubbleMsg, setBubbleMsg] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (status === 'loading') return;
    if (ranRef.current) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('autologin') !== '1') return;

    // 已登录就直接清掉参数，不再尝试登录
    if (session?.user?.id) {
      url.searchParams.delete('autologin');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    ranRef.current = true;
    setBubble('pending');
    setBubbleMsg('正在自动登录…');

    (async () => {
      try {
        const res = await fetch('/api/dev/auto-login', { cache: 'no-store' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const { email, password } = await res.json();
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          throw new Error(result.error);
        }

        // 成功 — 清掉 URL 参数
        url.searchParams.delete('autologin');
        window.history.replaceState({}, '', url.toString());

        setBubble('ok');
        setBubbleMsg(`已自动登录 ${email}`);
        setTimeout(() => setBubble(null), 3000);

        // 让 RSC 重新拉取（首页 CTA 切换需要新 session）
        // 用 location.reload 最稳妥（dev 环境无所谓性能）
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        setBubble('fail');
        setBubbleMsg(
          err instanceof Error ? `自动登录失败：${err.message}` : '自动登录失败'
        );
        setTimeout(() => setBubble(null), 6000);
      }
    })();
  }, [session, status]);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!bubble) return null;

  const palette = {
    pending: 'bg-white/70 dark:bg-white/10 text-foreground',
    ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    fail: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  } as const;

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 inline-flex max-w-sm items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur ${palette[bubble]}`}
      style={{
        animation: 'fadeInUp 0.4s var(--ease-fluid) both',
      }}
    >
      {bubble === 'pending' && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {bubble === 'ok' && <Check className="h-3.5 w-3.5" />}
      {bubble === 'fail' && <Sparkles className="h-3.5 w-3.5" />}
      <span>{bubbleMsg}</span>
    </div>
  );
}
