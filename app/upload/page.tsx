// pages/upload/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file, file.webkitRelativePath || file.name);
    }

    const uploadId = Date.now().toString();
    try {
      const res = await fetch(`/api/upload?uploadId=${uploadId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`✅ Upload complete. ${data.count} posts uploaded.`);
        setTimeout(() => router.push("/preview"), 1500);
      } else {
        addLog(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      addLog("❌ Upload failed.");
      console.error(err);
    } finally {
      setUploading(false);
    }
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
