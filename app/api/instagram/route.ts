// app/api/instagram/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log(session); // log the session object to debug
  
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  try {
    const instagramRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,timestamp&access_token=${accessToken}`
    );
    const data = await instagramRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    return NextResponse.json({ error: "Failed to fetch Instagram media" }, { status: 500 });
  }
}
