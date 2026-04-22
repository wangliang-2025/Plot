import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/db';
import {
  FileText,
  Eye,
  MessageSquare,
  Hash,
  Folder,
  PlusCircle,
  Upload,
  Users,
} from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');

  const [postCount, publishedCount, commentCount, tagCount, catCount, userCount, totalViews] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true, visibility: 'public' } }),
    prisma.comment.count(),
    prisma.tag.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
  ]);

  const stats = [
    {
      icon: FileText,
      label: 'Posts',
      value: postCount,
      sub: `${publishedCount} ${t('published').toLowerCase()}`,
      grad: 'from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))]',
    },
    { icon: Eye, label: 'Views', value: totalViews._sum.views ?? 0, grad: 'from-[hsl(var(--aurora-2))] to-[hsl(var(--aurora-4))]' },
    { icon: MessageSquare, label: 'Comments', value: commentCount, grad: 'from-[hsl(var(--aurora-3))] to-[hsl(var(--aurora-1))]' },
    { icon: Hash, label: 'Tags', value: tagCount, grad: 'from-[hsl(var(--aurora-4))] to-[hsl(var(--aurora-2))]' },
    { icon: Folder, label: 'Categories', value: catCount, grad: 'from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-3))]' },
    { icon: Users, label: 'Users', value: userCount, grad: 'from-[hsl(var(--aurora-2))] to-[hsl(var(--aurora-3))]' },
  ];

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold gradient-text">{t('dashboard')}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/notes/new" className="btn-accent h-9">
            <PlusCircle className="h-3.5 w-3.5" /> {t('new_post')}
          </Link>
          <Link href="/admin/upload" className="btn-secondary h-9">
            <Upload className="h-3.5 w-3.5" /> {t('upload_md')}
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card glass relative overflow-hidden p-5">
            <div className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${s.grad} opacity-25 blur-2xl`} />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${s.grad} text-white`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="relative mt-4 text-3xl font-bold">{s.value}</p>
            {s.sub && <p className="relative mt-1 text-xs text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
