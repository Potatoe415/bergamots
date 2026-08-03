import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyPlayCard } from '@tranquillity/shared';
import { handleMove } from './_lib/handleMove';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleMove(req, res, (state, seat, body) =>
    applyPlayCard(
      state,
      seat,
      String(body.cardId),
      Number(body.position),
      Array.isArray(body.discardCardIds) ? (body.discardCardIds as string[]) : [],
    ),
  );
}
