import React, { useState } from 'react';
import type { Card, ClientStartDiscardState } from '@tranquillity/shared';
import { useT } from '../i18n';
import CardComp from './CardComp';

interface Props {
  hand: Card[];
  startDiscard: ClientStartDiscardState;
  onContribute: (cardIds: string[]) => void;
}

export default function StartDiscardModal({ hand, startDiscard, onContribute }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!startDiscard.isMyTurnToContribute) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-ocean-900 border border-ocean-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="text-4xl mb-3">⚓</div>
          <h2 className="text-xl font-bold text-white mb-2">{t('startDiscard.title')}</h2>
          <p className="text-ocean-300 text-sm mb-4">
            {t('startDiscard.waiting')}
          </p>
          <div className="bg-ocean-800 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-ocean-300 mb-1">
              <span>{t('startDiscard.theirContrib')}</span>
              <span className="text-white font-bold">{startDiscard.opponentContribution}</span>
            </div>
            <div className="flex justify-between text-ocean-300">
              <span>{t('startDiscard.stillNeeded')}</span>
              <span className="text-red-400 font-bold">{startDiscard.remaining}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxSelect = Math.min(startDiscard.remaining, hand.length);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size < maxSelect) { next.add(id); return next; }
      return prev;
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-ocean-900 border border-ocean-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-4xl mb-2 text-center">⚓</div>
        <h2 className="text-xl font-bold text-white text-center mb-1">{t('startDiscard.title')}</h2>
        <p className="text-ocean-300 text-sm text-center mb-2">
          {t('startDiscard.together', { n: startDiscard.opponentContribution })}
        </p>
        <p className="text-amber-400 text-sm text-center mb-4 font-semibold">
          {t('startDiscard.selectUp', { max: maxSelect, remaining: startDiscard.remaining })}
        </p>

        <div className="flex flex-wrap gap-2 mb-5 min-h-[80px] justify-center">
          {hand.map(card => (
            <CardComp
              key={card.id}
              card={card}
              size="sm"
              selected={selected.has(card.id)}
              onClick={() => toggle(card.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-ocean-400 text-sm">
            {t('startDiscard.contributing', { sel: selected.size, max: maxSelect })}
          </span>
          <button
            className="btn-primary"
            onClick={() => onContribute([...selected])}
          >
            {t('startDiscard.contributeBtn', {
              n: selected.size,
              card: selected.size !== 1 ? t('discard.cards') : t('discard.card'),
            })}
          </button>
        </div>
      </div>
    </div>
  );
}
