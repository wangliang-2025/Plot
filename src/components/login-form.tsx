'use client';

import { signIn } from 'next-auth/react';
import { Link, useRouter } from '@/i18n/routing';
import { useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, LogIn } from 'lucide-react';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(t('invalid_credentials'));
        return;
      }
      router.push('/notes');
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="card glass-strong relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(var(--aurora-2))] to-[hsl(var(--aurora-4))] opacity-30 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))] text-white shadow-lg shadow-[hsl(var(--aurora-1)/0.4)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold gradient-text">{t('login_title')}</h1>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">{t('login_subtitle')}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('password')}
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn-accent w-full">
              <LogIn className="h-4 w-4" />
              {isPending ? t('signing_in') : t('sign_in')}
            </button>

            <p className="pt-1 text-center text-xs text-muted-foreground">
              <Link href="/register" className="hover:text-[hsl(var(--accent))]">
                {t('to_register')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
