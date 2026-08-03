/** Lightweight, consistently-tagged console logging for the client ("app")
 *  side of the online connection flow (auth -> create/join room -> sync),
 *  so each step can be traced in the browser console. Server/db-side steps
 *  of the same flow are logged separately in the Vercel function logs via
 *  `api/_lib/log.ts` — the shared step names make it easy to line them up. */
export function logApp(step: string, message: string, data?: unknown): void {
  const tag = `%c[app:${step}]`;
  const style = 'color:#38bdf8;font-weight:bold';
  if (data !== undefined) console.log(tag, style, message, data);
  else console.log(tag, style, message);
}
