import React from 'react';
import { Workflow } from 'lucide-react';
import type { PipelineStageMetric, StatusSlice } from '../dashboard.metrics';
import { ProgressBar, SectionCard } from './shared';

interface CandidatePipelineProps {
  stages: PipelineStageMetric[];
  statusMix: StatusSlice[];
  total: number;
}

const DROPPED = ['Offer Dropped', 'Dropout', 'Deferred'];

/** Onboarding funnel (stage reached / total added) plus the two numbers HR watches: conversion and drop-off. */
export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({ stages, statusMix, total }) => {
  const joined = stages.find((s) => s.id === 'joined');
  const dropped = statusMix.filter((s) => DROPPED.includes(s.status)).reduce((n, s) => n + s.count, 0);
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  return (
    <SectionCard
      title="Candidate Pipeline"
      subtitle="Onboarding flow, conversion and drop-off"
      className="xl:col-span-5 2xl:col-span-4 xl:order-1"
      action={
        <span className="tone-info tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
          <Workflow className="w-4 h-4" />
        </span>
      }
    >
      <ol className="space-y-3.5">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            <div className="flex items-baseline justify-between gap-2 mb-1.5 text-xs">
              <span className="cc-text font-semibold flex items-center gap-2 min-w-0">
                <span className="cc-muted tabular-nums w-4 shrink-0">{i + 1}</span>
                <span className="truncate">{stage.label}</span>
              </span>
              <span className="cc-muted tabular-nums whitespace-nowrap">
                <span className="cc-title font-bold">{stage.count}</span> ({stage.pct}%)
              </span>
            </div>
            <ProgressBar value={stage.pct} tone={stage.tone} label={`${stage.label}: ${stage.count} of ${total}`} />
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[color:var(--cc-divider)]">
        <div className="tone-good rounded-xl border border-[color:var(--cc-divider)] bg-[color:var(--cc-row-hover)] p-3">
          <p className="cc-muted text-[11px] font-semibold">Overall Conversion</p>
          <p className="tone-text text-xl font-bold tabular-nums leading-tight mt-0.5">{joined ? `${pct(joined.count)}%` : '0%'}</p>
          <p className="cc-muted text-[11px] tabular-nums">{joined?.count ?? 0} joined of {total}</p>
        </div>
        <div className="tone-bad rounded-xl border border-[color:var(--cc-divider)] bg-[color:var(--cc-row-hover)] p-3">
          <p className="cc-muted text-[11px] font-semibold">Total Drop-off</p>
          <p className="tone-text text-xl font-bold tabular-nums leading-tight mt-0.5">{pct(dropped)}%</p>
          <p className="cc-muted text-[11px] tabular-nums">{dropped} dropped or deferred</p>
        </div>
      </div>
    </SectionCard>
  );
};
