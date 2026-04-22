/**
 * Tiny helper used by setup.mjs to decide whether to run the seed step.
 * Prints the post count to stdout, or exits with non-zero on error.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });
try {
  const n = await prisma.post.count();
  process.stdout.write(String(n));
  await prisma.$disconnect();
  process.exit(0);
} catch {
  await prisma.$disconnect().catch(() => {});
  process.exit(2);
}
