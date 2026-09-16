"use client";

import { useState } from "react";
import { useLocalBataillecorseGame } from "@/lib/client/useLocalBataillecorseGame";
import { LOCAL_BATAILLECORSE_STORAGE_KEY, clearPersistedGame } from "@/lib/client/localGamePersistence";
import type { ReactionPick } from "@/lib/client/reactions";
import { useReactions } from "@/lib/client/useReactions";
import { BataillecorseTable } from "./BataillecorseTable";

export function BataillecorseLocalGame({ seed, botThinkMs }: { seed: number; botThinkMs: number }) {
  const [gameKey, setGameKey] = useState(0);
  return (
    <BataillecorseLocalGameInner
      key={gameKey}
      seed={seed + gameKey * 131071}
      botThinkMs={botThinkMs}
      onReset={() => {
        clearPersistedGame(LOCAL_BATAILLECORSE_STORAGE_KEY);
        setGameKey((k) => k + 1);
      }}
    />
  );
}

function BataillecorseLocalGameInner({
  seed,
  botThinkMs,
  onReset,
}: {
  seed: number;
  botThinkMs: number;
  onReset: () => void;
}) {
  const { gv, actions } = useLocalBataillecorseGame(seed, botThinkMs);
  const { reactions, addReaction } = useReactions();

  function onSendReaction(pick: ReactionPick) {
    addReaction(gv.mySeat ?? 0, pick);
  }

  return <BataillecorseTable gv={gv} reactions={reactions} actions={{ ...actions, onReset, onSendReaction }} />;
}
