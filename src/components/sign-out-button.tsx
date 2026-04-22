'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const t = useTranslations('nav');
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/40 dark:hover:bg-white/5"
    >
      <LogOut className="h-4 w-4" />
      {t('logout')}
    </button>
  );
}
