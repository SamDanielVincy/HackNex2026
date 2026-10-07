import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { DataUploader } from '../components/DataUploader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { listUploadedDatasets } from '../api/client';
import { DatasetProfile } from '../types';
import { Database, Search, FileText, ArrowRight, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const list = await listUploadedDatasets();
      setDatasets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = datasets.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Ingested Datasets Repository"
        description="Upload, inspect data quality scores, and manage datasets for multi-agent analysis."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.75rem' }}>
        {/* Left Column: Data Uploader */}
        <div>
          <DataUploader onDatasetUploaded={(profile) => {
            setDatasets(prev => [profile, ...prev.filter(p => p.dataset_id !== profile.dataset_id)]);
          }} />
        </div>

        {/* Right Column: Dataset Inventory */}
        <div>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets by filename..."
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

          {isLoading ? (
            <LoadingState message="Loading datasets repository..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No Matching Datasets" : "No Datasets Uploaded"}
              message={searchQuery ? `No dataset filenames match '${searchQuery}'.` : "Upload a dataset file on the left or click one of the quick test samples."}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((ds) => (
                <div
                  key={ds.dataset_id}
                  className="glass-panel glass-panel-interactive"
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(79, 140, 255, 0.12)',
                      border: '1px solid rgba(79, 140, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-accent)',
                      flexShrink: 0
                    }}>
                      <FileText size={22} />
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {ds.filename}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '0.8rem' }}>
                        <span>{ds.row_count.toLocaleString()} rows</span>
                        <span>•</span>
                        <span>{ds.column_count} columns</span>
                        <span>•</span>
                        <span>{ds.memory_usage_kb} KB</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Quality Pill */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Quality Score
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: ds.quality_score >= 80 ? '#34d399' : '#fbbf24' }}>
                        {ds.quality_score} / 100
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/datasets/${ds.dataset_id}`)}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                      >
                        Inspect Profile
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/ask?datasetId=${ds.dataset_id}`)}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                      >
                        <MessageSquare size={14} />
                        <span>Analyze</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
