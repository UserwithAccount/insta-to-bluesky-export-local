"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import toast, { Toaster } from "react-hot-toast";

type ScheduledPost = {
  title: string;
  images: string[];
  scheduledTime?: string;
  hasMention?: boolean;
};

export default function PreviewPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [error, setError] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [intervalHours, setIntervalHours] = useState<number>(24);
  const [filterMentionsOnly, setFilterMentionsOnly] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/listUploads");
        const data = await res.json();
        if (data.success) {
          const enriched = data.posts.map((post: ScheduledPost) => ({
            ...post,
            scheduledTime: post.scheduledTime || "",
          }));
          setPosts(enriched);
        } else {
          setError("Failed to load posts.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Error loading posts.");
      }
    }

    fetchPosts();
  }, []);

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...posts];
    updated[index].title = newTitle;
    setPosts(updated);
  };

  const handleTimeChange = (index: number, newTime: string) => {
    const updated = [...posts];
    updated[index].scheduledTime = newTime;
    setPosts(updated);
  };

  const removePost = (postToRemove: ScheduledPost) => {
    const updated = posts.filter((post) => post !== postToRemove);
    setPosts(updated);
    toast.success("Post removed");
  };

  const generatePeriodicSchedule = () => {
    if (!startDate) {
      toast.error("Please select a start date & time.");
      return;
    }
    const base = new Date(startDate).getTime();
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const updated = posts.map((post, i) => ({
      ...post,
      scheduledTime: new Date(base + i * intervalMs).toISOString().slice(0, 16),
    }));
    setPosts(updated);
    toast.success("Times generated");
  };

  const saveSinglePost = async (post: ScheduledPost) => {
    try {
      const res = await fetch("/api/schedulePosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([post]), // single post in array
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`❌ Failed to save post: ${data.error || "Unknown error"}`);
      } else {
        toast.success(`✅ Post saved to DB`);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("❌ Failed to save post");
    }
  };


  const schedulePosts = async () => {
    const batchSize = 5;
    const delay = 200;
    let totalScheduled = 0;

    const chunks = Array.from({ length: Math.ceil(posts.length / batchSize) }, (_, i) =>
      posts.slice(i * batchSize, i * batchSize + batchSize)
    );

    for (const [index, chunk] of chunks.entries()) {
      try {
        const res = await fetch("/api/schedulePosts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chunk),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(`Batch ${index + 1} failed: ${data.error || "Unknown error"}`);
          break;
        }

        totalScheduled += data.count;
        toast.success(`✅ Batch ${index + 1}: ${data.count} post(s)`);
        await new Promise((r) => setTimeout(r, delay));
      } catch (err) {
        console.error("Error during batch scheduling:", err);
        toast.error(`❌ Error during batch ${index + 1}`);
        break;
      }
    }

    toast.success(`🎉 Scheduled ${totalScheduled} post(s)! Redirecting...`);
    setTimeout(() => router.push("/db"), 2000);
  };

  const SchedulingControls = () => (
    <div className="bg-white shadow-md rounded-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Periodic Scheduling</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full">
          <label className="block mb-1 font-medium">Start Date & Time</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="w-full">
          <label className="block mb-1 font-medium">Interval (hours)</label>
          <input
            type="number"
            min={1}
            value={intervalHours}
            onChange={(e) => setIntervalHours(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={generatePeriodicSchedule}
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 self-end"
        >
          Generate
        </button>
      </div>
    </div>
  );

  return (
    <main className="bg-gray-100 min-h-screen py-8">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-zinc-900">
          Preview & Schedule Posts
        </h1>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <SchedulingControls />

        {/* 🔄 Mention Filter Toggle */}
        <div className="flex items-center mb-6">
          <label className="flex items-center space-x-3">
            <span className="text-sm text-zinc-700">Only show posts with mentions</span>
            <button
              onClick={() => setFilterMentionsOnly((prev) => !prev)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${filterMentionsOnly ? "bg-indigo-600" : "bg-gray-300"
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${filterMentionsOnly ? "translate-x-6" : "translate-x-0"
                  }`}
              ></div>
            </button>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts
            .filter((post) => !filterMentionsOnly || post.hasMention)
            .map((post, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4 relative">
                <div className="flex justify-between mb-2 items-center">
                  <div className="flex items-center gap-2">
                    {post.hasMention && <span className="text-yellow-500 text-xl">⚠️</span>}
                    <button
                      onClick={() => saveSinglePost(post)}
                      className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    onClick={() => removePost(post)}
                    className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="w-full mb-4 rounded overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
                  <Swiper spaceBetween={10}>
                    {post.images.map((img, i) => (
                      <SwiperSlide key={i}>
                        <img
                          src={img}
                          alt={`Post ${idx + 1} Image ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <textarea
                  rows={3}
                  value={post.title}
                  onChange={(e) => handleTitleChange(posts.indexOf(post), e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mb-3 whitespace-pre-line"
                />
                <label className="block text-sm font-semibold mb-1">Scheduled Time</label>
                <input
                  type="datetime-local"
                  value={post.scheduledTime || ""}
                  onChange={(e) => handleTimeChange(posts.indexOf(post), e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            ))}
        </div>

        <SchedulingControls />

        <div className="flex justify-center mt-10">
          <button
            onClick={schedulePosts}
            className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            Schedule Posts
          </button>
        </div>
      </div>
    </main>
  );
}
