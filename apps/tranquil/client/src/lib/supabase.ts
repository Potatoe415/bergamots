import { createClient } from '@supabase/supabase-js';
import { logApp } from './log';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

/** Ensure the browser has an (anonymous) Supabase session before calling the
 *  API. The session's user id becomes this player's durable identity (their
 *  seat's `user_id`) — it survives reloads via supabase-js's own localStorage
 *  session persistence, replacing the old custom `sessionToken`. */
export async function ensureAnonAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    logApp('auth', 'reusing existing Supabase session', { userId: data.session.user.id });
    return;
  }
  logApp('auth', 'no session found, signing in anonymously…');
  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    logApp('auth', 'anonymous sign-in failed', error);
    throw error;
  }
  logApp('auth', 'anonymous sign-in succeeded', { userId: signInData.user?.id });
}

/** Fresh access token for the current (anonymous) session, for the
 *  `Authorization` header on API calls. */
export async function getAccessToken(): Promise<string> {
  await ensureAnonAuth();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('no_session');
  return token;
}
