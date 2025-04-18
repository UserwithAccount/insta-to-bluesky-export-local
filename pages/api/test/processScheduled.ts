// pages/api/cron/testScheduled.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/cron/processScheduled`, {
        method: "POST",
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      console.error("❌ testScheduled error:", err.message || err);
      res.status(500).json({ error: "Failed to trigger scheduled post processor" });
    }
  }