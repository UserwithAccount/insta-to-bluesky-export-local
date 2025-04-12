"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file, file.webkitRelativePath || file.name);
    }

    setStatus("📤 Uploading...");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ Uploaded ${data.count} posts! Redirecting...`);
        setTimeout(() => {
          router.push("/preview");
        }, 1500);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Upload failed", err);
      setStatus("❌ Upload failed. Check console for details.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Upload Folder</h1>
        <input
          type="file"
          name="files"
          {...({
            webkitdirectory: "true",
            directory: "true",
            multiple: true,
          } as React.HTMLProps<HTMLInputElement>)}
          onChange={handleFolderUpload}
          className="mb-4 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-100"
        />
        <p className="text-center text-sm text-gray-700">{status}</p>
      </div>
    </main>
  );
}
