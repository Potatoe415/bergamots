"use client";

/** Compact local-player name + optional avatar. Only mounted from online GameRoom. */
export function SelfNameChip({
  name,
  avatarSrc,
  isPresident = false,
}: {
  name: string;
  avatarSrc?: string;
  /** Président only: I am the round's president (first to empty my hand) -
   *  shows a small crown before my name. */
  isPresident?: boolean;
}) {
  return (
    <div
      className="pointer-events-none mb-1 flex items-center justify-center gap-1.5"
      data-id="self-name-chip"
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-[var(--card-face)]/40"
          data-id="self-name-avatar"
        />
      ) : null}
      <span className="max-w-[8rem] truncate text-xs font-bold uppercase leading-none text-[var(--card-face)] drop-shadow-lg">
        {isPresident && (
          <span className="mr-1 align-middle" data-id="self-crown-icon" aria-hidden="true">
            👑
          </span>
        )}
        {name}
      </span>
    </div>
  );
}
