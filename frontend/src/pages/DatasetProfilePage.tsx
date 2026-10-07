import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { DatasetOverview } from '../components/DatasetOverview';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { fetchDatasetProfile } from '../api/client';
import { DatasetProfile } from '../types';
import { MessageSquare, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

export const DatasetProfilePage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!datasetId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDatasetProfile(datasetId);
      setProfile(data);
    } catch (err: any) {
      setErrorMsg(err.message || `Dataset profile with ID '${datasetId}' not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [datasetId]);

  if (isLoading) {
    return <LoadingState message="Loading dataset profiling report..." />;
  }

  if (errorMsg || !profile) {
    return (
      <div>
        <button className="btn-secondary" onClick={() => navigate('/datasets')} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Datasets
        </button>
        <ErrorState message={errorMsg || 'Dataset profile not found.'} onRetry={loadProfile} />
      </div>
    );
  }

  const isHighQuality = profile.quality_score >= 80;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/datasets')} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Back to Datasets
        </button>
      </div>

      <PageHeader
        title={`Dataset Profile: ${profile.filename}`}
        description="Detailed Data Quality Score, schema distributions, and analysis readiness status."
        action={
          <button className="btn-primary" onClick={() => navigate(`/ask?datasetId=${profile.dataset_id}`)}>
            <MessageSquare size={16} />
            <span>Ask Analyst About This Dataset</span>
          </button>
        }
      />

      {/* Analysis Readiness Indicator Card */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', borderColor: isHighQuality ? 'rgba(57, 217, 138, 0.3)' : 'rgba(255, 184, 77, 0.3)', background: isHighQuality ? 'rgba(57, 217, 138, 0.05)' : 'rgba(255, 184, 77, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: isHighQuality ? '#39D98A' : '#FFB84D', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
          {isHighQuality ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          <span>Analysis Readiness: {isHighQuality ? 'Ready for Analysis' : 'Ready with Warnings'}</span>
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
          {isHighQuality
            ? `Dataset '${profile.filename}' passed all data quality checks with a score of ${profile.quality_score}/100. Suitable for high-precision statistical models.`
            : `Dataset '${profile.filename}' scored ${profile.quality_score}/100 with ${profile.warnings.length} quality alerts identified. The self-verification engine will apply robust non-parametric safeguards during analysis.`}
        </div>
      </div>

      {/* Embedded Full Dataset Profile Component */}
      <DatasetOverview profile={profile} />
    </div>
  );
};
