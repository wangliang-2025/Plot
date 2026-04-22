import { setRequestLocale, getTranslations } from 'next-intl/server';
import { listPosts } from '@/lib/posts';
import { listCategories } from '@/lib/categories';
import { auth } from '@/lib/auth';
import { PostsByCategory } from '@/components/posts-by-category';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('posts');

  const session = await auth();
  const canManage = Boolean(session?.user?.id);

  const [{ items }, userCats, allCats] = await Promise.all([
    listPosts({ locale, pageSize: 500 }),
    canManage
      ? listCategories({
          ownerId: session!.user.id,
          includeOwnerless: true,
        })
      : Promise.resolve([]),
    listCategories(),
  ]);

  const byId = new Map<string, (typeof allCats)[number]>();
  for (const c of allCats) byId.set(c.id, c);
  for (const c of userCats) byId.set(c.id, c);
  const mergedCategories = Array.from(byId.values());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-bold gradient-text">
          {t('title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <PostsByCategory
        initialCategories={mergedCategories}
        posts={items}
        canManage={canManage}
      />
    </div>
  );
}
