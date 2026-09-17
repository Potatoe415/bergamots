"use client";

import type { CardOf } from "@/lib/cards";
import { PlayingCard } from "./PlayingCard";

/** Slight arc for the player's own hand (same look as Président's hand): max upward
 *  lift at the center card (px) and max rotation at the outer edges (deg), tapering
 *  to 0 for a single card. */
const HAND_CURVE_LIFT = 10;
const HAND_CURVE_ROTATE = 6;

/**
 * One absolutely-positioned card in a hand fan, shared by every game's hand (see
 * `useOptimisticPlay`'s `tapCard`/`preSelectedId`): routes the tap to either play
 * (my turn) or pre-select (waiting for my turn), and gives a pre-selected card the
 * same "lifted + ring" treatment everywhere instead of each game re-styling it.
 * `index`/`total` (position in the sorted hand) drive the slight fan curve.
 */
export function HandCardSlot({
  card,
  left,
  zIndex,
  index,
  total,
  isPlayable,
  isDimmed,
  isPreSelected,
  myTurnToPlay,
  dataId,
  onTap,
}: {
  card: CardOf<string>;
  left: number;
  zIndex: number;
  index: number;
  total: number;
  isPlayable: boolean;
  isDimmed: boolean;
  isPreSelected: boolean;
  myTurnToPlay: boolean;
  dataId: string;
  onTap: () => void;
}) {
  const mid = (total - 1) / 2;
  const offset = mid > 0 ? (index - mid) / mid : 0;
  const curveLift = HAND_CURVE_LIFT * (1 - offset * offset);
  const curveRotate = offset * HAND_CURVE_ROTATE;
  // Keep the hand visually stable while playing online: pre-selection adds an extra lift on top of the curve.
  const selectedLift = isPreSelected ? 28 : 0;
  const transform = `translateY(${-(curveLift + selectedLift)}px) rotate(${curveRotate}deg)`;

  // When it's my turn: let PlayingCard render a <button> and handle the click.
  // When it's not my turn (pre-selection mode): PlayingCard renders a <div> (no onClick →
  // not disabled), and the outer div captures the click.
  const playCardClick = myTurnToPlay ? onTap : undefined;
  const preselectClick = !myTurnToPlay ? onTap : undefined;

  return (
    <div
      className="absolute bottom-0 transition-transform duration-150"
      style={{ left, zIndex, transform, transformOrigin: "bottom center" }}
      onClick={preselectClick}
    >
      <div className={isPreSelected ? "rounded-lg ring-2 ring-[var(--accent-yellow)]" : undefined}>
        <PlayingCard card={card} size="lg" dataId={dataId} playable={isPlayable} dimmed={isDimmed} onClick={playCardClick} />
      </div>
    </div>
  );
}
