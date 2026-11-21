import React from 'react';
import type { PipelineStageMetric, StatusSlice } from '../dashboard.metrics';
import { ProgressBar, SectionCard } from './shared';
import { DonutChart } from '../../../components/page/DonutChart';

interface CandidatePipelineProps {
  stages: PipelineStageMetric[];
  statusMix: StatusSlice[];
  total: number;
}

export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({ stages, statusMix, total }) => (
  <SectionCard
    title="Candidate Pipeline"
    subtitle="How many candidates have reached each onboarding stage"
    className="lg:col-span-2"
  >
    <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6">
      <ol className="2xl:col-span-3 space-y-3.5">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            <div className="flex items-baseline justify-between gap-2 mb-1.5 text-xs">
              <span className="cc-text font-semibold flex items-center gap-2">
                <span className="cc-muted tabular-nums w-4">{i + 1}</span>
                {stage.label}
              </span>
              <span className="cc-muted tabular-nums">
                <span className="cc-title font-bold">{stage.count}</span> · {stage.pct}%
              </span>
            </div>
            <ProgressBar value={stage.pct} tone={stage.tone} label={`${stage.label}: ${stage.count} of ${total}`} />
          </li>
        ))}
      </ol>

      <div className="2xl:col-span-2 2xl:border-l 2xl:pl-6 border-[color:var(--cc-divider)]">
        <h3 className="cc-muted text-[11px] font-semibold uppercase tracking-wider mb-3">Joining status</h3>
        <DonutChart
          slices={statusMix.map((s) => ({ key: s.status, label: s.status, count: s.count, tone: s.tone }))}
          total={total}
          caption="candidates"
          ariaLabel="Candidates by joining status"
        />
      </div>
    </div>
  </SectionCard>
);
