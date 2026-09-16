import type { CardOf, Suit } from "@/lib/cards";

const SUIT_SYMBOL: Record<Suit, string> = { H: "\u2665", D: "\u2666", C: "\u2663", S: "\u2660" };
const RED_SUITS: Suit[] = ["H", "D"];

const SIZES = {
  xs: { card: "h-10 w-7", rank: "text-xs", suit: "text-lg" },
  sm: { card: "h-14 w-10", rank: "text-base", suit: "text-2xl" },
  md: { card: "h-20 w-14", rank: "text-xl", suit: "text-4xl" },
  lg: { card: "h-24 w-16", rank: "text-2xl", suit: "text-5xl" },
} as const;

/** Any game's card shape (rank set differs per game, suit set is universal). */
export interface PlayingCardProps {
  card: CardOf<string>;
  size?: keyof typeof SIZES;
  dimmed?: boolean;
  playable?: boolean;
  /** Suppresses `playable`'s always-on gold ring while keeping the card
   *  clickable (e.g. the exchange panel, where every card is clickable but
   *  only the ones the player actually selected should be highlighted).
   *  Defaults to true. */
  showPlayableRing?: boolean;
  /** Also mirrors the rank/suit corner index on the top-right (in addition to
   *  the always-on top-left one). Used where a card sits partly behind
   *  another one offset to the left (e.g. la Bataille Corse's scattered
   *  pile, `BataillecorseTable.tsx`) - whichever side peeks out, its rank/suit
   *  stays readable. Defaults to false (every other game's plain look). */
  showRightIndex?: boolean;
  onClick?: () => void;
  dataId?: string;
}

export function PlayingCard({
  card,
  size = "md",
  dimmed,
  playable,
  showPlayableRing = true,
  showRightIndex = false,
  onClick,
  dataId,
}: PlayingCardProps) {
  const red = RED_SUITS.includes(card.suit);
  const interactive = !!onClick;
  const sizeStyle = SIZES[size];
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? !playable : undefined}
      data-id={dataId}
      data-card={`${card.rank}${card.suit}`}
      className={[
        "relative overflow-hidden rounded-lg border-2 border-[var(--card-ink)] bg-[var(--card-face)] font-black shadow-[0_2px_0_rgba(32,40,58,0.65)] select-none",
        sizeStyle.card,
        red ? "text-[var(--accent-red)]" : "text-[var(--card-ink)]",
        dimmed ? "brightness-50 grayscale" : "",
        playable ? "cursor-pointer" : "",
        playable && showPlayableRing ? "ring-4 ring-[var(--ring-strong)]" : "",
        interactive && !playable ? "cursor-not-allowed" : "",
        "transition-transform",
      ].join(" ")}
    >
      <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
        <span className={`font-black leading-none ${sizeStyle.rank}`}>{card.rank}</span>
        <span className="leading-none">{SUIT_SYMBOL[card.suit]}</span>
      </div>
      {showRightIndex && (
        <div className="absolute top-1 right-1 flex flex-col items-center leading-none">
          <span className={`font-black leading-none ${sizeStyle.rank}`}>{card.rank}</span>
          <span className="leading-none">{SUIT_SYMBOL[card.suit]}</span>
        </div>
      )}
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[35%] leading-none ${sizeStyle.suit}`}
      >
        {SUIT_SYMBOL[card.suit]}
      </span>
    </Tag>
  );
}

export function CardBack({ size = "md", dataId }: { size?: keyof typeof SIZES; dataId?: string }) {
  const sizeStyle = SIZES[size];
  return (
    <div
      data-id={dataId}
      className={[
        "relative overflow-hidden rounded-lg border-[0.5px] border-[var(--card-ink)] bg-[var(--card-back)] shadow-[0_2px_0_rgba(32,40,58,0.75)]",
        sizeStyle.card,
      ].join(" ")}
    >
      <div className="absolute inset-[4px] rounded-sm border-[0.5px] border-[var(--card-back-line)]/60" />
    </div>
  );
}
