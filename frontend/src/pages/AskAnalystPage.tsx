import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { AnalysisModeSelector } from '../components/AnalysisModeSelector';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { listUploadedDatasets, startAnalysisJob } from '../api/client';
import { DatasetProfile } from '../types';
import { MessageSquare, Sparkles, Send, Database, AlertCircle, Eye, ArrowRight } from 'lucide-react';

export const AskAnalystPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedId = searchParams.get('datasetId') || '';
  const [datasets, setDatasets] = useState<DatasetProfile[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(preselectedId);
  const [question, setQuestion] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<string>('Quick Insight');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      setIsLoadingDatasets(true);
      try {
        const list = await listUploadedDatasets();
        setDatasets(list);
        if (list.length > 0 && !selectedDatasetId) {
          if (preselectedId && list.some(d => d.dataset_id === preselectedId)) {
            setSelectedDatasetId(preselectedId);
          } else {
            setSelectedDatasetId(list[0].dataset_id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingDatasets(false);
      }
    };
    fetchDatasets();
  }, [preselectedId]);

  const selectedDataset = datasets.find(d => d.dataset_id === selectedDatasetId);

  const suggestions = selectedDataset ? [
    `What is the distribution of values in ${selectedDataset.columns[0]?.name || 'dataset'}?`,
    selectedDataset.columns.length >= 2 ? `What is the correlation between ${selectedDataset.columns[0]?.name} and ${selectedDataset.columns[1]?.name}?` : 'Show metric breakdown by category',
    `Detect statistical anomalies in ${selectedDataset.filename}`,
    selectedDataset.columns.length >= 2 ? `Predict ${selectedDataset.columns[0]?.name} using regression modeling` : 'Build predictive regression model'
  ] : [
    'What is the correlation between variables?',
    'Detect statistical anomalies in the dataset',
    'Show metric breakdown by category',
    'Predict target variable using regression models'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) {
      setErrorMsg('Please select a dataset to analyze.');
      return;
    }
    if (!question.trim()) {
      setErrorMsg('Please enter a natural-language analytical question.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const resp = await startAnalysisJob(selectedDatasetId, question.trim(), analysisMode);
      // Navigate quickly to analysis progress page
      navigate(`/analysis/${resp.analysis_id}/progress`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize multi-agent analysis job.');
      setIsSubmitting(false);
    }
  };

  if (isLoadingDatasets) {
    return <LoadingState message="Loading analytical workspace..." />;
  }

  if (datasets.length === 0) {
    return (
      <div>
        <PageHeader title="Ask Multi-Agent Analyst" description="Execute natural-language queries against your tabular datasets." />
        <EmptyState
          title="No Datasets Available"
          message="Please upload at least one dataset before asking analytical questions."
          action={
            <button className="btn-primary" onClick={() => navigate('/datasets')}>
              <Database size={16} /> Go to Datasets
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ask Multi-Agent Analyst"
        description="Enter natural-language analytical questions. The multi-agent engine will parse intent, execute queries, and self-verify findings."
      />

      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Dataset Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Target Dataset
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            >
              {datasets.map((d) => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {d.filename} ({d.row_count.toLocaleString()} rows • Score: {d.quality_score}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Analysis Strategy Mode Selector */}
          <AnalysisModeSelector
            selectedMode={analysisMode}
            onSelectMode={(mode) => setAnalysisMode(mode)}
          />

          {/* Question Text Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Analytical Question
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the correlation between revenue and profit? or Find unusual anomaly records..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Suggested Questions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Suggested Questions:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-secondary"
                onClick={() => setQuestion(s)}
                disabled={isSubmitting}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Analysis Preview Box */}
          {question.trim() && selectedDataset && (
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(79, 140, 255, 0.05)',
              border: '1px solid rgba(79, 140, 255, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Eye size={14} />
                <span>Analysis Preview</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div><strong>Dataset:</strong> {selectedDataset.filename} ({selectedDataset.row_count.toLocaleString()} rows)</div>
                <div><strong>Strategy Mode:</strong> {analysisMode}</div>
                <div><strong>Question:</strong> "{question.trim()}"</div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!question.trim() || isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem 1.5rem', fontSize: '1rem' }}
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Queueing Analysis Pipeline...' : 'Start Multi-Agent Analysis'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
