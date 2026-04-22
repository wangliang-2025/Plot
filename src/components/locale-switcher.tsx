'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Languages } from 'lucide-react';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const next = locale === 'zh' ? 'en' : 'zh';

  const handleSwitch = () => {
    router.replace(
      // @ts-expect-error - next-intl typed pathnames
      { pathname, params },
      { locale: next }
    );
  };

  return (
    <button
      onClick={handleSwitch}
      className="btn-ghost h-9 gap-1.5 px-2.5 text-xs font-medium uppercase"
      aria-label="Switch language"
      title={`Switch to ${next.toUpperCase()}`}
    >
      <Languages className="h-4 w-4" />
      <span>{next}</span>
    </button>
  );
}
