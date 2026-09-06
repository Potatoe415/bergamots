import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's content-box width via ResizeObserver.
 *
 * This is more reliable than `window.resize`/`orientationchange` on iOS
 * WebKit, which can skip events or deliver stale values while the browser
 * chrome (address bar) animates — the exact bug behind hand cards not
 * shrinking to fit the screen width until the user rotates the phone or
 * switches apps. ResizeObserver reacts to the element's actual rendered box,
 * so there is nothing for WebKit to cache incorrectly.
 */
export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const boxWidth = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      setWidth(Math.round(boxWidth));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
