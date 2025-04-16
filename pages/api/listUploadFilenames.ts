// 1. Create the SQL function in Supabase (run in Supabase SQL editor)

/*
create or replace function list_upload_filenames()
returns table(name text)
language sql
as $$
  select name from storage.objects
  where bucket_id = 'uploads';
$$;
*/

// 2. Create this API route in your Next.js app
// File: pages/api/listUploadFilenames.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // make sure this is defined in Vercel and .env
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data, error } = await supabase.rpc("list_upload_filenames");

  if (error) {
    console.error("Supabase RPC error:", error);
    return res.status(500).json({ error: "Failed to fetch filenames" });
  }

  return res.status(200).json({ filenames: data });
}
