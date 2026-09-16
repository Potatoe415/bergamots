"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeTopBar } from "@/components/HomeTopBar";
import { RulesModal } from "@/components/RulesModal";
import { useI18n } from "@/lib/client/i18n";
import { withHubName } from "@/lib/client/hubName";

/** Same layout/mode picker as the home screen, but every button reuses the existing
 *  /local, /online, /adhoc routes with `?game=bataillecorse` instead of a duplicated tree. */
export default function BataillecorsePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [showRules, setShowRules] = useState(false);

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between overflow-hidden bg-felt"
      data-id="bataillecorse-home-screen"
    >
      <HomeTopBar />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[25vh]" data-id="bataillecorse-splash-actions">
        <button
          data-id="bataillecorse-play-local-button"
          onClick={() => router.push("/local?game=bataillecorse")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playLocal")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("bataillecorseLocalOfflineNote")}</span>
        </button>

        <button
          data-id="bataillecorse-play-online-button"
          onClick={() => router.push(withHubName("/online?game=bataillecorse"))}
          className="w-full rounded-2xl bg-[var(--accent-cyan)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playOnline")}
        </button>

        <button
          data-id="bataillecorse-play-adhoc-button"
          onClick={() => router.push(withHubName("/adhoc?game=bataillecorse"))}
          className="w-full rounded-2xl bg-[var(--accent-green)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playAdhoc")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("adhocOfflineNote")}</span>
        </button>
      </div>

      <div className="relative z-10 mb-4 flex items-center gap-3 self-center">
        <button
          data-id="bataillecorse-rules-button"
          onClick={() => setShowRules(true)}
          className="rounded-lg border border-white/40 bg-transparent px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/60 hover:text-white/90 active:scale-95"
        >
          {t("rulesButton")}
        </button>
      </div>

      {showRules && <RulesModal game="bataillecorse" onClose={() => setShowRules(false)} />}
    </main>
  );
}
