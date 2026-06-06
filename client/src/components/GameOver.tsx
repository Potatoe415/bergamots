import React, { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { useSettings } from '../settings';
import { playWinSound, playLoseSound } from '../sounds';

interface Props {
  winner: 'players' | 'game';
  onRematch: () => void;
  onMenu: () => void;
}

export default function GameOver({ winner, onRematch, onMenu }: Props) {
  const t = useT();
  const { settings } = useSettings();
  const { soundOnMyTurn } = settings;
  const won = winner === 'players';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    if (soundOnMyTurn) {
      if (won) playWinSound(); else playLoseSound();
    }
    return () => cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center"
      style={{ transition: 'opacity 0.35s ease-out', opacity: visible ? 1 : 0 }}
    >
      <div
        className="flex flex-col items-center"
        style={{
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease-out',
          transform: visible ? 'scale(1)' : 'scale(0.65)',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="text-6xl mb-4">{won ? '🏝️' : '💀'}</div>
        <h2 className={`text-4xl font-bold mb-3 font-display ${won ? 'text-emerald-400' : 'text-red-400'}`}>
          {won ? t('gameover.won') : t('gameover.lost')}
        </h2>
        <p className="text-ocean-300 text-lg mb-8 max-w-sm">
          {won ? t('gameover.wonMsg') : t('gameover.lostMsg')}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button className="btn-primary text-base px-8 py-3" onClick={onRematch}>
            {t('gameover.playAgain')}
          </button>
          <button className="btn-ghost text-base px-8 py-3" onClick={onMenu}>
            {t('gameover.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
