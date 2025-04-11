"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DirectoryInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

export default function UploadPage() {
  const [message, setMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("files") as HTMLInputElement;
    if (!input?.files || input.files.length === 0) {
      setMessage("Please select a folder with your files.");
      return;
    }

    const formData = new FormData();

    // Append all files. The third parameter uses file.webkitRelativePath to preserve folder structure.
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files.item(i);
      if (file) {
        formData.append("files", file, file.webkitRelativePath);
      }
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success: ${data.count} images processed.`);
        setUploadSuccess(true);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload error: check console.");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Upload Folder (JSON + Images)</h1>
      <form onSubmit={handleUpload} className="mt-4 space-y-4">
        <input
          type="file"
          name="files"
          // The following attributes allow selection of an entire folder.
          {...({ webkitdirectory: "true", directory: "true", multiple: true } as DirectoryInputProps)}

          className="border p-2"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Upload Folder
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
      {uploadSuccess && (
        <button
          onClick={() => router.push("/preview")}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Go to Preview
        </button>
      )}
    </main>
  );
}
