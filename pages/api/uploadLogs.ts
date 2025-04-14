// pages/api/uploadLogs.ts

import type { NextApiRequest, NextApiResponse } from "next";

// Define the structure of our log store
type LogStore = Record<string, string[]>;

// Attach a log store to globalThis with a type-safe check
declare global {
  var uploadLogs: LogStore | undefined;
}

// Initialize if not present
if (!globalThis.uploadLogs) {
  globalThis.uploadLogs = {};
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uploadId } = req.query;

  if (!uploadId || typeof uploadId !== "string") {
    return res.status(400).json({ error: "Missing uploadId" });
  }

  const logs = globalThis.uploadLogs?.[uploadId] || [];
  return res.status(200).json({ logs });
}
