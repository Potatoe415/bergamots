"use client";

import { useCallback, useState, type Ref } from "react";

/**
 * Pixel width of a length-valued CSS custom property (e.g. `--card-lg-w`).
 * Put `probeRef` on a 0-height box; the hook sets that box's width to `var(name)`
 * so ResizeObserver always sees a resolved px value (unregistered custom props
 * can otherwise stay as `clamp(...)` tokens in getComputedStyle).
 * Callback ref so the observer attaches even if the probe mounts after the
 * first paint (empty pile → cards).
 */
export function useCssVarPx(name: string, fallback: number) {
  const [px, setPx] = useState(fallback);

  const probeRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const read = () => {
      const next = el.getBoundingClientRect().width;
      if (next > 0) setPx(next);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { probeRef, px, probeStyle: { width: `var(${name})` } as const };
}

/** 0-height width probe for `useCssVarPx`. */
export function CssVarProbe({
  probeRef,
  probeStyle,
}: {
  probeRef: Ref<HTMLDivElement | null>;
  probeStyle: { width: string };
}) {
  return (
    <div
      ref={probeRef}
      className="pointer-events-none invisible absolute left-0 top-0 h-px"
      style={probeStyle}
      aria-hidden
    />
  );
}
