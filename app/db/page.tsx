"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FaExclamationTriangle } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

type DbPost = {
  id: number;
  title: string;
  scheduledTime?: string;
  images: string[];
  posted: boolean;
  editing?: boolean;
};

export default function DbPage() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [error, setError] = useState("");
  const [weekGroups, setWeekGroups] = useState<Record<string, DbPost[]>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const grouped: Record<string, DbPost[]> = {};
    posts.forEach((post: DbPost) => {
      const date = post.scheduledTime ? new Date(post.scheduledTime) : new Date();
      const week = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(post);
    });
    setWeekGroups(grouped);
  }, [posts]);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/dbPosts");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError("Failed to fetch DB posts.");
      }
    } catch (err) {
      console.error("DB fetch error:", err);
      setError("Failed to fetch DB posts.");
    }
  };

  const toggleWeek = (week: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [week]: !prev[week] }));
  };

  const handleTitleChange = async (id: number, newTitle: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, title: newTitle, editing: false } : post
      )
    );

    try {
      await fetch("/api/dbPosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: newTitle }),
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleTimeChange = async (id: number, newTime: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, scheduledTime: newTime } : post
      )
    );

    try {
      await fetch("/api/dbPosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, scheduledTime: newTime }),
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const removePost = async (id: number) => {
    try {
      const res = await fetch(`/api/dbPosts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        fetchPosts();
      } else {
        toast.error("Failed to delete post");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting post");
    }
  };

  const postToBluesky = async (id: number) => {
    try {
      const res = await fetch(`/api/postToBluesky?id=${id}`, { method: "POST" });
      if (res.ok) {
        toast.success("Post sent to Bluesky");
        fetchPosts();
      } else {
        toast.error("Failed to send post");
      }
    } catch (err) {
      console.error("Bluesky error:", err);
      toast.error("Bluesky post failed");
    }
  };

  return (
    <main className="bg-gray-100 dark:bg-zinc-900 min-h-screen py-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-zinc-900 dark:text-white">
          Scheduled Posts in Database
        </h1>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {Object.entries(weekGroups).map(([week, weekPosts]) => (
          <div key={week} className="mb-8">
            <button
              className="text-left w-full bg-indigo-200 hover:bg-indigo-300 text-indigo-900 px-4 py-2 font-semibold rounded-md mb-2"
              onClick={() => toggleWeek(week)}
            >
              {expandedWeeks[week] ? "▾" : "▸"} Week of {week}
            </button>

            {expandedWeeks[week] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weekPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 relative"
                  >
                    <button
                      onClick={() => removePost(post.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 z-10"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => postToBluesky(post.id)}
                      className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 z-10"
                    >
                      Send
                    </button>
                    {post.title.includes("@") && (
                      <div className="absolute top-2 left-16 text-yellow-600 z-10">
                        <FaExclamationTriangle title="Mentions present" />
                      </div>
                    )}
                    <div className="w-full mb-4" style={{ aspectRatio: "4 / 3" }}>
                      <Swiper spaceBetween={10}>
                        {post.images.map((img, i) => (
                          <SwiperSlide key={i}>
                            <img
                              src={img}
                              alt={`Post ${post.id} Image ${i + 1}`}
                              className="w-full h-full object-cover rounded"
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                    <label className="block text-sm font-semibold mb-1 text-zinc-800 dark:text-zinc-200">
                      Title
                    </label>
                    {!post.editing ? (
                      <div
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded mb-3 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white whitespace-pre-wrap cursor-pointer"
                        onClick={() =>
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, editing: true } : p
                            )
                          )
                        }
                      >
                        {post.title || <span className="text-zinc-400 italic">Click to edit</span>}
                      </div>
                    ) : (
                      <textarea
                        rows={4}
                        className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded mb-3 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        value={post.title}
                        onChange={(e) =>
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, title: e.target.value } : p
                            )
                          )
                        }
                        onBlur={(e) => handleTitleChange(post.id, e.target.value)}
                        autoFocus
                      />
                    )}
                    <label className="block text-sm font-semibold mb-1 text-zinc-800 dark:text-zinc-200">
                      Scheduled Time
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      value={post.scheduledTime ? post.scheduledTime.slice(0, 16) : ""}
                      onChange={(e) => handleTimeChange(post.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
