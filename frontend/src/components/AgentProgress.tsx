import React from 'react';
import { AgentProgressStep } from '../types';
import { Check, Loader2, Bot, Circle } from 'lucide-react';

interface AgentProgressProps {
  steps: AgentProgressStep[];
  isAnalyzing: boolean;
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ steps, isAnalyzing }) => {
  if (steps.length === 0 && !isAnalyzing) return null;

  // Deduplicate latest state per step_id
  const latestStepsMap = new Map<number, AgentProgressStep>();
  steps.forEach(step => {
    latestStepsMap.set(step.step_id, step);
  });
  const uniqueSteps = Array.from(latestStepsMap.values()).sort((a, b) => a.step_id - b.step_id);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={20} color="var(--primary-accent)" />
          Multi-Agent Execution Pipeline Progress
        </h3>
        {isAnalyzing && (
          <div className="badge badge-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Agents Processing Query...</span>
          </div>
        )}
      </div>

      <div className="step-timeline">
        {uniqueSteps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isRunning = step.status === 'running';

          return (
            <div
              key={step.step_id}
              className={`step-item ${isRunning ? 'running' : isCompleted ? 'completed' : ''}`}
            >
              <div className={`step-icon-wrapper ${isCompleted ? 'step-icon-completed' : isRunning ? 'step-icon-running' : 'step-icon-pending'}`}>
                {isCompleted ? (
                  <Check size={16} />
                ) : isRunning ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span>{step.step_id}</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isRunning ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                    Step {step.step_id}: {step.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {step.agent_name} • {step.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {step.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
