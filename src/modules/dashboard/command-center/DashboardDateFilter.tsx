import React from 'react';
import { useDashboardDate } from '../DashboardDateContext';
import { DateRangeFilter } from './DateRangeFilter';

/** Header-bound date filter wired to the dashboard's single date state. */
export const DashboardDateFilter: React.FC = () => {
  const { preset, range, setRange } = useDashboardDate();
  return <DateRangeFilter preset={preset} range={range} onChange={setRange} />;
};
