// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const storage = multer.memoryStorage();
const upload = multer({ storage }).any();

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

function decodeUtf8String(input: string): string {
  try {
    const decoder = new TextDecoder("utf-8");
    const bytes = new Uint8Array([...input].map((c) => c.charCodeAt(0)));
    return decoder.decode(bytes);
  } catch {
    return input;
  }
}

function formatTitle(title: string): string {
  let decoded = decodeUtf8String(title);
  decoded = decoded.replace(/\\n/g, "\n");
  return decoded;
}

declare global {
  var uploadLogs: Record<string, string[]> | undefined;
}

if (!global.uploadLogs) global.uploadLogs = {};

function pushLog(uploadId: string, message: string) {
  if (!global.uploadLogs![uploadId]) global.uploadLogs![uploadId] = [];
  global.uploadLogs![uploadId].push(message);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const uploadId = req.query.uploadId as string;
  if (!uploadId) return res.status(400).json({ error: "Missing uploadId" });

  try {
    await runMiddleware(req, res, upload);

    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      pushLog(uploadId, "❌ No files received.");
      return res.status(400).json({ error: "No files received" });
    }

    const jsonFile = files.find((file) => file.originalname.endsWith(".json"));
    if (!jsonFile) {
      pushLog(uploadId, "❌ No JSON file found.");
      return res.status(400).json({ error: "No JSON file found" });
    }

    const jsonText = jsonFile.buffer.toString("utf-8");
    const rawPosts = JSON.parse(jsonText);

    const imageMap = new Map<string, Express.Multer.File>();
    for (const file of files) {
      if (file !== jsonFile) {
        const name = path.basename(file.originalname);
        imageMap.set(name, file);
      }
    }

    const output: {
      postId: string;
      title: string;
      hasMention: boolean;
      images: string[];
    }[] = [];

    for (const post of rawPosts) {
      const media = Array.isArray(post.media) ? post.media : [];
      const postId =
        post.creation_timestamp?.toString() || media[0]?.creation_timestamp?.toString() || uuidv4();

      const rawTitle =
        post.title?.trim() ||
        media.find((m: any) => m.title?.trim())?.title?.trim() ||
        "Untitled";

      const title = formatTitle(rawTitle);
      const hasMention = /@\w+/.test(title);

      const imageUris: string[] = [];

      for (const item of media) {
        const fileName = path.basename(item.uri);
        const file = imageMap.get(fileName);
        if (!file) {
          pushLog(uploadId, `⚠️ Missing file: ${fileName}`);
          continue;
        }

        const existing = await supabase.storage.from("uploads").list("", {
          search: fileName,
        });

        if (existing.data?.some((obj) => obj.name === fileName)) {
          pushLog(uploadId, `⏭️ Skipped (already exists): ${fileName}`);
          imageUris.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`);
          continue;
        }

        const { error } = await supabase.storage
          .from("uploads")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          pushLog(uploadId, `❌ Supabase upload failed: ${error.message}`);
        } else {
          pushLog(uploadId, `✅ Uploaded: ${fileName}`);
          imageUris.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`);
        }
      }

      if (imageUris.length > 0) {
        output.push({ postId, title, hasMention, images: imageUris });
      }
    }

    // Upload uploadData.json to Supabase Storage
    const jsonBuffer = Buffer.from(JSON.stringify(output, null, 2), "utf-8");
    const { error: jsonUploadError } = await supabase.storage
      .from("uploads")
      .upload("uploadData.json", jsonBuffer, {
        contentType: "application/json",
        upsert: true,
      });

    if (jsonUploadError) {
      pushLog(uploadId, `❌ Failed to upload uploadData.json: ${jsonUploadError.message}`);
    } else {
      pushLog(uploadId, "✅ uploadData.json saved to Supabase");
    }

    return res.status(200).json({ success: true, count: output.length });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    pushLog(req.query.uploadId as string, "❌ Upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
}
