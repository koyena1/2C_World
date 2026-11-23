import React, { useState } from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';
import type { JoiningEntry, JoiningOverview as JoiningOverviewData } from '../dashboard.metrics';
import { Avatar } from '../../../components/ui/Avatar';
import { CategoryTabs } from '../../../components/page/CategoryTabs';
import { Chip, EmptyNote, SectionCard } from './shared';

interface JoiningOverviewProps {
  data: JoiningOverviewData;
  onOpenCandidate: (candidateId: string) => void;
}

type JoiningTab = 'today' | 'next7';
const ROW_LIMIT = 8;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const initialsOf = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

const Readiness: React.FC<{ entry: JoiningEntry }> = ({ entry }) =>
  entry.candidate.joiningStatus === 'Joined' ? (
    <Chip tone="good" className="rounded-full">Joined</Chip>
  ) : entry.hasBlocker ? (
    <Chip tone="warn" className="rounded-full">At Risk</Chip>
  ) : (
    <Chip tone="good" className="rounded-full">Ready</Chip>
  );

/* Desktop column layout shared by the header and the rows */
const COLS = 'md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_7.5rem_5.5rem_1rem]';

/** Today's and the next 7 days' joiners with a readiness flag: the HR daily-ops list. */
export const JoiningOverview: React.FC<JoiningOverviewProps> = ({ data, onOpenCandidate }) => {
  const [tab, setTab] = useState<JoiningTab>('today');
  const list = tab === 'today' ? data.today : data.next7;
  const rows = list.slice(0, ROW_LIMIT);
  const hidden = list.length - rows.length;
  const beyondWindow = tab === 'next7' ? data.upcoming.length - data.next7.length : 0;

  return (
    <SectionCard
      title="Upcoming Joinings & Readiness"
      subtitle="Today's and next 7 days' joiners with readiness status"
      className="order-2 xl:order-none"
      action={
        <span className="tone-warn tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
          <CalendarClock className="w-4 h-4" />
        </span>
      }
    >
      <CategoryTabs
        className="-mt-2 mb-1 -mx-1"
        value={tab}
        onChange={(v) => setTab(v as JoiningTab)}
        tabs={[
          { value: 'today', label: 'Today', count: data.today.length },
          { value: 'next7', label: 'Next 7 Days', count: data.next7.length },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyNote>{tab === 'today' ? 'No joinings today.' : 'No joinings in the next 7 days.'}</EmptyNote>
      ) : (
        <>
          {/* column labels (tablet / desktop) */}
          <div className={`hidden md:grid ${COLS} gap-3 px-2 py-1.5 rounded-lg bg-[color:var(--cc-row-hover)] cc-muted text-[11px] font-semibold uppercase tracking-wider`}>
            <span>Candidate</span>
            <span>Client</span>
            <span>Designation</span>
            <span>Joining Date</span>
            <span>Readiness</span>
            <span />
          </div>

          <ul className="cc-divide">
            {rows.map((e) => {
              const c = e.candidate;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCandidate(c.id)}
                    className="cc-row w-full text-left px-2 py-1.5 rounded-lg transition-colors"
                  >
                    {/* tablet / desktop: one aligned row */}
                    <span className={`hidden md:grid ${COLS} items-center gap-3 text-xs`}>
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Avatar initials={initialsOf(c.firstName, c.lastName)} size="sm" />
                        <span className="cc-title font-semibold truncate">{c.firstName} {c.lastName}</span>
                      </span>
                      <span className="cc-text truncate">{c.clientName}</span>
                      <span className="cc-text truncate">{c.designation}</span>
                      <span className="cc-text tabular-nums whitespace-nowrap">{formatDate(c.dateOfJoining)}</span>
                      <span><Readiness entry={e} /></span>
                      <ChevronRight className="cc-muted w-4 h-4" aria-hidden />
                    </span>

                    {/* phone: compact two-line card row */}
                    <span className="md:hidden flex items-start gap-2.5">
                      <Avatar initials={initialsOf(c.firstName, c.lastName)} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="cc-title block text-[13px] font-semibold truncate">{c.firstName} {c.lastName}</span>
                        <span className="cc-muted block text-[11px] truncate">{c.designation} · {c.clientName}</span>
                        <span className="cc-muted block text-[11px] tabular-nums">{formatDate(c.dateOfJoining)}</span>
                      </span>
                      <Readiness entry={e} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {(hidden > 0 || beyondWindow > 0) && (
            <p className="cc-muted text-[11px] mt-3 px-2">
              {hidden > 0 && <>+{hidden} more in this list. </>}
              {beyondWindow > 0 && <>{beyondWindow} more joining later. </>}
              Open the Candidate Directory for the full list.
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
};
