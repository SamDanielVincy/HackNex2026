import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfidenceBreakdown } from '../types';

interface VerificationBadgeProps {
  qualityStatus: 'HIGH_QUALITY' | 'VERIFIED_WITH_WARNINGS' | 'DEGRADED';
  confidenceScore: number;
  breakdown: ConfidenceBreakdown;
  dataSource: string;
  analysisType: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  qualityStatus,
  confidenceScore,
  breakdown,
  dataSource,
  analysisType,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = () => {
    if (qualityStatus === 'HIGH_QUALITY') {
      return <span className="badge badge-high"><ShieldCheck size={14} /> High Quality Verified</span>;
    } else if (qualityStatus === 'VERIFIED_WITH_WARNINGS') {
      return <span className="badge badge-medium"><AlertCircle size={14} /> Verified with Warnings</span>;
    } else {
      return <span className="badge badge-low"><AlertCircle size={14} /> Low Confidence / Degraded</span>;
    }
  };

  const getBarColor = (val: number) => {
    if (val >= 80) return '#10b981';
    if (val >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderRadius: '14px',
      background: 'rgba(15, 23, 42, 0.85)',
      border: '1px solid var(--border-color)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            {getStatusBadge()}
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
              Source: <strong style={{ color: 'var(--text-muted)' }}>{dataSource}</strong>
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Strategy: <strong>{analysisType}</strong>
          </div>
        </div>

        {/* Confidence Score pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verification Confidence
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getBarColor(confidenceScore) }}>
              {confidenceScore}%
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={() => setShowDetails(!showDetails)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Info size={14} />
            <span>Breakdown</span>
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Confidence Factor Breakdown */}
      {showDetails && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Sample Size Sufficiency</span>
              <strong>{breakdown.sample_size_score}%</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${breakdown.sample_size_score}%`, background: getBarColor(breakdown.sample_size_score) }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Data Completeness</span>
              <strong>{breakdown.data_completeness_score}%</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${breakdown.data_completeness_score}%`, background: getBarColor(breakdown.data_completeness_score) }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Statistical Validity</span>
              <strong>{breakdown.statistical_validity_score}%</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${breakdown.statistical_validity_score}%`, background: getBarColor(breakdown.statistical_validity_score) }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Distribution Normality</span>
              <strong>{breakdown.distribution_normality_score}%</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${breakdown.distribution_normality_score}%`, background: getBarColor(breakdown.distribution_normality_score) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
