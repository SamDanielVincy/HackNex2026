import React from 'react';
import { Zap, Compass, TrendingUp, SearchCode, Target } from 'lucide-react';

interface AnalysisModeSelectorProps {
  selectedMode: string;
  onSelectMode: (mode: string) => void;
}

export const AnalysisModeSelector: React.FC<AnalysisModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  const modes = [
    { id: 'Quick Insight', label: 'Quick Insight', desc: 'Fast statistical overview & top aggregations', icon: Zap },
    { id: 'Deep Analysis', label: 'Deep Analysis', desc: 'Full multi-agent statistical hypothesis test', icon: Compass },
    { id: 'Trend', label: 'Trend', desc: 'Time-series & sequential pattern analysis', icon: TrendingUp },
    { id: 'Root Cause', label: 'Root Cause', desc: 'Correlation & variance driver breakdown', icon: SearchCode },
    { id: 'Forecast', label: 'Forecast', desc: 'Predictive regression & model estimation', icon: Target },
  ];

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
        Select Analysis Strategy Mode
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem' }}>
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              style={{
                textAlign: 'left',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: isSelected ? 'rgba(79, 140, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                <Icon size={16} color={isSelected ? 'var(--primary-accent)' : 'var(--text-subtle)'} />
                <span>{mode.label}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', lineHeight: 1.3 }}>
                {mode.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
