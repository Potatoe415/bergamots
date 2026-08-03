import { createClient } from '@supabase/supabase-js';
import type { IncomingHttpHeaders } from 'http';
import { logDb, logServer } from './log';

/** Resolves the caller's user id from a verified Supabase access token (sent
 *  as `Authorization: Bearer <token>` by the client). Never trust a
 *  client-supplied user id directly — this always re-verifies the JWT
 *  against Supabase before returning an id. Returns null if missing/invalid. */
export async function getUserId(headers: IncomingHttpHeaders): Promise<string | null> {
  const authHeader = headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    logServer('auth', 'request missing Authorization header');
    return null;
  }
  const token = authHeader.slice('Bearer '.length);

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  logDb('auth', 'verifying access token with Supabase auth…');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    logDb('auth', 'token verification failed', error);
    return null;
  }
  logDb('auth', 'token verified', { userId: data.user.id });
  return data.user.id;
}
