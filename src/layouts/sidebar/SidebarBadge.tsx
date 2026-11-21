import React from 'react';
import { BADGE_TONES } from './sidebar.styles';
import type { ResolvedBadge } from './sidebar.utils';

export const SidebarBadge: React.FC<{ badge: ResolvedBadge }> = ({ badge }) => (
  <span className={`shrink-0 ${BADGE_TONES[badge.tone]}`}>{badge.text}</span>
);
