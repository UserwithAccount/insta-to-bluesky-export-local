// pages/api/postToBluesky.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/postToBluesky";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id;
    const postId = typeof id === "string" ? parseInt(id, 10) : null;

    if (!postId || isNaN(postId)) {
        return res.status(400).json({ success: false, error: "Invalid or missing post ID" });
    }

    if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const success = await postToBluesky(postId);
        return res.status(200).json({ success });
    } catch (err) {
        console.error("Bluesky send error:", err);
        return res.status(500).json({ success: false, error: "Failed to send post" });
    }
}
