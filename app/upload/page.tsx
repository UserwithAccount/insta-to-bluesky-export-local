"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const scrollToBottom = () => logEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => scrollToBottom(), [logs]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setLogs(["📂 Upload started..."]);
    let uploadedCount = 0;

    const jsonFile = Array.from(files).find((f) => f.name.endsWith(".json"));
    if (!jsonFile) {
      addLog("❌ JSON file missing.");
      return setUploading(false);
    }

    const jsonText = await jsonFile.text();
    const rawPosts = JSON.parse(jsonText);

    const imageMap = new Map<string, File>();
    for (const file of Array.from(files)) {
      if (file !== jsonFile) {
        imageMap.set(file.name, file);
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
        post.creation_timestamp?.toString() ||
        media[0]?.creation_timestamp?.toString() ||
        crypto.randomUUID();

      const rawTitle =
        post.title?.trim() ||
        media.find((m: any) => m.title?.trim())?.title?.trim() ||
        "Untitled";

      const title = rawTitle.replace(/\\n/g, "\n");
      const hasMention = /@\w+/.test(title);
      const imageUris: string[] = [];

      for (const item of media) {
        const fileName = item.uri.split("/").pop();
        if (!fileName) continue;

        const file = imageMap.get(fileName);
        if (!file) {
          addLog(`⚠️ Missing file: ${fileName}`);
          continue;
        }

        const { data: existing } = await supabase.storage
          .from("uploads")
          .list("", { search: fileName });

        if (existing?.some((f) => f.name === fileName)) {
          addLog(`⏭️ Skipped (already exists): ${fileName}`);
          imageUris.push(`${supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl}`);
          continue;
        }

        const { error } = await supabase.storage
          .from("uploads")
          .upload(fileName, file, {
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          addLog(`❌ Failed: ${fileName}`);
        } else {
          uploadedCount++;
          addLog(`✅ Uploaded: ${fileName}`);
          imageUris.push(`${supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl}`);
        }

        setProgress(Math.round((uploadedCount / files.length) * 100));
      }

      if (imageUris.length > 0) {
        output.push({ postId, title, hasMention, images: imageUris });
      }
    }

    // Upload uploadData.json
    const jsonBuffer = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });

    const { error: jsonError } = await supabase.storage
      .from("uploads")
      .upload("uploadData.json", jsonBuffer, { upsert: true });

    if (jsonError) {
      addLog("❌ Failed to upload uploadData.json");
    } else {
      addLog("📦 uploadData.json saved to Supabase");
    }

    setUploading(false);
    addLog("🎉 Upload complete! Redirecting...");
    setTimeout(() => router.push("/preview"), 1500);
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-zinc-900 dark:text-white">
          Upload Folder
        </h1>

        <label className="block w-full text-center mb-4">
          <input
            type="file"
            name="files"
            {...({
              webkitdirectory: "true",
              directory: "true",
              multiple: true,
            } as React.HTMLProps<HTMLInputElement>)}
            onChange={handleFolderUpload}
            className="hidden"
          />
          <div className="cursor-pointer px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
            Select Folder
          </div>
        </label>

        {uploading && (
          <div className="mb-6">
            <div className="text-center text-sm text-zinc-700 dark:text-zinc-300 mb-1">
              Uploading... {progress}%
            </div>
            <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-zinc-100 dark:bg-zinc-700 rounded-md p-4 h-64 overflow-y-auto text-sm text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </main>
  );
}
