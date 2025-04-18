// pages/api/cron/testScheduled.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/cron/processScheduled`, {
    method: "POST",
  });

  const data = await response.json();
  res.status(response.status).json(data);
}