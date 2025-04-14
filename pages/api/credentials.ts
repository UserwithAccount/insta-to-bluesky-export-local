// pages/api/credentials.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import CryptoJS from "crypto-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SECRET_KEY = process.env.CREDENTIAL_SECRET_KEY;
  if (!SECRET_KEY) {
    return res.status(500).json({ success: false, error: "Secret key not configured" });
  }

  if (req.method === "POST") {
    const { handle, password } = req.body;
    if (!handle || !password) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    try {
      await prisma.credential.deleteMany(); // Delete all previous credentials
      const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
      await prisma.credential.create({
        data: { handle, password: encrypted },
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Save error:", err);
      return res.status(500).json({ success: false, error: "Failed to save credentials" });
    }
  }

  if (req.method === "GET") {
    try {
      const cred = await prisma.credential.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (!cred) return res.status(404).json({ success: false, error: "No credentials found" });

      const decrypted = CryptoJS.AES.decrypt(cred.password, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      return res.status(200).json({
        success: true,
        handle: cred.handle,
        password: decrypted,
      });
    } catch (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: "Failed to load credentials" });
    }
  }

  res.status(405).end();
}
