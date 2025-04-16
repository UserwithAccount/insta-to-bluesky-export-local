import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parse query params (default to 50 posts)
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    // Download uploadData.json from Supabase
    const { data, error } = await supabase.storage.from("uploads").download("uploadData.json");

    if (error || !data) {
      console.error("❌ Failed to download uploadData.json:", error);
      return res.status(500).json({ error: "Failed to read upload data" });
    }

    const buffer = await data.arrayBuffer();
    const jsonText = new TextDecoder("utf-8").decode(buffer);
    const allPosts = JSON.parse(jsonText);

    // Return a paginated slice
    const paginatedPosts = allPosts.slice(offset, offset + limit);

    res.status(200).json({ success: true, posts: paginatedPosts });
  } catch (err) {
    console.error("❌ Error reading upload data from Supabase:", err);
    res.status(500).json({ error: "Failed to read upload data" });
  }
}
