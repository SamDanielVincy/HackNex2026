import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface EvidenceDrawerProps {
  dataSource: string;
  analysisType: string;
  qualityStatus: string;
  confidenceScore: number;
  assumptions: string[];
  warnings: string[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  dataSource,
  analysisType,
  qualityStatus,
  confidenceScore,
  assumptions,
  warnings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <button
        className="btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'rgba(15, 23, 42, 0.8)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <HelpCircle size={16} color="var(--primary-accent)" />
          How was this determined?
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div style={{
          marginTop: '0.5rem',
          padding: '1.25rem',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Source Dataset</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dataSource}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Analytical Engine</div>
              <div style={{ color: 'var(--secondary-accent)', fontWeight: 600 }}>{analysisType}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Validation Status</div>
              <div style={{ color: '#34d399', fontWeight: 600 }}>{qualityStatus} ({confidenceScore}%)</div>
            </div>
          </div>

          {assumptions.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                Explicit Verified Assumptions:
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {assumptions.map((asm, idx) => (
                  <li key={idx}>{asm}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                Data Quality & Coverage Limitations:
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
