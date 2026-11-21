import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Step {
  label: string;
  status: 'done' | 'current' | 'todo';
  onClick?: () => void;
}

/** Horizontal numbered stepper (wizard / workflow progress). Look lives in design-system.css (.cc-stepper*). */
export const StepProgress: React.FC<{ steps: Step[]; className?: string }> = ({ steps, className }) => (
  <div className={cn('cc-stepper-scroll', className)}>
    <ol className="cc-stepper" style={{ ['--cc-step-count' as string]: steps.length }}>
      {steps.map((step, i) => (
        <li key={step.label} className={cn('cc-step', `cc-step-${step.status}`)}>
          <button
            type="button"
            onClick={step.onClick}
            disabled={!step.onClick}
            aria-current={step.status === 'current' ? 'step' : undefined}
            className="cc-step-btn"
          >
            <span className="cc-step-dot">{step.status === 'done' ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}</span>
            <span className="cc-step-label">{step.label}</span>
          </button>
        </li>
      ))}
    </ol>
  </div>
);
