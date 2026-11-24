import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingMenuProps {
  /** The button the menu belongs to; the menu is placed next to it. */
  anchor: HTMLElement | null;
  onClose: () => void;
  /** Classes for the menu panel (surface, border, width, text size ...). Positioning is handled here. */
  className?: string;
  children: React.ReactNode;
}

const MARGIN = 8;
const GAP = 4;

/**
 * Menu that escapes table / card clipping. It renders into document.body with `position: fixed`,
 * so `overflow: hidden` / horizontal scrolling on any ancestor cannot cut it off, and it takes no
 * space in the layout. Placement is recomputed from the available viewport space:
 *  - below the button when it fits, otherwise above (or on the side with more room, with its own scroll)
 *  - right edge aligned with the button; if that would leave the screen it aligns to the left edge
 *    and is finally clamped inside the viewport.
 * It follows the button on scroll / resize and closes on outside press or Escape.
 */
export const FloatingMenu: React.FC<FloatingMenuProps> = ({ anchor, onClose, className, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const place = useCallback(() => {
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = panel.offsetWidth;
    const fullHeight = panel.scrollHeight;

    const spaceBelow = vh - a.bottom - GAP - MARGIN;
    const spaceAbove = a.top - GAP - MARGIN;
    const openUp = fullHeight > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);
    const height = Math.min(fullHeight, maxHeight);
    const top = openUp ? a.top - GAP - height : a.bottom + GAP;

    let left = a.right - width; // right edges line up
    if (left < MARGIN) left = a.left; // not enough room on the left: align left edges
    left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - width - MARGIN));

    setPos({ top: Math.max(MARGIN, top), left, maxHeight });
  }, [anchor]);

  useLayoutEffect(() => {
    place();
  }, [place, children]);

  useEffect(() => {
    const onMove = () => place();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true); // capture: scrolling inside the table moves the button too
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [place, onClose]);

  if (!anchor) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onMouseDown={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="menu"
        className={`fixed z-[81] overflow-y-auto ${className ?? ''}`}
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          maxHeight: pos?.maxHeight,
          // measured first, shown once placed (no flash in the wrong spot)
          visibility: pos ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
};
