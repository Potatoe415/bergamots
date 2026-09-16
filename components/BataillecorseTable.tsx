"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PlayerView } from "@/lib/bataillecorse";
import { formatText, useI18n } from "@/lib/client/i18n";
import type { ReactionPick, TableReaction } from "@/lib/client/reactions";
import type { GameView } from "@/lib/server/view";
import { CardBack, PlayingCard } from "./PlayingCard";
import { EmojiButton } from "./EmojiButton";
import { ReactionBubble } from "./ReactionBubble";
import { GameInfoButton, HostRow, type HostControls } from "./GameHud";
import { playerName } from "./gameTableHelpers";

/** This table only ever renders a la Bataille Corse game: narrow the shared,
 *  multi-game `GameView` down to its own view/botViews shape. */
export type BataillecorseGameView = Omit<GameView, "view" | "botViews"> & {
  view: PlayerView | null;
  botViews?: Record<number, PlayerView>;
};

export interface BataillecorseActions {
  onFlip: () => Promise<void> | void;
  /** `reactionMs` is measured entirely client-side (see docs/DECISIONS.md);
   *  `observedWindowId` is whichever slap window this client last saw open. */
  onSlap: (reactionMs: number, observedWindowId: number | null) => Promise<void> | void;
  onBecomeHost?: () => Promise<void> | void;
  onForceSync?: () => void;
  onReset?: () => void;
  onSendReaction?: (pick: ReactionPick) => void;
  onRematch?: () => Promise<void> | void;
}

/** How long a "pile won"/"false slap" banner stays visible, diffed by event
 *  id so it flashes exactly once per occurrence (same pattern as Président's
 *  `lastBurn`/`lastSkip`, see docs/DECISIONS.md). */
const FLASH_MS = 1800;

function useFlash(eventId: number | undefined): boolean {
  const [visible, setVisible] = useState(false);
  const seenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (eventId === undefined || eventId === seenRef.current) return;
    seenRef.current = eventId;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [eventId]);
  return visible;
}

