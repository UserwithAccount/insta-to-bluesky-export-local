"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UploadedImage = {
    uri: string;
    title: string;
    scheduledTime?: string;
};

export default function PreviewPage() {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [error, setError] = useState<string>("");
    const [startDate, setStartDate] = useState<string>(""); // e.g. "2025-01-01T13:00"
    const [intervalHours, setIntervalHours] = useState<number>(24); // default interval
    const router = useRouter();

    // Fetch the processed image data from the listUploads API route.
    useEffect(() => {
        async function fetchImages() {
            try {
                const res = await fetch("/api/listUploads");
                const data = await res.json();
                if (data.success) {
                    setImages(data.images);
                } else {
                    setError("Failed to load images.");
                }
            } catch (err) {
                console.error("Error fetching images:", err);
                setError("Error fetching images.");
            }
        }
        fetchImages();
    }, []);

    // Generate scheduled times for each image based on the startDate and interval.
    const generateSchedule = () => {
        if (!startDate) {
            alert("Please select a start date and time.");
            return;
        }
        const start = new Date(startDate);
        const intervalMs = intervalHours * 60 * 60 * 1000;
        const scheduledImages = images.map((img, index) => {
            const scheduledDate = new Date(start.getTime() + index * intervalMs);
            // Format the date as an ISO string (remove seconds and milliseconds).
            const scheduledTime = scheduledDate.toISOString().slice(0, 16);
            return { ...img, scheduledTime };
        });
        setImages(scheduledImages);
    };

    // Send the scheduled posts to the API route which stores them in the database.
    const schedulePosts = async () => {
        // The API expects an array of posts with imageUri, title, and scheduledTime.
        try {
            const res = await fetch("/api/schedulePosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(images),
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Successfully scheduled ${data.count} posts!`);
                router.push("/");
            } else {
                alert(`Error scheduling posts: ${data.error}`);
            }
        } catch (err) {
            console.error("Schedule posts error:", err);
            alert("An error occurred while scheduling posts.");
        }
    };

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Preview & Schedule Posts</h1>
            {error && <p className="text-red-600">{error}</p>}
            {images.length === 0 && !error && (
                <p>No images found. Please check your upload.</p>
            )}

            {/* Scheduling controls */}
            <div className="mb-6 space-y-4 border p-4 rounded shadow">
                <h2 className="text-xl font-semibold">Schedule Settings</h2>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex flex-col">
                        <label htmlFor="startDate" className="font-medium">
                            Start Date & Time
                        </label>
                        <input
                            id="startDate"
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border p-2 rounded"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="interval" className="font-medium">
                            Interval (hours)
                        </label>
                        <input
                            id="interval"
                            type="number"
                            value={intervalHours}
                            onChange={(e) => setIntervalHours(Number(e.target.value))}
                            className="border p-2 rounded"
                            min="1"
                        />
                    </div>
                    <button
                        onClick={generateSchedule}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                        Generate Schedule
                    </button>
                </div>
            </div>

            {/* Preview the images with their schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((img, idx) => (
                    <div key={idx} className="border p-4 rounded shadow flex flex-col">
                        <img
                            src={img.uri}
                            alt={`Post ${idx + 1}`}
                            className="w-full h-64 object-cover rounded"
                        />
                        <div className="mt-2">
                            <h2 className="text-lg font-semibold">{img.title}</h2>
                            {img.scheduledTime && (
                                <p className="text-sm text-gray-600">
                                    Scheduled for: {img.scheduledTime}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={schedulePosts}
                className="mt-6 px-6 py-3 bg-green-600 text-white rounded"
            >
                Schedule Posts
            </button>
        </main>
    );
}
