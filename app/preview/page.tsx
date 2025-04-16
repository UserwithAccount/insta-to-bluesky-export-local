"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

const PAGE_SIZE = 10;

export default function PreviewPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/listUploads?offset=${offset}&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (data.success) {
        const newPosts = data.posts.map((post: ScheduledPost) => ({
          ...post,
          scheduledTime: post.scheduledTime || "",
        }));

        setPosts((prev) => [...prev, ...newPosts]);
        setOffset((prev) => prev + newPosts.length);
        setHasMore(newPosts.length === PAGE_SIZE);
      } else {
        setError("Failed to load posts.");
        setHasMore(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Error loading posts.");
    }

    setLoading(false);
  }, [offset, loading, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        fetchPosts();
      }
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [fetchPosts]);

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
    toast.success("Post removed");
  };

  const schedulePosts = async () => {
    const batchSize = 5;
    const delay = 500;
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
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <main className="bg-gray-100 min-h-screen py-8">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-zinc-900">
          Preview & Schedule Posts
        </h1>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 relative">
              <div className="flex justify-between mb-2 items-center">
                {post.hasMention && <span className="text-yellow-500 text-xl">⚠️</span>}
                <button
                  onClick={() => removePost(idx)}
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
              <textarea
                rows={3}
                value={post.title}
                onChange={(e) => handleTitleChange(idx, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-3 whitespace-pre-line"
              />
              <input
                type="datetime-local"
                value={post.scheduledTime || ""}
                onChange={(e) => handleTimeChange(idx, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>

        {loading && <p className="text-center mt-4">Loading more posts...</p>}
        <div ref={observerRef} className="h-10" />

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
