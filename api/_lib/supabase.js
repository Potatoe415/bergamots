import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

/**
 * Service-role Supabase client used exclusively inside api/yatsy/games/*
 * handlers. It bypasses RLS, so it must never run in browser code.
 */
export function getServiceClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return cachedClient;
}
