// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse } from "next";
import IncomingForm from "formidable-serverless";
import { promises as fs } from "fs";
import path from "path";

interface FormidableFile {
    filepath: string;
    originalFilename?: string;
}

// Define a minimal type for files from formidable-serverless.
interface FormidableFile {
    filepath: string;
    originalFilename?: string;
}

export const config = {
    api: {
        bodyParser: false, // Disable Next.js's built-in bodyParser to handle multipart/form-data
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const form = new IncomingForm({
        multiples: true, // allow multiple files
        keepExtensions: true,
    });

    // Parse the request using formidable-serverless

    async (err: any, _fields: any, files: Record<string, any>) => {
        if (err) {
            console.error("Error parsing form:", err);
            res.status(500).json({ error: "Form parse failed" });
            return;
        }

        // Log the received files for debugging
        console.log("Files received:", files);

        // Extract all files regardless of the field name.
        let allFiles: FormidableFile[] = [];
        for (const key of Object.keys(files)) {
            const val = files[key];
            if (Array.isArray(val)) {
                allFiles = allFiles.concat(val);
            } else if (val) {
                allFiles.push(val);
            }
        }

        if (allFiles.length === 0) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }

        // Find the JSON file among the uploads by looking for a file with a .json extension.
        const jsonFile = allFiles.find(
            (file) =>
                file.originalFilename &&
                file.originalFilename.toLowerCase().endsWith(".json")
        );

        if (!jsonFile) {
            res.status(400).json({ error: "No JSON file uploaded" });
            return;
        }

        // Read and parse the JSON file.
        let parsedJson: any;
        try {
            const jsonText = await fs.readFile(jsonFile.filepath, "utf-8");
            parsedJson = JSON.parse(jsonText);
        } catch (error) {
            console.error("Failed to parse JSON file:", error);
            res.status(400).json({ error: "Invalid JSON file" });
            return;
        }

        // Build a map of image files keyed by their originalFilename.
        const imageMap = new Map<string, FormidableFile>();
        for (const file of allFiles) {
            if (
                file !== jsonFile &&
                file.originalFilename &&
                file.originalFilename.match(/\.(jpe?g|png|webp)$/i)
            ) {
                imageMap.set(file.originalFilename, file);
            }
        }

        // Process each post in the JSON.
        // Each post should be an object with a "media" array and a "title" field.
        type ParsedImage = { uri: string; description: string; buffer?: Buffer };
        const images: ParsedImage[] = [];

        for (const post of parsedJson) {
            const description = post.title || "";
            const media = Array.isArray(post.media) ? post.media : [];
            for (const item of media) {
                // The JSON's "uri" field should match the originalFilename of an uploaded image.
                const file = imageMap.get(item.uri);
                if (!file) {
                    console.warn(`Missing image: ${item.uri}`);
                    continue;
                }
                const buffer = await fs.readFile(file.filepath);
                images.push({
                    uri: item.uri,
                    description,
                    buffer, // This buffer is available for later processing (like uploading to Bluesky)
                });
            }
        }

        res.status(200).json({
            success: true,
            count: images.length,
            images: images.map(({ uri, description }) => ({ uri, description })),
        });
    };
}
