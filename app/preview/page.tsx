"use client";

import React, { useState } from "react";

type ImageData = {
    uri: string;
    description: string;
    scheduleTime?: string;
};

export default function PreviewPage() {
    // In a real app, you might get this data from context, or by a query that returns the parsed JSON from your upload.
    // For demonstration, we'll start with some dummy data matching your JSON structure.
    const [images, setImages] = useState<ImageData[]>([
        {
            uri: "media/posts/202501/474329595_1685706252015879_5093315814035587782_n_18147875314361006.jpg",
            description: "I had the honour to participate in a #onepiece video collab with amazing people.",
        },
        {
            uri: "media/posts/202501/472610452_2121279184975230_1822205119828138692_n_18482102146054302.jpg",
            description:
                "Found an old pic from nanami, I kinda like it, hope you enjoy it 😁",
        },
        // ... add more images as needed
    ]);

    const handleDescriptionChange = (index: number, newDescription: string) => {
        const newImages = [...images];
        newImages[index].description = newDescription;
        setImages(newImages);
    };

    const handleScheduleTimeChange = (index: number, newTime: string) => {
        const newImages = [...images];
        newImages[index].scheduleTime = newTime;
        setImages(newImages);
    };

    const handleSchedulePosts = async () => {
        // For now, we'll log the scheduled posts.
        // Later, you could POST this to an endpoint that schedules the posts to Bluesky.
        console.log("Scheduling posts:", images);
        alert("Posts scheduled! Check the console for details.");
    };

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Preview & Schedule Posts</h1>
            <div className="space-y-4">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className="border p-4 rounded shadow flex flex-col md:flex-row gap-4"
                    >
                        <img
                            src={`/${img.uri}`}
                            alt={`Post ${index + 1}`}
                            className="w-48 h-48 object-cover rounded"
                        />
                        <div className="flex-1">
                            <textarea
                                value={img.description}
                                onChange={(e) =>
                                    handleDescriptionChange(index, e.target.value)
                                }
                                className="w-full border p-2 rounded mb-2"
                                placeholder="Edit description"
                                rows={3}
                            />
                            <input
                                type="datetime-local"
                                value={img.scheduleTime || ""}
                                onChange={(e) => handleScheduleTimeChange(index, e.target.value)}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSchedulePosts}
                className="mt-6 px-6 py-3 bg-green-600 text-white rounded"
            >
                Schedule Posts
            </button>
        </main>
    );
}
