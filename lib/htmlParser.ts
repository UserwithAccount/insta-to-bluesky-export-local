import * as cheerio from "cheerio";
import { readFile } from "fs/promises";

export async function parseHTMLFile(filePath: string) {
  const html = await readFile(filePath, "utf-8");
  const $ = cheerio.load(html);

  const images: { src: string; alt?: string }[] = [];

  $("img").each((_, el) => {
    const src = $(el).attr("src");
    const alt = $(el).attr("alt") || "";
    if (src) {
      images.push({ src, alt });
    }
  });

  return images;
}
