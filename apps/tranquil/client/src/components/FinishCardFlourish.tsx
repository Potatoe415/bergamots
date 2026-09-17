import React, { useEffect, useRef, useState } from 'react';
import type { Card } from '@tranquillity/shared';
import CardComp from './CardComp';
import { useSettings } from '../settings';
import { playFinishCardSound } from '../sounds';

type Stage = 'enter' | 'burst' | 'landed';

const FINISH_CARD: Card = { id: 'finish-flourish', type: 'finish', value: null };
const REST_SIZE = 96; // px — matches CardComp's "lg" size
const LAND_SCALE = 0.42;
const MARGIN_X = 16;
const MARGIN_TOP = 60; // clears the header bar

function landingOffset() {
  const half = (REST_SIZE * LAND_SCALE) / 2;
  return {
    x: window.innerWidth / 2 - MARGIN_X - half,
    y: -(window.innerHeight / 2) + MARGIN_TOP + half,
  };
}

/** Plays once when the finish card wins the game outright: a burst of light at
 *  center screen, then the card flies off to rest, glowing, in the top-right corner. */
export default function FinishCardFlourish() {
  const { settings } = useSettings();
  const [stage, setStage] = useState<Stage>('enter');
  const offsetRef = useRef(landingOffset());

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStage('burst'));
    const toLand = setTimeout(() => setStage('landed'), 450);
    const toSound = setTimeout(() => settings.soundOnMyTurn && playFinishCardSound(), 480);
    return () => { cancelAnimationFrame(raf); clearTimeout(toLand); clearTimeout(toSound); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { x, y } = offsetRef.current;
  const transform = stage === 'enter'
    ? 'translate(0, 0) scale(0.2) rotate(-10deg)'
    : stage === 'burst'
    ? 'translate(0, 0) scale(1.3) rotate(3deg)'
    : `translate(${x}px, ${y}px) scale(${LAND_SCALE}) rotate(0deg)`;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      {stage === 'burst' && (
        <div
          className="absolute w-40 h-40 rounded-full animate-finish-burst"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,214,120,0.5) 45%, transparent 72%)' }}
        />
      )}
      <div
        style={{
          transform,
          opacity: stage === 'enter' ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: stage === 'landed' ? '650ms' : '350ms',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className={stage === 'landed' ? 'animate-finish-glow rounded-xl' : 'rounded-xl'}
          style={stage === 'landed' ? { boxShadow: '0 0 24px 8px rgba(255,206,110,0.85)' } : undefined}
        >
          <CardComp card={FINISH_CARD} size="lg" disabled />
        </div>
      </div>
    </div>
  );
}
