import { prisma } from "@/lib/prisma";
import { AtpAgent } from "@atproto/api";
import CryptoJS from "crypto-js";
import fs from "fs/promises";
import path from "path";

const SECRET_KEY = process.env.CREDENTIAL_SECRET_KEY!;
const BSKY_API_URL = process.env.BSKY_API_URL || "https://bsky.social";

export async function postToBluesky(postId: number) {
  if (!SECRET_KEY) throw new Error("CREDENTIAL_SECRET_KEY is not set");

  const post = await prisma.scheduledPost.findUnique({
    where: { id: postId },
    include: { images: true },
  });

  if (!post) throw new Error(`Post ${postId} not found`);

  const credentials = await prisma.credential.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!credentials) throw new Error("Bluesky credentials not found");

  const decryptedPassword = CryptoJS.AES.decrypt(
    credentials.password,
    SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  const client = new AtpAgent({ service: BSKY_API_URL });
  await client.login({
    identifier: credentials.handle,
    password: decryptedPassword,
  });

  const blobs = await Promise.all(
    post.images.map(async ({ imageUri }) => {
      const filePath = path.join(process.cwd(), "public", imageUri.replace(/^\/uploads\//, "uploads/"));

      let fileBuffer: Buffer;
      try {
        fileBuffer = await fs.readFile(filePath);
      } catch (err) {
        throw new Error(`Failed to read local image file: ${filePath}`);
      }

      const uploaded = await client.com.atproto.repo.uploadBlob(fileBuffer, {
        encoding: "image/jpeg",
      });

      return uploaded.data.blob;
    })
  );

  await client.com.atproto.repo.createRecord({
    repo: client.session?.did ?? (() => { throw new Error("Client session is undefined"); })(),
    collection: "app.bsky.feed.post",
    record: {
      $type: "app.bsky.feed.post",
      text: post.title || "",
      createdAt: new Date().toISOString(),
      embed: {
        $type: "app.bsky.embed.images",
        images: blobs.map((blob) => ({
          image: blob,
          alt: "Image",
        })),
      },
    },
  });

  await prisma.scheduledPost.update({
    where: { id: postId },
    data: { posted: true },
  });

  return true;
}