export function BataillecorseTable({
  gv,
  actions,
  reactions,
  selfAvatar,
}: {
  gv: BataillecorseGameView;
  actions: BataillecorseActions;
  reactions?: Map<number, TableReaction>;
  selfAvatar?: string;
}) {
  const { locale, t } = useI18n();
  const view = gv.view!;
  const mySeat = gv.mySeat!;
  const opponentSeat = mySeat === 0 ? 1 : 0;
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const windowSeenAtRef = useRef<{ id: number; perfMs: number } | null>(null);

  useEffect(() => {
    if (!view.slapWindow) return;
    if (windowSeenAtRef.current?.id === view.slapWindow.id) return;
    windowSeenAtRef.current = { id: view.slapWindow.id, perfMs: performance.now() };
  }, [view.slapWindow]);

  const pileWinFlash = useFlash(view.lastPileWin?.id);
  const falseSlapFlash = useFlash(view.lastFalseSlap?.id);
  const myTurnToFlip = view.phase === "playing" && view.turn === mySeat && view.slapWindow === null;
  const owesTribute = view.tribute?.seat === mySeat;

  async function tapFlip() {
    if (!myTurnToFlip || busy) return;
    setBusy(true);
    try {
      await actions.onFlip();
    } finally {
      setBusy(false);
    }
  }

  async function tapSlap() {
    if (view.phase !== "playing") return;
    const seen = view.slapWindow && windowSeenAtRef.current?.id === view.slapWindow.id ? windowSeenAtRef.current : null;
    const reactionMs = seen ? performance.now() - seen.perfMs : 0;
    const observedWindowId = view.slapWindow?.id ?? view.lastClosedSlapWindowId ?? null;
    await actions.onSlap(reactionMs, observedWindowId);
  }

  return (
    <main
      className="relative mx-auto flex h-svh min-h-[720px] w-full max-w-[460px] flex-1 flex-col overflow-hidden bg-felt text-[var(--card-face)]"
      data-id="bataillecorse-table"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#3aa59b_0%,#2f877f_48%,#276f69_100%)]" />

      <header className="absolute inset-x-0 top-4 z-30 flex items-center justify-between px-3">
        <Link
          href="/"
          aria-label={t("back")}
          data-id="bataillecorse-back"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card-face)] text-5xl font-black leading-none text-[var(--surface)] shadow-lg"
        >
          ‹
        </Link>
        <p className="rounded-full bg-[var(--surface-overlay)] px-4 py-1 text-sm font-black" data-id="bataillecorse-stock-tally">
          {view.myStockCount} — {view.opponentStockCount}
        </p>
        <GameInfoButton label={t("gameInfo")} onClick={() => setPanelOpen(true)} />
      </header>

      {panelOpen && (
        <InfoPanel
          host={
            actions.onBecomeHost && actions.onForceSync
              ? { isHost: gv.isHost, hostName: gv.hostSeat !== null ? playerName(gv, gv.hostSeat, locale) : null, onBecomeHost: actions.onBecomeHost, onForceSync: actions.onForceSync }
              : undefined
          }
          onReset={actions.onReset}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <div className="relative flex-1" data-id="bataillecorse-scene">
        <SeatRow
          label={playerName(gv, opponentSeat, locale)}
          stockCount={view.opponentStockCount}
          isTurn={view.turn === opponentSeat}
          reaction={reactions?.get(opponentSeat)}
          dataId="bataillecorse-opponent-seat"
          className="absolute inset-x-0 top-20"
        />

        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3" data-id="bataillecorse-pile-area">
          <PileFan cards={view.pile} />
          {view.tribute && (
            <p
              className="max-w-[85%] rounded-full bg-[var(--surface-overlay)] px-4 py-1.5 text-center text-xs font-bold"
              data-id="bataillecorse-tribute-banner"
            >
              {formatText(t("tributeOwed"), {
                player: owesTribute ? t("you") : playerName(gv, opponentSeat, locale),
                attempts: view.tribute.attemptsLeft,
              })}
            </p>
          )}
          {pileWinFlash && view.lastPileWin && (
            <p className="rounded-full bg-[var(--accent-yellow)] px-4 py-1.5 text-center text-xs font-black text-[var(--surface)]" data-id="bataillecorse-pile-win-flash">
              {formatText(t("pileWonBanner"), {
                player: view.lastPileWin.seat === mySeat ? t("you") : playerName(gv, opponentSeat, locale),
                count: view.lastPileWin.cardCount,
              })}
            </p>
          )}
          {falseSlapFlash && view.lastFalseSlap && (
            <p className="rounded-full bg-[var(--accent-red)] px-4 py-1.5 text-center text-xs font-black text-[var(--card-face)]" data-id="bataillecorse-false-slap-flash">
              {formatText(t("falseSlapBanner"), {
                player: view.lastFalseSlap.seat === mySeat ? t("you") : playerName(gv, opponentSeat, locale),
              })}
            </p>
          )}
          <button
            type="button"
            data-id="bataillecorse-slap-button"
            onClick={tapSlap}
            disabled={view.phase !== "playing"}
            className={[
              "h-28 w-28 rounded-full text-lg font-black uppercase shadow-2xl transition-transform active:scale-90",
              view.slapWindow ? "animate-pulse bg-[var(--accent-red)] text-[var(--card-face)] ring-4 ring-white" : "bg-[var(--accent-yellow)] text-[var(--surface)]",
            ].join(" ")}
          >
            {t("slapPileButton")}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-24 flex flex-col items-center gap-3" data-id="bataillecorse-self-seat">
          {selfAvatar !== undefined && (
            <p className="text-xs font-bold uppercase text-[var(--card-face)]/80" data-id="bataillecorse-self-name">
              {playerName(gv, mySeat, locale)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <CardBack size="md" dataId="bataillecorse-my-stock" />
            <span className="text-sm font-bold" data-id="bataillecorse-my-stock-count">
              {formatText(t("stockCount"), { count: view.myStockCount })}
            </span>
          </div>
          <button
            type="button"
            data-id="bataillecorse-flip-button"
            onClick={tapFlip}
            disabled={!myTurnToFlip || busy}
            className="rounded-2xl bg-[var(--accent-cyan)] px-8 py-3 text-lg font-black text-[var(--surface)] shadow-lg disabled:opacity-40"
          >
            {t("flipCardButton")}
          </button>
        </div>

        {actions.onSendReaction && <EmojiButton myReaction={reactions?.get(mySeat)} onSelect={actions.onSendReaction} />}
      </div>

      {view.phase === "finished" && (
        <FinishedOverlay gv={gv} view={view} onRematch={actions.onRematch} onReset={actions.onReset} />
      )}
    </main>
  );
}

function SeatRow({
  label,
  stockCount,
  isTurn,
  reaction,
  dataId,
  className,
}: {
  label: string;
  stockCount: number;
  isTurn: boolean;
  reaction?: TableReaction;
  dataId: string;
  className: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} data-id={dataId}>
      <p className={`text-xs font-bold uppercase ${isTurn ? "underline decoration-2" : ""}`}>{label}</p>
      <div className="flex items-center gap-2">
        <CardBack size="sm" />
        <span className="text-sm font-bold">{formatText(t("stockCount"), { count: stockCount })}</span>
      </div>
      {reaction && <ReactionBubble reaction={reaction} size="md" dataId="bataillecorse-opponent-reaction" />}
    </div>
  );
}

function PileFan({ cards }: { cards: PlayerView["pile"] }) {
  const shown = cards.slice(-3);
  if (shown.length === 0) {
    return <p className="text-sm italic text-[var(--card-face)]/70">{"—"}</p>;
  }
  return (
    <div className="relative h-24 w-16" data-id="bataillecorse-pile">
      {shown.map((card, i) => (
        <div
          key={i}
          className="absolute left-0 top-0"
          style={{ transform: `translate(${i * 4}px, ${-i * 4}px) rotate(${(i - 1) * 6}deg)`, zIndex: i }}
        >
          <PlayingCard card={card} size="md" dataId={`bataillecorse-pile-card-${i}`} />
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ host, onReset, onClose }: { host?: HostControls; onReset?: () => void; onClose: () => void }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-6" data-id="bataillecorse-info-overlay" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-5 shadow-2xl" data-id="bataillecorse-info-panel" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 text-center text-lg font-black text-[var(--card-face)]">{t("gameInfo")}</p>
        {host && <HostRow host={host} onClose={onClose} />}
        {onReset && (
          <button
            data-id="bataillecorse-reset-button"
            onClick={() => { onReset(); onClose(); }}
            className="mt-2 w-full rounded-lg bg-[var(--accent-red)]/80 py-2 font-bold text-[var(--card-face)]"
          >
            {t("restartGame")}
          </button>
        )}
        <div className="mb-3 mt-3 flex items-center justify-between" data-id="bataillecorse-language-row">
          <span className="text-sm text-[var(--card-face)]/80">{t("language")}</span>
          <div className="flex gap-1">
            {(["fr", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === lang ? "bg-[var(--accent-cyan)] text-[var(--surface)]" : "bg-[var(--card-face)]/10 text-[var(--card-face)]/70"}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-[var(--card-face)]/14 py-2 font-bold text-[var(--card-face)]" data-id="bataillecorse-info-close-button">
          {t("close")}
        </button>
      </div>
    </div>
  );
}

function FinishedOverlay({
  gv,
  view,
  onRematch,
  onReset,
}: {
  gv: BataillecorseGameView;
  view: PlayerView;
  onRematch?: () => Promise<void> | void;
  onReset?: () => void;
}) {
  const { t, locale } = useI18n();
  const iWon = view.winner === gv.mySeat;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6" data-id="bataillecorse-finished-overlay">
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl">
        <p className="mb-1 text-sm font-bold uppercase text-[var(--card-face)]/60">{t("gameFinished")}</p>
        <p className="mb-4 text-2xl font-black text-[var(--card-face)]" data-id="bataillecorse-winner-name">
          {iWon ? t("youWin") : formatText(t("bataillecorseWinnerBanner"), { player: playerName(gv, view.winner ?? 0, locale) })}
        </p>
        {onRematch && (
          <button
            data-id="bataillecorse-rematch-button"
            onClick={() => void onRematch()}
            className="mb-2 w-full rounded-lg bg-[var(--accent-cyan)] py-2 font-bold text-[var(--surface)]"
          >
            {t("newGame")}
          </button>
        )}
        {onReset && (
          <button
            data-id="bataillecorse-play-again-button"
            onClick={onReset}
            className="w-full rounded-lg bg-[var(--accent-yellow)] py-2 font-bold text-[var(--surface)]"
          >
            {t("newGame")}
          </button>
        )}
      </div>
    </div>
  );
}
