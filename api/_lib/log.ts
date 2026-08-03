/** Lightweight, consistently-tagged console logging for the server (Vercel
 *  function) and db (Supabase query) sides of the online connection flow.
 *  Shows up in `vercel dev` / the Vercel dashboard's function logs. Uses the
 *  same step names as `client/src/lib/log.ts` (`auth`, `create_room`,
 *  `join_room`, `sync`) so a full request can be traced across layers. */
function log(layer: 'server' | 'db', step: string, message: string, data?: unknown): void {
  const line = `[${layer}:${step}] ${message}`;
  if (data !== undefined) console.log(line, data);
  else console.log(line);
}

export const logServer = (step: string, message: string, data?: unknown): void => log('server', step, message, data);
export const logDb = (step: string, message: string, data?: unknown): void => log('db', step, message, data);
