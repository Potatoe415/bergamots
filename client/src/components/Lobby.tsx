import React, { useState } from 'react';
import { useT } from '../i18n';
import type { MonsterCount } from '@tranquillity/shared';

export type GameMode = 'local' | 'online_create' | 'online_join';

interface Props {
  onStartLocal: (p1Name: string, p2Name: string, monsterCount: MonsterCount) => void;
  onCreateOnline: (playerName: string, monsterCount: MonsterCount) => void;
  onJoinOnline: (roomCode: string, playerName: string) => void;
  onlineRoomCode?: string;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}

const DIFFICULTIES: { label: string; count: MonsterCount; desc: string }[] = [
  { label: 'Standard', count: 0,  desc: 'No monsters' },
  { label: 'Easy',     count: 3,  desc: '3 monsters' },
  { label: 'Medium',   count: 4,  desc: '4 monsters' },
  { label: 'Hard',     count: 5,  desc: '5 monsters' },
];

export default function Lobby({ onStartLocal, onCreateOnline, onJoinOnline, onlineRoomCode, connectionStatus, errorMessage }: Props) {
  const t = useT();
  const [mode, setMode] = useState<'menu' | 'local' | 'create' | 'join'>('menu');
  const [p1, setP1] = useState('Player 1');
  const [p2, setP2] = useState('Player 2');
  const [myName, setMyName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [monsterCount, setMonsterCount] = useState<MonsterCount>(0);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ backgroundImage: 'url(/assets/dashboard.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Darkening overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-5xl sm:text-6xl font-bold text-white font-display mb-2">
          Tranquillity
        </h1>
        <p className="text-ocean-300 text-lg">{t('lobby.subtitle')}</p>
        <div className="flex gap-2 justify-center mt-3 text-ocean-400 text-sm">
          <span>{t('lobby.players')}</span><span>·</span><span>{t('lobby.cooperative')}</span><span>·</span><span>{t('lobby.duration')}</span>
        </div>
      </div>

      {mode === 'menu' && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button className="btn-primary py-4 text-lg" onClick={() => setMode('local')}>
            {t('lobby.local')}
          </button>
          <button className="btn-ghost py-4 text-lg" onClick={() => setMode('create')}>
            {t('lobby.createOnline')}
          </button>
          <button className="btn-ghost py-4 text-lg" onClick={() => setMode('join')}>
            {t('lobby.joinOnline')}
          </button>
        </div>
      )}

      {mode === 'local' && (
        <div className="bg-ocean-900/60 border border-ocean-700/50 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white text-center">{t('lobby.localGame')}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-ocean-300 text-sm">{t('lobby.player1Name')}</span>
            <input className="input-field" value={p1} onChange={e => setP1(e.target.value)} maxLength={20} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ocean-300 text-sm">{t('lobby.player2Name')}</span>
            <input className="input-field" value={p2} onChange={e => setP2(e.target.value)} maxLength={20} />
          </label>
          <DifficultyPicker value={monsterCount} onChange={setMonsterCount} />
          <button className="btn-primary py-3" onClick={() => onStartLocal(p1.trim() || 'Player 1', p2.trim() || 'Player 2', monsterCount)}>
            {t('lobby.startGame')}
          </button>
          <button className="btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-ocean-900/60 border border-ocean-700/50 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white text-center">{t('lobby.createRoom')}</h2>
          {!onlineRoomCode ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-ocean-300 text-sm">{t('lobby.yourName')}</span>
                <input className="input-field" value={myName} onChange={e => setMyName(e.target.value)} maxLength={20} placeholder={t('lobby.captainPlaceholder')} />
              </label>
              <DifficultyPicker value={monsterCount} onChange={setMonsterCount} />
              <button
                className="btn-primary py-3"
                disabled={connectionStatus === 'connecting'}
                onClick={() => onCreateOnline(myName.trim() || 'Captain', monsterCount)}
              >
                {connectionStatus === 'connecting' ? t('lobby.connecting') : t('lobby.createRoom')}
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-ocean-300 text-sm mb-3">{t('lobby.shareCode')}</p>
              <div className="text-4xl font-bold text-yellow-400 tracking-widest bg-ocean-800 rounded-xl py-4 mb-3">
                {onlineRoomCode}
              </div>
              <p className="text-ocean-400 text-xs">{t('lobby.waitingPartner')}</p>
            </div>
          )}
          {errorMessage && <p className="text-red-400 text-sm text-center">{errorMessage}</p>}
          <button className="btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
        </div>
      )}

      {mode === 'join' && (

        <div className="bg-ocean-900/60 border border-ocean-700/50 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white text-center">{t('lobby.joinRoom')}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-ocean-300 text-sm">{t('lobby.yourName')}</span>
            <input className="input-field" value={myName} onChange={e => setMyName(e.target.value)} maxLength={20} placeholder={t('lobby.sailorPlaceholder')} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ocean-300 text-sm">{t('lobby.roomCode')}</span>
            <input
              className="input-field uppercase tracking-widest text-center text-lg"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABCD"
            />
          </label>
          <button
            className="btn-primary py-3"
            disabled={connectionStatus === 'connecting' || roomCode.length < 4}
            onClick={() => onJoinOnline(roomCode, myName.trim() || 'Sailor')}
          >
            {connectionStatus === 'connecting' ? t('lobby.joining') : t('lobby.join')}
          </button>
          {errorMessage && <p className="text-red-400 text-sm text-center">{errorMessage}</p>}
          <button className="btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
        </div>
      )}
      </div>
    </div>
  );
}

function DifficultyPicker({ value, onChange }: { value: MonsterCount; onChange: (v: MonsterCount) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ocean-300 text-sm">Difficulty</span>
      <div className="grid grid-cols-4 gap-1.5">
        {DIFFICULTIES.map(d => (
          <button
            key={d.count}
            type="button"
            onClick={() => onChange(d.count)}
            className={[
              'rounded-lg py-2 text-xs font-semibold border transition-all',
              value === d.count
                ? 'bg-ocean-500 border-ocean-400 text-white'
                : 'bg-ocean-800/60 border-ocean-700/40 text-ocean-400 hover:border-ocean-500/60',
            ].join(' ')}
          >
            <div>{d.label}</div>
            <div className={`text-[9px] mt-0.5 ${value === d.count ? 'text-ocean-200' : 'text-ocean-600'}`}>{d.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
