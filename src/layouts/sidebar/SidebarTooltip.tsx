import React, { useEffect, useRef, useState } from 'react';
import { sidebarStyles } from './sidebar.styles';

interface SidebarTooltipProps {
  label: string;
  /** Extra text shown after the label (e.g. a badge value). */
  detail?: string;
  /** Tooltips are only shown while the sidebar is collapsed. */
  enabled: boolean;
  children: React.ReactNode;
}

/**
 * Fixed-position tooltip: positioned from the trigger's bounding box so it is
 * never clipped by the sidebar's scroll/overflow container.
 */
export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, detail, enabled, children }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    if (!enabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
  };
  const hide = () => setPos(null);

  useEffect(() => {
    if (!enabled) setPos(null);
  }, [enabled]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {enabled && pos && (
        <span role="tooltip" style={{ top: pos.top, left: pos.left }} className={sidebarStyles.tooltip}>
          {label}
          {detail && <span className={sidebarStyles.tooltipDetail}>{detail}</span>}
        </span>
      )}
    </div>
  );
};
