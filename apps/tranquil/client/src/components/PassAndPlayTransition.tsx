import React from 'react';
import { useT } from '../i18n';

interface Props {
  nextPlayerName: string;
  onReady: () => void;
}

export default function PassAndPlayTransition({ nextPlayerName, onReady }: Props) {
  const t = useT();
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] p-6 text-center">
      <div className="text-6xl mb-6">🌊</div>
      <h2 className="text-3xl font-bold text-white mb-2 font-display">{t('transition.title')}</h2>
      <p className="text-xl text-ocean-300 mb-8">
        <strong className="text-white">{t('transition.turn', { name: nextPlayerName })}</strong>
      </p>
      <p className="text-ocean-500 text-sm mb-10">
        {t('transition.hint')}
      </p>
      <button
        className="btn-primary text-lg px-8 py-4"
        onClick={onReady}
      >
        {t('transition.ready')}
      </button>
    </div>
  );
}
