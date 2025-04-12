"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

type ScheduledPost = {
  title: string;
  images: string[];           // Array of image URIs per post
  scheduledTime?: string;     // Optional scheduled time (ISO format)
};

export default function PreviewPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [error, setError] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [intervalHours, setIntervalHours] = useState<number>(24);
  const router = useRouter();

  // Fetch posts grouped by title from the listUploads API
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/listUploads");
        const data = await res.json();
        if (data.success) {
          const enriched = data.posts.map((post: any) => ({
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

  // Handlers
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

  const removePost = (index: number) => {
    const updated = posts.filter((_, i) => i !== index);
    setPosts(updated);
  };

  const generatePeriodicSchedule = () => {
    if (!startDate) {
      alert("Please select a start date & time.");
      return;
    }
    const base = new Date(startDate).getTime();
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const updated = posts.map((post, i) => ({
      ...post,
      scheduledTime: new Date(base + i * intervalMs).toISOString().slice(0, 16),
    }));
    setPosts(updated);
  };

  const schedulePosts = async () => {
    try {
      const res = await fetch("/api/schedulePosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posts),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully scheduled ${data.count} posts!`);
        router.push("/");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Schedule error:", err);
      alert("Error scheduling posts.");
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-center mb-8">
          Preview & Schedule Posts
        </h1>

        {error && <p className="text-red-600 text-center">{error}</p>}

        {/* Periodic Schedule Controls */}
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
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                min={1}
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

        {/* Post Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 relative">
              {/* Carousel */}
              <div className="w-full mb-4" style={{ aspectRatio: "4 / 3" }}>
                <Swiper spaceBetween={10}>
                  {post.images.map((img, i) => (
                    <SwiperSlide key={i}>
                      <img
                        src={img}
                        alt={`Post ${idx + 1} Image ${i + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Title Input */}
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => handleTitleChange(idx, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-3"
              />

              {/* Scheduled Time Input */}
              <label className="block text-sm font-semibold mb-1">
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                value={post.scheduledTime || ""}
                onChange={(e) => handleTimeChange(idx, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />

              {/* Remove Button */}
              <button
                onClick={() => removePost(idx)}
                className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Schedule Button */}
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
