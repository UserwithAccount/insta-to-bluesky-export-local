import { prisma } from "@/lib/prisma";
import { BskyAgent } from "@atproto/api";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.CREDENTIAL_SECRET_KEY!;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export async function postToBluesky(postId: number) {
  throw new Error(`Simulated failure for post ${postId}`);

  // if (!SECRET_KEY) throw new Error("CREDENTIAL_SECRET_KEY is not set");

  // const post = await prisma.scheduledPost.findUnique({
  //   where: { id: postId },
  //   include: { images: true },
  // });

  // if (!post) throw new Error(`Post ${postId} not found`);

  // const credentials = await prisma.credential.findFirst({
  //   orderBy: { createdAt: "desc" },
  // });

  // if (!credentials) throw new Error("Bluesky credentials not found");

  // const decryptedPassword = CryptoJS.AES.decrypt(
  //   credentials.password,
  //   SECRET_KEY
  // ).toString(CryptoJS.enc.Utf8);

  // const agent = new BskyAgent({ service: "https://bsky.social" });
  // await agent.login({ identifier: credentials.handle, password: decryptedPassword });

  // const blobs = await Promise.all(
  //   post.images.map(async ({ imageUri }) => {
  //     const fullUrl = imageUri.startsWith("http")
  //       ? imageUri
  //       : `${BASE_URL}${imageUri.startsWith("/") ? "" : "/"}${imageUri}`;

  //     const res = await fetch(fullUrl);
  //     if (!res.ok) throw new Error(`Failed to fetch image: ${imageUri}`);

  //     const buffer = await res.arrayBuffer();
  //     return await agent.uploadBlob(new Uint8Array(buffer), {
  //       encoding: "image/jpeg",
  //     });
  //   })
  // );

  // await agent.post({
  //   text: post.title || "",
  //   embed: {
  //     $type: "app.bsky.embed.images",
  //     images: blobs.map((blob) => ({
  //       image: blob.data.blob,
  //       alt: "Image",
  //     })),
  //   },
  // });

  // await prisma.scheduledPost.update({
  //   where: { id: postId },
  //   data: { posted: true },
  // });
}
