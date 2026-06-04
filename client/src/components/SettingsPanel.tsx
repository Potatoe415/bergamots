import React from 'react';
import { useSettings } from '../settings';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
  onRestartGame?: () => void;
}

export default function SettingsPanel({ onClose, onRestartGame }: Props) {
  const t = useT();
  const { settings, update } = useSettings();

  function handleRestart() {
    onClose();
    onRestartGame?.();
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-ocean-900 border border-ocean-700 rounded-2xl p-5 w-72 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="text-ocean-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-white/80 text-sm">{t('settings.soundOnMyTurn')}</span>
            <Toggle
              value={settings.soundOnMyTurn}
              onChange={v => update({ soundOnMyTurn: v })}
            />
          </label>

          {onRestartGame && (
            <>
              <div className="border-t border-ocean-700/60" />
              <button
                onClick={handleRestart}
                className="w-full py-2 rounded-xl bg-ocean-800 hover:bg-ocean-700 text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                {t('settings.restartGame')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        'relative shrink-0 w-11 h-6 rounded-full transition-colors',
        value ? 'bg-ocean-500' : 'bg-ocean-700',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          value ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}
