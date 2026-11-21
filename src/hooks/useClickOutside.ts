import { RefObject, useEffect } from 'react';

/** Calls `onOutside` when a pointer press happens outside `ref` (only while `enabled`). */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, onOutside, enabled]);
};
