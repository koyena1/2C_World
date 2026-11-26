import React, { createContext, useContext, useMemo, useState } from 'react';
import { presetRange, todayIso, type DateRange, type RangePreset } from './dateRange';

interface DashboardDateValue {
  preset: RangePreset;
  range: DateRange;
  setRange: (preset: RangePreset, range: DateRange) => void;
}

const DashboardDateContext = createContext<DashboardDateValue | null>(null);

/** The single date filter of the dashboard: the header picker writes it, every dashboard section reads it. Defaults to today. */
export const DashboardDateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ preset: RangePreset; range: DateRange }>(() => ({ preset: 'today', range: presetRange('today') }));
  // "Today" is re-read from the system clock, so it is still correct if the page stays open past midnight.
  const day = todayIso();
  const value = useMemo<DashboardDateValue>(
    () => ({
      preset: state.preset,
      range: state.preset === 'today' ? presetRange('today', day) : state.range,
      setRange: (preset, range) => setState({ preset, range }),
    }),
    [state, day]
  );
  return <DashboardDateContext.Provider value={value}>{children}</DashboardDateContext.Provider>;
};

export const useDashboardDate = (): DashboardDateValue => {
  const ctx = useContext(DashboardDateContext);
  if (!ctx) throw new Error('useDashboardDate must be used inside DashboardDateProvider');
  return ctx;
};
