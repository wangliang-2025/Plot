import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const stack = [
    'Next.js 15 (App Router)',
    'React 19',
    'TypeScript',
    'Tailwind CSS v3',
    'Prisma + SQLite',
    'Auth.js v5',
    'next-intl',
    'rehype-pretty-code (Shiki)',
    'KaTeX',
    'Liquid Glass UI',
  ];

  return (
    <div className="container-prose py-16">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-bold gradient-text">{t('title')}</h1>
      </header>

      <div className="card p-8">
        <div className="article">
          <p>{t('intro')}</p>
          <p>
            {locale === 'zh'
              ? '这里会写一些关于技术、阅读和生活的小事。希望你也能从中找到一些共鸣。'
              : 'I write here about technology, books and the small joys of everyday life. Hope you find something useful.'}
          </p>

          <h2 className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--accent))]" /> {t('tech_stack')}
          </h2>
          <ul>
            {stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
