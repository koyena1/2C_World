import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MOCK_PIPELINE_STAGES, PipelineStage } from '../../data/mockDashboardData';
import { useTheme } from '../../hooks/useTheme';

interface MiniPipelineStepperProps {
  onShowToast?: (message: string) => void;
  onSelectStage?: (stageName: string) => void;
}

export const MiniPipelineStepper: React.FC<MiniPipelineStepperProps> = ({
  onShowToast,
  onSelectStage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();

  // Group the 14 stages into 5 operational lifecycle phases for compact view
  const lifecyclePhases = [
    {
      id: 'phase-sourcing',
      phaseName: '1. Sourcing & Intake',
      count: 164,
      percentage: 100,
      stuckCount: 22,
      color: 'bg-blue-500',
      description: 'Sourced & Screened',
      subStages: 'Stages 1 - 3'
    },
    {
      id: 'phase-offer',
      phaseName: '2. Offer & Rollout',
      count: 89,
      percentage: 54,
      stuckCount: 13,
      color: 'bg-purple-500',
      description: 'Requested, Rolled, Accepted',
      subStages: 'Stages 4 - 6'
    },
    {
      id: 'phase-docs',
      phaseName: '3. Docs & Verification',
      count: 54,
      percentage: 33,
      stuckCount: 14,
      color: 'bg-amber-500',
      description: 'Docs, KYC, Bank, BGV',
      subStages: 'Stages 7 - 10'
    },
    {
      id: 'phase-joining',
      phaseName: '4. Joining & Induction',
      count: 45,
      percentage: 27,
      stuckCount: 3,
      color: 'bg-emerald-500',
      description: 'Ready, Joining, Day-1 Joined',
      subStages: 'Stages 11 - 14'
    },
    {
      id: 'phase-dropped',
      phaseName: 'Drop-off / Attrition',
      count: 6,
      percentage: 4,
      stuckCount: 6,
      color: 'bg-rose-500',
      description: 'Offer Dropped / Declined',
      subStages: 'Exceptions'
    }
  ];

  return (
    <div className={`border rounded-xl p-4 transition-colors duration-150 ${
      isDark
        ? 'bg-slate-850/80 border-slate-750/90 text-slate-100 shadow-xs'
        : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
    }`}>
      {/* Header with Expand Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Onboarding Pipeline Lifecycle
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isDark
                  ? 'text-sky-400 bg-sky-950/80 border border-sky-800/80'
                  : 'text-sky-700 bg-sky-50 border border-sky-200'
              }`}>
                164 Candidates Ingested
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors self-start sm:self-auto border ${
            isDark
              ? 'text-sky-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border-slate-700'
              : 'text-sky-700 hover:text-sky-900 bg-slate-50 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span>{isExpanded ? 'Collapse to 5 Phases' : 'Expand Full 14-Stage Funnel'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Compact 5-Phase Bar Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {lifecyclePhases.map((phase) => (
          <div
            key={phase.id}
            onClick={() => {
              if (onSelectStage) onSelectStage(phase.phaseName);
              if (onShowToast) onShowToast(`Inspecting ${phase.phaseName} (${phase.count} candidates)`);
            }}
            className={`p-3 rounded-lg border transition-all cursor-pointer group flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/70 border-slate-750/80 hover:border-sky-500/60'
                : 'bg-slate-50/90 border-slate-200 hover:border-sky-400 hover:bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className={`font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {phase.subStages}
                </span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{phase.percentage}%</span>
              </div>
              <div className={`text-xs font-semibold group-hover:text-sky-500 transition-colors leading-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {phase.phaseName}
              </div>
              <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {phase.description}
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between">
                <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {phase.count}
                </span>
                {phase.stuckCount > 0 && (
                  <span className="text-[9px] font-semibold text-amber-500 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{phase.stuckCount} pending</span>
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className={`w-full h-1.5 rounded-full mt-1.5 overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}>
                <div
                  className={`h-full ${phase.color} rounded-full`}
                  style={{ width: `${Math.min(phase.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible Full 14-Stage Visual Funnel */}
      {isExpanded && (
        <div className={`mt-4 pt-3.5 border-t animate-in fade-in duration-200 ${
          isDark ? 'border-slate-750' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              All 14 Lifecycle Milestones (Detailed Step Conversion & Bottlenecks)
            </span>
            <span className="text-[10px] text-slate-400">Click any step to inspect candidates</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-stretch gap-2 min-w-[1150px]">
              {MOCK_PIPELINE_STAGES.map((stg) => (
                <div
                  key={stg.step}
                  onClick={() => {
                    if (onShowToast) onShowToast(`Drilling into Stage ${stg.step}: ${stg.name} (${stg.count} candidates)`);
                  }}
                  className={`flex-1 min-w-[125px] p-2.5 rounded-lg border transition-all cursor-pointer group flex flex-col justify-between ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-750 hover:border-sky-400'
                      : 'bg-slate-50 border-slate-200 hover:border-sky-500 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono font-bold text-sky-500">Step {stg.step}</span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{stg.percentage}%</span>
                    </div>
                    <div className={`text-[11px] font-semibold leading-tight mb-1.5 line-clamp-2 ${
                      isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'
                    }`}>
                      {stg.name}
                    </div>
                  </div>

                  <div>
                    <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {stg.count}
                    </div>
                    <div className={`w-full h-1 rounded-full mt-1.5 overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full ${stg.color} rounded-full`}
                        style={{ width: `${Math.min(stg.percentage, 100)}%` }}
                      />
                    </div>
                    {stg.stuckCount > 0 && (
                      <div className="text-[9px] text-amber-500 mt-1 font-medium truncate">
                        {stg.stuckCount} pending
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
