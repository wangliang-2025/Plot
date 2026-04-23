/**
 * One-off cleanup script: removes the three global seed categories
 * (essays / tech / reading) and the three sample posts (welcome-to-ink,
 * liquid-glass-design, hello-world) from the connected database.
 *
 * Usage:
 *   pnpm tsx scripts/remove-seed-data.ts
 *   (or) npx tsx scripts/remove-seed-data.ts
 *
 * Safe to re-run: missing rows are silently skipped.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_CATEGORY_SLUGS = ['essays', 'tech', 'reading'];
const SEED_POST_SLUGS = [
  'welcome-to-ink',
  'liquid-glass-design',
  'hello-world',
];

async function main() {
  console.log('→ Removing sample posts…');
  for (const slug of SEED_POST_SLUGS) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) {
      console.log(`  · skip (not found): ${slug}`);
      continue;
    }
    // Delete dependants that lack ON DELETE cascade explicitly, to be safe.
    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    await prisma.comment.deleteMany({ where: { postId: post.id } });
    await prisma.post.delete({ where: { id: post.id } });
    console.log(`  · deleted post: ${slug}`);
  }

  console.log('→ Removing global seed categories…');
  for (const slug of SEED_CATEGORY_SLUGS) {
    const cat = await prisma.category.findFirst({
      where: { slug, ownerId: null },
    });
    if (!cat) {
      console.log(`  · skip (not found): ${slug}`);
      continue;
    }
    // Detach any posts still pointing at the category (set to null).
    await prisma.post.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: null },
    });
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`  · deleted category: ${slug}`);
  }

  // Clean up orphan tags that were created only for the sample posts.
  const orphanTags = await prisma.tag.findMany({
    where: { posts: { none: {} } },
    select: { id: true, slug: true },
  });
  for (const t of orphanTags) {
    await prisma.tag.delete({ where: { id: t.id } });
    console.log(`  · removed orphan tag: ${t.slug}`);
  }

  console.log('✔ Seed cleanup completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
