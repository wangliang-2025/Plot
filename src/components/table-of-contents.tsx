'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/lib/markdown';

interface Props {
  items: TocItem[];
}

export function TableOfContents({ items }: Props) {
  const t = useTranslations('post');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <div className="reader-toc p-2.5">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('toc')}
          </p>
          <ul className="max-h-[calc(100vh-12rem)] space-y-0.5 overflow-auto pr-0.5 text-[11px] leading-tight">
            {items.map((item) => (
              <li key={item.id} style={{ paddingLeft: `${(item.depth - 1) * 8}px` }}>
                <a
                  href={`#${item.id}`}
                  className={cn(
                    'block truncate border-l-2 border-transparent py-0.5 pl-2 text-muted-foreground transition hover:text-[hsl(var(--accent))]',
                    activeId === item.id &&
                      'border-l-[hsl(var(--accent))] text-[hsl(var(--accent))] font-medium'
                  )}
                  title={item.text}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
