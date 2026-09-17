import React from 'react';
import type { Card } from '@tranquillity/shared';

interface Props {
  card: Card;
  selected?: boolean;
  dimmed?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}

// 8cards.png — 8 island artwork frames (values 1–80, 10 per frame)
const ISLAND_FRAMES = 8;
function islandFrame(value: number): number {
  return Math.min(Math.floor((value - 1) / 10), ISLAND_FRAMES - 1);
}

// 3cards.png — frame 0 = Finish, frame 1 = Start, frame 2 = Monster
const SPECIAL_FRAMES = 3;
function specialFrame(card: Card): number {
  if (card.type === 'finish')  return 0;
  if (card.type === 'start')   return 1;
  return 2; // monster
}

function spriteStyle(card: Card): React.CSSProperties {
  if (card.type === 'island') {
    const frame = islandFrame(card.value!);
    return {
      backgroundImage: `url('/assets/8cards.png')`,
      backgroundSize: `${ISLAND_FRAMES * 100}% 100%`,
      backgroundPositionX: `${(frame / (ISLAND_FRAMES - 1)) * 100}%`,
      backgroundPositionY: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  const frame = specialFrame(card);
  return {
    backgroundImage: `url('/assets/3cards.png')`,
    backgroundSize: `${SPECIAL_FRAMES * 100}% 100%`,
    backgroundPositionX: `${(frame / (SPECIAL_FRAMES - 1)) * 100}%`,
    backgroundPositionY: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

const sizeMap = {
  sm:   { outer: 'w-14 h-14',   num: 'text-2xl' },
  md:   { outer: 'w-20 h-20',   num: 'text-3xl' },
  lg:   { outer: 'w-24 h-24',   num: 'text-4xl' },
  full: { outer: 'w-full h-full', num: 'text-[clamp(0.5rem,25cqw,1.5rem)]' },
};

export default function CardComp({ card, selected, dimmed, size = 'md', onClick, badge, disabled }: Props) {
  const s = sizeMap[size];

  return (
    <div
      className={[
        'card-base',
        s.outer,
        selected ? 'card-selected' : '',
        dimmed ? 'opacity-30' : '',
        disabled ? 'cursor-default' : 'cursor-pointer',
      ].join(' ')}
      style={spriteStyle(card)}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Number overlay — islands only */}
      {card.type === 'island' && (
        <div className="absolute inset-x-0 bottom-0 pb-1 flex justify-center pointer-events-none">
          <span
            className={`${s.num} font-black text-white leading-none select-none`}
            style={{ textShadow: '0 1px 8px rgba(0,0,0,1), 0 0 3px rgba(0,0,0,1)' }}
          >
            {card.value}
          </span>
        </div>
      )}

      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-xl" />

      {/* Cost badge */}
      {badge !== undefined && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-20">
          {badge}
        </div>
      )}
    </div>
  );
}
