import React from 'react';
import { useT } from '../i18n';
import type { ConnectionKind, ConnectionStep } from '../lib/useOnlineGame';

interface Props {
  kind: ConnectionKind;
  step: ConnectionStep;
  roomCode: string | null;
  onCancel: () => void;
}

// Which steps make up each connection flow, in order.
const STEPS_BY_KIND: Record<Exclude<ConnectionKind, null>, ConnectionStep[]> = {
  create: ['auth', 'create_room', 'sync'],
  join: ['auth', 'join_room', 'sync'],
  resume: ['auth', 'sync'],
};

/** Full-screen loader shown while an online game is being created, joined or
 *  resumed. Renders the current flow as a small stepper (done / active /
 *  pending) instead of a single generic "Connecting…" message. */
export default function ConnectingScreen({ kind, step, roomCode, onCancel }: Props) {
  const t = useT();
  const steps = kind ? STEPS_BY_KIND[kind] : [];
  const activeIndex = step ? steps.indexOf(step) : -1;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">🌊</div>
        {steps.length > 0 ? (
          <ul className="flex flex-col gap-1.5 mb-2">
            {steps.map((s, i) => (
              <StepRow key={s} label={t(`app.step.${s}`)} state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'} />
            ))}
          </ul>
        ) : (
          <p className="text-ocean-300">{roomCode ? t('app.waitingPartner', { code: roomCode }) : t('app.connecting')}</p>
        )}
        <button
          onClick={onCancel}
          className="mt-6 px-6 py-2 rounded-lg border border-ocean-400 text-ocean-300 hover:bg-ocean-800 transition-colors"
        >
          {t('app.cancel')}
        </button>
      </div>
    </div>
  );
}

function StepRow({ label, state }: { label: string; state: 'done' | 'active' | 'pending' }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${state === 'pending' ? 'text-ocean-500' : 'text-ocean-200'}`}>
      <StepIcon state={state} />
      <span className={state === 'active' ? 'font-semibold' : ''}>{label}</span>
    </li>
  );
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') return <span className="w-4 h-4 flex items-center justify-center text-emerald-400 leading-none">✓</span>;
  if (state === 'active') return <span className="w-4 h-4 rounded-full border-2 border-ocean-300 border-t-transparent animate-spin" />;
  return <span className="w-4 h-4 rounded-full border-2 border-ocean-700" />;
}
