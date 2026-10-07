import React, { useState } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { VerifiedFinding } from '../types';
import { ChartViewer } from './ChartViewer';

interface FindingCardProps {
  finding: VerifiedFinding;
  assumptions: string[];
  warnings: string[];
  recommendations: string[];
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  assumptions,
  warnings,
  recommendations,
}) => {
  const [showAssumptions, setShowAssumptions] = useState(false);

  const metricsEntries = Object.entries(finding.key_metrics || {}).filter(
    ([k, v]) => typeof v === 'number' || typeof v === 'string'
  );

  return (
    <div className="glass-panel finding-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <Lightbulb size={22} color="var(--secondary-accent)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{finding.title}</h3>
      </div>

      {/* Summary Banner */}
      <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '0.85rem 1rem', borderRadius: '10px', borderLeft: '4px solid var(--primary-accent)' }}>
        {finding.summary}
      </p>

      {/* Statistical Test Significance Tag */}
      {finding.statistical_summary && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          background: finding.statistical_summary.is_significant ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${finding.statistical_summary.is_significant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          color: finding.statistical_summary.is_significant ? '#34d399' : '#fbbf24',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <TrendingUp size={16} />
          <span>
            {finding.statistical_summary.test_name}: Statistic = {finding.statistical_summary.statistic_value?.toFixed(3)}
            {finding.statistical_summary.p_value !== null && ` (p = ${finding.statistical_summary.p_value?.toFixed(4)})`}
            {finding.statistical_summary.is_significant ? ' • Statistically Significant' : ' • Inconclusive Significance'}
          </span>
        </div>
      )}

      {/* Key Metric Chips */}
      {metricsEntries.length > 0 && (
        <div className="metrics-row">
          {metricsEntries.slice(0, 6).map(([key, val]) => (
            <div key={key} className="metric-chip">
              <span className="metric-label">{key.replace(/_/g, ' ')}</span>
              <span className="metric-val">
                {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Plotly Visual Chart */}
      {finding.chart_spec && (
        <ChartViewer spec={finding.chart_spec} />
      )}

      {/* Detailed Human-Readable Explanation */}
      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        {finding.detailed_explanation}
      </div>

      {/* Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '1rem'
        }}>
          <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} />
            <span>Actionable Strategic Recommendations</span>
          </div>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.84rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Quality Warnings Callouts */}
      {warnings.length > 0 && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          color: '#fbbf24',
          fontSize: '0.82rem',
          marginBottom: '1rem'
        }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <AlertTriangle size={14} /> Analytical & Data Coverage Warnings ({warnings.length}):
          </strong>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Explicit Analytical Assumptions Drawer */}
      {assumptions.length > 0 && (
        <div>
          <button
            className="btn-secondary"
            onClick={() => setShowAssumptions(!showAssumptions)}
            style={{ width: '100%', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HelpCircle size={14} color="var(--text-muted)" />
              Explicit Analytical Assumptions ({assumptions.length})
            </span>
            {showAssumptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAssumptions && (
            <ul style={{
              marginTop: '0.5rem',
              padding: '0.75rem 1rem 0.75rem 2rem',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.7)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}>
              {assumptions.map((asm, idx) => (
                <li key={idx}>{asm}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
