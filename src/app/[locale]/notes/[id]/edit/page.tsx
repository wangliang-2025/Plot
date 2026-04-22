import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listCategories } from '@/lib/categories';
import { PostEditor } from '@/components/post-editor';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditNotePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect({ href: '/login', locale });

  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
  if (!post) notFound();

  // Only owner or admin can edit
  if (post.authorId !== session!.user.id && session!.user.role !== 'admin') {
    notFound();
  }

  const t = await getTranslations('notes');
  const cats = await listCategories({ ownerId: session!.user.id, includeOwnerless: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/notes" className="btn-ghost mb-6 h-9">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('back')}
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold">{post.title}</h1>
      </header>
      <PostEditor
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          coverImage: post.coverImage,
          content: post.content,
          locale: post.locale,
          visibility: post.visibility as 'public' | 'private' | 'unlisted',
          published: post.published,
          allowEmbed: post.allowEmbed,
          categoryId: post.categoryId,
          tags: post.tags.map((pt) => pt.tag.name),
        }}
        categories={cats}
      />
    </div>
  );
}
