"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const scrollToBottom = () => logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [logs]);
  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const fetchAllFileNames = async (): Promise<Set<string>> => {
    const bucket = "your-bucket-name"; // Replace with your actual bucket name
    let { data, error } = await supabase
  .rpc('get_all_filenames', {
    bucket: "uploads"
  })
if (error) console.error(error)
else console.log(data)

    if (error) {
      console.error("Error fetching filenames from SQL function:", error.message);
      return new Set();
    }

    const filenames = data?.map((entry: { name: string }) => entry.name) || [];
    return new Set(filenames);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setLogs(["📂 Upload started..."]);
    let uploadedCount = 0;

    const jsonFile = Array.from(files).find((f) => f.name.endsWith(".json"));
    if (!jsonFile) {
      addLog("❌ JSON file missing.");
      setUploading(false);
      return;
    }

    const existingFilenames = await fetchAllFileNames();
    console.log("Fetched files from Supabase:", existingFilenames);

    const jsonText = await jsonFile.text();
    const rawPosts = JSON.parse(jsonText);

    const imageMap = new Map<string, File>();
    for (const file of Array.from(files)) {
      if (file !== jsonFile) imageMap.set(file.name, file);
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

      const title = decodeURIComponent(escape(rawTitle)).replace(/\\n/g, "\n");
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

        if (existingFilenames.has(fileName)) {
          addLog(`⏭️ Skipped (already exists): ${fileName}`);
        } else {
          const { error } = await supabase.storage.from("uploads").upload(fileName, file, {
            upsert: false,
            contentType: file.type,
          });

          if (error) {
            if (error.message.includes("resource already exists")) {
              addLog(`⏭️ Skipped (already exists): ${fileName}`);
            } else {
              addLog(`❌ Failed: ${fileName} (${error.message})`);
              continue;
            }
          } else {
            addLog(`✅ Uploaded: ${fileName}`);
            uploadedCount++;
          }

          existingFilenames.add(fileName);
        }

        const publicUrl = supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl;
        imageUris.push(publicUrl);
        setProgress(Math.round((uploadedCount / files.length) * 100));
      }

      if (imageUris.length > 0) {
        output.push({ postId, title, hasMention, images: imageUris });
      }
    }

    const jsonBlob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });

    const { error: jsonError } = await supabase.storage
      .from("uploads")
      .upload(`uploadData.json`, jsonBlob, {
        upsert: true,
        contentType: "application/json",
      });

    if (jsonError) {
      addLog("❌ Failed to upload uploadData.json");
    } else {
      addLog("📦 uploadData.json saved to Supabase");
    }

    const res = await fetch("/api/schedulePosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(output),
    });

    if (res.ok) {
      addLog("🎉 Scheduled successfully");
      setTimeout(() => router.push("/db"), 1500);
    } else {
      addLog("❌ Failed to schedule posts");
    }

    setUploading(false);
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
            {...({ webkitdirectory: "true", directory: "true", multiple: true } as any)}
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
