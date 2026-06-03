import React, { useState } from 'react';
import type { Card } from '@tranquillity/shared';
import { useT } from '../i18n';
import CardComp from './CardComp';

interface Props {
  cardToPlay: Card;
  handWithoutPlayed: Card[];
  requiredCount: number;
  onConfirm: (discardIds: string[]) => void;
  onCancel: () => void;
}

export default function DiscardModal({ cardToPlay, handWithoutPlayed, requiredCount, onConfirm, onCancel }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size < requiredCount) { next.add(id); return next; }
      return prev;
    });
  }

  const ready = selected.size === requiredCount;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-ocean-900 border border-ocean-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">{t('discard.title')}</h2>
        <p className="text-ocean-300 text-sm mb-4">
          {t('discard.placing')} <strong className="text-white">
            {cardToPlay.type === 'island' ? `#${cardToPlay.value}` : cardToPlay.type.toUpperCase()}
          </strong> {t('discard.requiresDiscard')} <strong className="text-red-400">{requiredCount}</strong> {requiredCount !== 1 ? t('discard.cards') : t('discard.card')}.
        </p>

        <div className="flex flex-wrap gap-2 mb-5 min-h-[80px]">
          {handWithoutPlayed.map(card => (
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
            {t('discard.selected', { sel: selected.size, req: requiredCount })}
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onCancel}>{t('discard.cancel')}</button>
            <button className="btn-primary" disabled={!ready} onClick={() => onConfirm([...selected])}>
              {t('discard.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
