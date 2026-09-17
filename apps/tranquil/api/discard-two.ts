import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyDiscardTwo } from '@tranquillity/shared';
import { handleMove } from './_lib/handleMove';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleMove(req, res, (state, seat, body) =>
    applyDiscardTwo(state, seat, body.cardIds as [string, string]),
  );
}
