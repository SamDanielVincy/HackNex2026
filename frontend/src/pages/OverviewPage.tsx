import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { listUploadedDatasets, fetchAnalysisHistory } from '../api/client';
import { DatasetProfile, AnalysisHistoryItem } from '../types';
import { Database, MessageSquare, ShieldCheck, Sparkles, PlusCircle, ArrowRight, AlertTriangle, Activity } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetProfile[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const dsList = await listUploadedDatasets().catch(() => []);
        const histList = await fetchAnalysisHistory().catch(() => []);
        setDatasets(dsList);
        setHistory(histList);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const totalWarnings = datasets.reduce((sum, d) => sum + d.warnings.length, 0);
  const avgConfidence = history.length > 0
    ? (history.reduce((sum, h) => sum + h.confidence_score, 0) / history.length).toFixed(1)
    : 'N/A';

  const generateWorkspacePulse = () => {
    if (datasets.length === 0) {
      return "Workspace ready. Upload a dataset to launch multi-agent profiling.";
    }
    if (totalWarnings > 0) {
      return `${datasets.length} dataset${datasets.length > 1 ? 's' : ''} loaded. ${totalWarnings} data quality alert${totalWarnings > 1 ? 's' : ''} identified requiring review.`;
    }
    return `${datasets.length} dataset${datasets.length > 1 ? 's' : ''} ingested and verified. Ready for analytical queries.`;
  };

  if (isLoading) {
    return <LoadingState message="Loading InsightForge workspace pulse..." />;
  }

  return (
    <div>
      <PageHeader
        title="InsightForge AI Mission Control"
        description="Self-verifying multi-agent data analyst workspace."
        action={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => navigate('/datasets')}>
              <PlusCircle size={16} />
              <span>Upload Dataset</span>
            </button>
            <button className="btn-primary" onClick={() => navigate('/ask')}>
              <MessageSquare size={16} />
              <span>Ask Analyst</span>
            </button>
          </div>
        }
      />

      {/* Workspace Pulse Card */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', borderColor: 'var(--border-highlight)', background: 'rgba(79, 140, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
          <Activity size={18} />
          <span>Workspace Pulse</span>
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
          {generateWorkspacePulse()}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <MetricCard label="Active Datasets" value={datasets.length} icon={Database} color="#4F8CFF" />
        <MetricCard label="Analyses Conducted" value={history.length} icon={MessageSquare} color="#9B6CFF" />
        <MetricCard label="Average Confidence" value={avgConfidence === 'N/A' ? 'N/A' : `${avgConfidence}%`} icon={ShieldCheck} color="#39D98A" />
        <MetricCard label="Quality Alerts" value={totalWarnings} icon={AlertTriangle} color="#FFB84D" />
      </div>

      {/* Main Grid: Recent Datasets & Recent Analyses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
        {/* Recent Datasets Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--primary-accent)" />
              Recent Datasets
            </h3>
            <button className="btn-secondary" onClick={() => navigate('/datasets')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
              View All
            </button>
          </div>

          {datasets.length === 0 ? (
            <EmptyState
              title="No Datasets Ingested"
              message="Upload a CSV, Excel, Parquet, or JSON file to start profiling."
              action={
                <button className="btn-primary" onClick={() => navigate('/datasets')} style={{ fontSize: '0.85rem' }}>
                  Go to Datasets
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {datasets.slice(0, 4).map((ds) => (
                <div
                  key={ds.dataset_id}
                  onClick={() => navigate(`/datasets/${ds.dataset_id}`)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{ds.filename}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ds.row_count.toLocaleString()} rows • {ds.column_count} cols • Quality: {ds.quality_score}/100
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-subtle)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Analyses Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--secondary-accent)" />
              Recent Verified Analyses
            </h3>
            <button className="btn-secondary" onClick={() => navigate('/history')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
              View History
            </button>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No Analytical Queries Executed"
              message="Select a dataset and ask a natural-language question."
              action={
                <button className="btn-primary" onClick={() => navigate('/ask')} style={{ fontSize: '0.85rem' }}>
                  Ask First Question
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.analysis_id}
                  onClick={() => navigate(`/analysis/${item.analysis_id}/result`)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{item.question}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.dataset_name} • {item.analysis_type} • Confidence: {item.confidence_score}%
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
