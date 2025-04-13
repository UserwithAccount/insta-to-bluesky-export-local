"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  useEffect(() => {
    async function checkCredentials() {
      try {
        const res = await fetch("/api/credentials");
        const data = await res.json();
        if (data.success) setCredentialsSaved(true);
      } catch {
        setCredentialsSaved(false);
      }
    }
    checkCredentials();
  }, []);

  const toggleDark = () => {
    const newState = !isDark;
    setIsDark(newState);
    localStorage.setItem("theme", newState ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newState);
  };

  const handleCredentialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const handle = form.handle.value;
    const password = form.password.value;

    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, password }),
    });

    const data = await res.json();
    if (data.success) {
      setCredentialsSaved(true);
      setShowCredentialForm(false);
    } else {
      alert("Failed to save credentials");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900 transition-colors duration-300">
      <div className="text-center space-y-6">
        <button
          onClick={toggleDark}
          className="absolute top-4 right-4 p-2 rounded text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-zinc-800 transition"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Welcome to Bluesky Scheduler</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Upload and schedule your image posts.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/upload"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow text-lg"
          >
            Upload Folder
          </Link>
          <Link
            href="/db"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow text-lg"
          >
            View Scheduled Posts
          </Link>
        </div>

        {!credentialsSaved || showCredentialForm ? (
          <form
            onSubmit={handleCredentialSubmit}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 space-y-4 max-w-md mx-auto mt-10"
          >
            <h2 className="text-xl font-bold text-center text-zinc-800 dark:text-zinc-100">
              Save Bluesky Credentials
            </h2>
            <input
              name="handle"
              placeholder="Bluesky handle"
              className="w-full p-2 border rounded"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="App password"
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
            >
              Save Credentials
            </button>
          </form>
        ) : (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowCredentialForm(true)}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded shadow transition"
            >
              Re-enter Bluesky Credentials
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
