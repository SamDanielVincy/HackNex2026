import React, { useState } from 'react';
import { Database, AlertTriangle, ShieldCheck, FileSpreadsheet, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { DatasetProfile } from '../types';

interface DatasetOverviewProps {
  profile: DatasetProfile;
}

export const DatasetOverview: React.FC<DatasetOverviewProps> = ({ profile }) => {
  const [showColumns, setShowColumns] = useState(true);

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <FileSpreadsheet size={22} color="var(--primary-accent)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{profile.filename}</h2>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Uploaded & Verified • {profile.data_summary}
          </div>
        </div>

        {/* Quality Score Meter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.6rem 1.2rem',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Data Quality Score
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: getScoreColor(profile.quality_score) }}>
              {profile.quality_score} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <ShieldCheck size={28} color={getScoreColor(profile.quality_score)} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="metrics-row" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-chip" style={{ flex: '1 1 140px' }}>
          <span className="metric-label">Total Rows</span>
          <span className="metric-val">{profile.row_count.toLocaleString()}</span>
        </div>
        <div className="metric-chip" style={{ flex: '1 1 140px' }}>
          <span className="metric-label">Total Columns</span>
          <span className="metric-val">{profile.column_count}</span>
        </div>
        <div className="metric-chip" style={{ flex: '1 1 140px' }}>
          <span className="metric-label">Duplicates</span>
          <span className="metric-val" style={{ color: profile.duplicate_rows > 0 ? '#fbbf24' : 'var(--text-main)' }}>
            {profile.duplicate_rows}
          </span>
        </div>
        <div className="metric-chip" style={{ flex: '1 1 140px' }}>
          <span className="metric-label">Memory Usage</span>
          <span className="metric-val">{profile.memory_usage_kb} KB</span>
        </div>
      </div>

      {/* Quality Warnings Callout */}
      {profile.warnings.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>Data Quality Alerts ({profile.warnings.length})</span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {profile.warnings.map((w, idx) => (
              <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className={`badge badge-${w.severity.toLowerCase()}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>
                  {w.severity}
                </span>
                <span>
                  <strong>{w.column ? `[${w.column}] ` : ''}</strong>{w.message} — <em style={{ color: 'var(--text-muted)' }}>{w.recommendation}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Column Schema Table Toggle */}
      <div>
        <button
          className="btn-secondary"
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showColumns ? '1rem' : '0' }}
          onClick={() => setShowColumns(!showColumns)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--primary-accent)" />
            Column Schema & Statistical Distributions ({profile.columns.length})
          </span>
          {showColumns ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showColumns && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Missing</th>
                  <th>Unique</th>
                  <th>Mean / Range</th>
                  <th>Skewness</th>
                  <th>Outliers</th>
                </tr>
              </thead>
              <tbody>
                {profile.columns.map((col) => (
                  <tr key={col.name}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{col.name}</td>
                    <td><code style={{ fontSize: '0.78rem', color: 'var(--secondary-accent)' }}>{col.data_type}</code></td>
                    <td style={{ color: col.missing_count > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                      {col.missing_count} ({col.missing_percent}%)
                    </td>
                    <td>{col.unique_count}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {col.mean !== null && col.mean !== undefined ? (
                        `Avg: ${Number(col.mean).toFixed(2)} [${col.min} to ${col.max}]`
                      ) : (
                        `Sample: ${col.sample_values.slice(0, 2).join(', ')}`
                      )}
                    </td>
                    <td>{col.skewness !== null && col.skewness !== undefined ? Number(col.skewness).toFixed(2) : '-'}</td>
                    <td>{col.outliers_count ? <span style={{ color: '#f87171' }}>{col.outliers_count}</span> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
