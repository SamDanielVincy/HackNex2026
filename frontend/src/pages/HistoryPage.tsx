import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { fetchAnalysisHistory } from '../api/client';
import { AnalysisHistoryItem } from '../types';
import { History, Search, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const list = await fetchAnalysisHistory();
        setHistory(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filtered = history.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.dataset_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Analysis History Archive"
        description="Reopen previous verified analytical query results and step progress logs."
        action={
          <button className="btn-primary" onClick={() => navigate('/ask')}>
            <MessageSquare size={16} />
            <span>New Analysis</span>
          </button>
        }
      />

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter history by question or dataset name..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.8rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="QUEUED">Queued / Running</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading analysis history archive..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No Matching Analyses" : "No Analysis History Yet"}
          message={searchQuery ? `No history records match '${searchQuery}'.` : "Ask your first analytical question to create historical reports."}
          action={
            <button className="btn-primary" onClick={() => navigate('/ask')}>
              <MessageSquare size={16} /> Ask First Question
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((item) => {
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.analysis_id}
                className="glass-panel glass-panel-interactive"
                onClick={() => {
                  if (isCompleted) {
                    navigate(`/analysis/${item.analysis_id}/result`);
                  } else {
                    navigate(`/analysis/${item.analysis_id}/progress`);
                  }
                }}
                style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    "{item.question}"
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span>Dataset: <strong>{item.dataset_name}</strong></span>
                    <span>•</span>
                    <span>Type: {item.analysis_type}</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Confidence</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.confidence_score >= 80 ? '#34d399' : '#fbbf24' }}>
                      {item.confidence_score}%
                    </div>
                  </div>

                  <span className={`badge ${isCompleted ? 'badge-high' : 'badge-medium'}`}>
                    {item.status.toUpperCase()}
                  </span>

                  <ArrowRight size={18} color="var(--text-subtle)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
