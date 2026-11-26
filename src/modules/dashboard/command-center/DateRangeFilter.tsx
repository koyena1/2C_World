import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
  RANGE_MIN_DATE,
  RANGE_PRESETS,
  formatShort,
  presetRange,
  rangeLabel,
  todayIso,
  validateRange,
  type DateRange,
  type RangePreset,
} from '../dateRange';

interface DateRangeFilterProps {
  preset: RangePreset;
  range: DateRange;
  onChange: (preset: RangePreset, range: DateRange) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MIN_YEAR = Number(RANGE_MIN_DATE.slice(0, 4));

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const monthKey = (y: number, m: number) => y * 12 + m;

const navBtnCls =
  'w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md cc-muted hover:text-[color:var(--cc-title)] hover:bg-[color:var(--cc-accent-soft)] transition-colors cursor-pointer disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-[color:var(--cc-accent)]';
const linkBtnCls =
  'text-xs font-semibold text-[color:var(--cc-accent)] hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-default px-1 py-1 rounded';

interface RangeCalendarProps {
  initial: DateRange;
  onApply: (range: DateRange) => void;
  onCancel: () => void;
}

/** Native-style month grid: pick the start and end dates by clicking; Clear / Today shortcuts; Apply / Cancel finish the choice. */
const RangeCalendar: React.FC<RangeCalendarProps> = ({ initial, onApply, onCancel }) => {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [hover, setHover] = useState('');
  const [monthsView, setMonthsView] = useState(false);
  // The actual current date, read when the calendar opens (never hardcoded).
  const [maxDate] = useState(todayIso);
  const MAX_YEAR = Number(maxDate.slice(0, 4));
  const start = initial.to || maxDate;
  const [view, setView] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });

  const pickingEnd = Boolean(from) && !to;
  const lo = pickingEnd && hover && hover < from ? hover : from;
  const hi = pickingEnd ? (hover && hover >= from ? hover : from) : to || from;

  const minKey = monthKey(MIN_YEAR, Number(RANGE_MIN_DATE.slice(5, 7)) - 1);
  const maxKey = monthKey(MAX_YEAR, Number(maxDate.slice(5, 7)) - 1);
  const cur = monthKey(view.y, view.m);
  const clampView = (key: number) => {
    const k = Math.min(maxKey, Math.max(minKey, key));
    setView({ y: Math.floor(k / 12), m: k % 12 });
  };
  const go = (delta: number) => clampView(cur + delta);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array<null>(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [view]);

  const pick = (date: string) => {
    if (!from || to) {
      setFrom(date);
      setTo('');
    } else if (date < from) {
      setFrom(date);
    } else {
      setTo(date);
      setHover('');
    }
  };

  const clear = () => {
    setFrom('');
    setTo('');
    setHover('');
  };

  // A single click is a one-day range; a second click makes it a span.
  const complete = Boolean(from) && !validateRange({ from, to: to || from });

  return (
    <div className="flex flex-col gap-2 p-1" onMouseLeave={() => setHover('')}>
      {/* selected From / To, always visible */}
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        {([['From', from, !pickingEnd], ['To', to, pickingEnd]] as const).map(([label, value, active]) => (
          <div
            key={label}
            className={cn(
              'rounded-lg border px-2.5 py-1 min-w-0',
              active ? 'border-[color:var(--cc-accent)] bg-[color:var(--cc-accent-soft)]' : 'border-[color:var(--cc-card-border)]'
            )}
          >
            <span className="cc-muted block text-[10px] font-semibold uppercase tracking-wide">{label} Date</span>
            <span className={cn('block text-xs font-bold truncate', value ? 'cc-title' : 'cc-muted')}>{value ? formatShort(value) : 'Select date'}</span>
          </div>
        ))}
      </div>

      {/* month / year header */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setMonthsView((v) => !v)}
          aria-expanded={monthsView}
          aria-label="Choose month and year"
          className="inline-flex items-center gap-1 h-8 px-2 rounded-md cc-title text-sm font-bold hover:bg-[color:var(--cc-accent-soft)] transition-colors cursor-pointer"
        >
          {monthsView ? view.y : `${MONTHS[view.m]} ${view.y}`}
          <ChevronDown className={cn('w-3.5 h-3.5 cc-muted transition-transform', monthsView && 'rotate-180')} aria-hidden />
        </button>
        <div className="flex items-center">
          <button
            type="button"
            className={navBtnCls}
            onClick={() => (monthsView ? clampView(monthKey(view.y - 1, view.m)) : go(-1))}
            disabled={monthsView ? view.y <= MIN_YEAR : cur <= minKey}
            aria-label={monthsView ? 'Previous year' : 'Previous month'}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            className={navBtnCls}
            onClick={() => (monthsView ? clampView(monthKey(view.y + 1, view.m)) : go(1))}
            disabled={monthsView ? view.y >= MAX_YEAR : cur >= maxKey}
            aria-label={monthsView ? 'Next year' : 'Next month'}
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {monthsView ? (
        <div className="grid grid-cols-3 gap-1.5 py-1" role="group" aria-label={`Months of ${view.y}`}>
          {MONTHS.map((name, i) => {
            const disabled = monthKey(view.y, i) < minKey || monthKey(view.y, i) > maxKey;
            const selected = i === view.m;
            return (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setView({ y: view.y, m: i });
                  setMonthsView(false);
                }}
                className={cn(
                  'h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  selected ? 'bg-[color:var(--cc-accent)] text-[color:var(--cc-card-bg)]' : 'cc-title hover:bg-[color:var(--cc-accent-soft)]',
                  disabled && 'opacity-30 pointer-events-none'
                )}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      ) : (
        <div role="grid" aria-label={`${MONTHS[view.m]} ${view.y}`}>
          <div className="grid grid-cols-7 mb-0.5">
            {WEEKDAYS.map((d) => (
              <span key={d} className="cc-muted text-[11px] font-semibold text-center py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const date = iso(view.y, view.m, day);
              const disabled = date < RANGE_MIN_DATE || date > maxDate;
              const isStart = date === lo && Boolean(lo);
              const isEnd = date === hi && Boolean(hi);
              const inRange = Boolean(lo && hi) && date > lo && date < hi;
              const edge = isStart || isEnd;
              return (
                <div
                  key={date}
                  className={cn(
                    'relative flex justify-center',
                    inRange && 'bg-[color:var(--cc-accent-soft)]',
                    isStart && hi > lo && 'bg-gradient-to-r from-transparent from-50% to-[color:var(--cc-accent-soft)] to-50%',
                    isEnd && hi > lo && 'bg-gradient-to-l from-transparent from-50% to-[color:var(--cc-accent-soft)] to-50%'
                  )}
                >
                  <button
                    type="button"
                    role="gridcell"
                    disabled={disabled}
                    aria-selected={edge || inRange}
                    aria-label={formatShort(date)}
                    onClick={() => pick(date)}
                    onMouseEnter={() => setHover(date)}
                    className={cn(
                      'w-9 h-9 rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer',
                      edge
                        ? 'bg-[color:var(--cc-accent)] text-[color:var(--cc-card-bg)]'
                        : inRange
                        ? 'cc-title hover:bg-[color:var(--cc-accent-border)]'
                        : 'cc-title hover:bg-[color:var(--cc-accent-soft)]',
                      date === maxDate && !edge && 'ring-1 ring-inset ring-[color:var(--cc-accent)] text-[color:var(--cc-accent)]',
                      disabled && 'opacity-30 pointer-events-none'
                    )}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* shortcut */}
      <div className="flex items-center border-t border-[color:var(--cc-divider)] pt-1.5">
        <button type="button" onClick={clear} disabled={!from && !to} className={linkBtnCls}>Clear</button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="cc-btn cc-btn-secondary">Cancel</button>
        <button
          type="button"
          onClick={() => complete && onApply({ from, to: to || from })}
          disabled={!complete}
          className="cc-btn cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

/** Compact period selector for the Overview heading: Last 7 Days, Last 30 Days, or a calendar range. */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ preset, range, onChange }) => {
  const [open, setOpen] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setCalendar(false);
    setOpen((v) => !v);
  };

  const pick = (id: RangePreset) => {
    if (id === 'custom') {
      setCalendar(true);
      return;
    }
    onChange(id, presetRange(id));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        title={range.from === range.to ? formatShort(range.from) : `${formatShort(range.from)} – ${formatShort(range.to)}`}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer',
          'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700',
          'dark:bg-slate-900 dark:border-slate-750 dark:hover:bg-slate-800 dark:text-slate-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500'
        )}
        aria-label={`Dashboard date range: ${rangeLabel(preset, range)}`}
      >
        <Calendar className="w-4 h-4 text-sky-500 shrink-0" aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Overview date range"
          className={cn(
            // phones: pinned under the header, inside a 1rem gutter (full width for the calendar, compact for the list);
            // sm and up: dropdown anchored to the button. Scrolls instead of overflowing short screens.
            'cc-card fixed top-[calc(var(--app-header-height)+0.25rem)] right-4 z-50 p-1.5 shadow-lg overflow-y-auto overscroll-contain',
            'max-h-[calc(100dvh-var(--app-header-height)-1rem)]',
            calendar ? 'left-4 mx-auto max-w-[20rem]' : 'w-56 max-w-[calc(100vw-2rem)]',
            'sm:absolute sm:inset-x-auto sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:mx-0 sm:max-h-[min(34rem,calc(100dvh-var(--app-header-height)-1rem))]',
            calendar ? 'sm:w-[19rem]' : 'sm:w-56'
          )}
        >
          {calendar ? (
            <RangeCalendar
              initial={preset === 'custom' ? range : { from: '', to: '' }}
              onApply={(r) => {
                onChange('custom', r);
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            />
          ) : (
            <ul role="listbox" aria-label="Period" className="flex flex-col">
              {RANGE_PRESETS.map((p) => (
                <li key={p.id} role="option" aria-selected={preset === p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p.id)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs font-semibold cc-title hover:bg-[color:var(--cc-accent-soft)] text-left"
                  >
                    {p.label}
                    {preset === p.id && <Check className="w-3.5 h-3.5" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
