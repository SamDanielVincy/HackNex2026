import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { VerificationBadge } from '../components/VerificationBadge';
import { FindingCard } from '../components/FindingCard';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { fetchAnalysisResult } from '../api/client';
import { AnalysisResponse } from '../types';
import { Sparkles, MessageSquare, PlusCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export const AnalysisResultPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadResult = async () => {
    if (!analysisId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAnalysisResult(analysisId);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || `Analysis result for '${analysisId}' not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [analysisId]);

  if (isLoading) {
    return <LoadingState message="Retrieving verified analytical report..." />;
  }

  if (errorMsg || !result) {
    return (
      <div>
        <button className="btn-secondary" onClick={() => navigate('/history')} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to History
        </button>
        <ErrorState message={errorMsg || 'Result not found.'} onRetry={loadResult} />
      </div>
    );
  }

  return (
    <div>
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/history')} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Analysis History
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href={`/api/analyze/${result.analysis_id}/report`}
            download
            className="btn-secondary"
            style={{ fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} color="var(--secondary-accent)" />
            <span>Download Executive Report (.md)</span>
          </a>
          <button className="btn-primary" onClick={() => navigate(`/ask?datasetId=${result.dataset_id}`)} style={{ fontSize: '0.85rem' }}>
            <MessageSquare size={16} />
            <span>Ask Follow-Up Question</span>
          </button>
        </div>
      </div>

      <PageHeader
        title={`Verified Insight: ${result.analysis_type}`}
        description={`Query: "${result.question}" • Dataset: ${result.data_source}`}
      />

      {/* 1. Verification Summary Badge */}
      <VerificationBadge
        qualityStatus={result.quality_status}
        confidenceScore={result.confidence_score}
        breakdown={result.confidence_breakdown}
        dataSource={result.data_source}
        analysisType={result.analysis_type}
      />

      {/* 2. Headline & Executive Summary */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-accent)' }}>
          <Sparkles size={18} />
          Executive Summary
        </h3>
        <p style={{ fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          {result.executive_summary}
        </p>
      </div>

      {/* 3. Verified Findings Cards */}
      {result.findings.map((finding) => (
        <FindingCard
          key={finding.finding_id}
          finding={finding}
          assumptions={result.assumptions}
          warnings={result.warnings}
          recommendations={result.recommendations}
        />
      ))}

      {/* 4. Evidence Drawer */}
      <EvidenceDrawer
        dataSource={result.data_source}
        analysisType={result.analysis_type}
        qualityStatus={result.quality_status}
        confidenceScore={result.confidence_score}
        assumptions={result.assumptions}
        warnings={result.warnings}
      />

      {/* 5. Follow-Up Call-to-Action */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '14px', background: 'rgba(79, 140, 255, 0.06)', border: '1px solid rgba(79, 140, 255, 0.2)', textAlign: 'center' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Have a follow-up question on this data?</h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Explore further breakdowns, anomaly isolation, or predictive modeling on dataset {result.data_source}.
        </p>
        <button className="btn-primary" onClick={() => navigate(`/ask?datasetId=${result.dataset_id}`)}>
          <MessageSquare size={16} />
          <span>Ask Follow-Up Query</span>
        </button>
      </div>
    </div>
  );
};
