import type { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/cron/runScheduledPosts"; // Import the real cron job handler

// Call the real cron job handler for testing
export default async function testHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET to test the cron job" });
  }

  // Wrap it to simulate a POST request
  return handler({ ...req, method: "POST" } as NextApiRequest, res);
}
