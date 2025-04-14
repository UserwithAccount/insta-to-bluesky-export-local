import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase"; // Import the shared Supabase client



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .storage
      .from("uploads")
      .download("uploadData.json");

    if (error || !data) {
      console.error("Failed to download uploadData.json:", error);
      return res.status(500).json({ error: "Failed to read upload data" });
    }

    const buffer = await data.arrayBuffer();
    const jsonText = new TextDecoder("utf-8").decode(buffer);
    const posts = JSON.parse(jsonText);

    res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error("Error reading upload data from Supabase:", err);
    res.status(500).json({ error: "Failed to read upload data" });
  }
}
