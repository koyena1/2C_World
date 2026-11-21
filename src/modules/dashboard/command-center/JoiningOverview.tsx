import React from 'react';
import type { JoiningEntry, JoiningOverview as JoiningOverviewData } from '../dashboard.metrics';
import { Chip, EmptyNote, SectionCard } from './shared';

interface JoiningOverviewProps {
  data: JoiningOverviewData;
  onOpenCandidate: (candidateId: string) => void;
}

const UPCOMING_LIMIT = 5;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const Row: React.FC<{ entry: JoiningEntry; showDate?: boolean; onOpen: (id: string) => void }> = ({ entry, showDate, onOpen }) => {
  const { candidate: c, hasBlocker } = entry;
  const joined = c.joiningStatus === 'Joined';

  return (
    <li>
      <button type="button" onClick={() => onOpen(c.id)} className="cc-row w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors">
        <span className="min-w-0 flex-1">
          <span className="cc-title block text-xs font-semibold truncate">{c.firstName} {c.lastName}</span>
          <span className="cc-muted block text-[11px] truncate">{c.clientName}{showDate ? ` · ${formatDate(c.dateOfJoining)}` : ''}</span>
        </span>
        {joined ? <Chip tone="good">Joined</Chip> : hasBlocker ? <Chip tone="bad">Blocked</Chip> : <Chip tone="info">On track</Chip>}
      </button>
    </li>
  );
};

const GroupLabel: React.FC<{ children: React.ReactNode; count: number }> = ({ children, count }) => (
  <h3 className="cc-muted text-[11px] font-semibold uppercase tracking-wider mb-1 px-2 flex items-center justify-between">
    <span>{children}</span>
    <span className="tabular-nums">{count}</span>
  </h3>
);

export const JoiningOverview: React.FC<JoiningOverviewProps> = ({ data, onOpenCandidate }) => {
  const upcoming = data.upcoming.slice(0, UPCOMING_LIMIT);
  const hidden = data.upcoming.length - upcoming.length;

  return (
    <SectionCard title="Joining Overview" subtitle="Today's and upcoming joiners">
      <div className="space-y-4 -mx-2">
        <div>
          <GroupLabel count={data.today.length}>Today</GroupLabel>
          {data.today.length ? (
            <ul>{data.today.map((e) => <Row key={e.candidate.id} entry={e} onOpen={onOpenCandidate} />)}</ul>
          ) : (
            <EmptyNote>No joinings today.</EmptyNote>
          )}
        </div>

        <div>
          <GroupLabel count={data.upcoming.length}>Upcoming</GroupLabel>
          {upcoming.length ? (
            <ul>{upcoming.map((e) => <Row key={e.candidate.id} entry={e} showDate onOpen={onOpenCandidate} />)}</ul>
          ) : (
            <EmptyNote>No upcoming joinings.</EmptyNote>
          )}
          {hidden > 0 && <p className="cc-muted text-[11px] px-2 mt-1">+{hidden} more in the Candidate Directory</p>}
        </div>
      </div>
    </SectionCard>
  );
};
