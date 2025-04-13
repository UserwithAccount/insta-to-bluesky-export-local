// scripts/test-prisma.ts
import { prisma } from "@/lib/prisma";

async function test() {
  const posts = await prisma.scheduledPost.findMany({
    include: { images: true },
  });
  console.log(posts);
}

test().catch(console.error);
