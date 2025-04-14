"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  const startPolling = (id: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/uploadLogs?uploadId=${id}`);
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      } catch {
        // Silent fail
      }
    }, 800);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file, file.webkitRelativePath || file.name);
    }

    const id = crypto.randomUUID();
    setUploadId(id);
    setUploading(true);
    setProgress(0);
    setLogs(["📂 Upload started..."]);

    startPolling(id);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/upload?uploadId=${id}`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        stopPolling();

        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              addLog(`✅ Uploaded ${data.count} posts.`);
              addLog("📦 Redirecting to preview...");
              setTimeout(() => router.push("/preview"), 1500);
            } else {
              addLog(`❌ Error: ${data.error || "Unknown error"}`);
            }
          } catch (err) {
            addLog("❌ Failed to parse response from server.");
          }
        } else {
          addLog("❌ Upload failed.");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        stopPolling();
        addLog("❌ Upload failed due to a network error.");
      };

      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      stopPolling();
      console.error("Upload error:", err);
      addLog("❌ Upload error occurred.");
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
