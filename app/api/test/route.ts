import { NextResponse } from "next/server";
// app/api/test/route.ts
export async function GET() {
    return NextResponse.json({ message: "Test route works!" });
  }
  