import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyContributeStartDiscard } from '@tranquillity/shared';
import { handleMove } from './_lib/handleMove';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleMove(req, res, (state, seat, body) =>
    applyContributeStartDiscard(state, seat, Array.isArray(body.cardIds) ? (body.cardIds as string[]) : []),
  );
}
