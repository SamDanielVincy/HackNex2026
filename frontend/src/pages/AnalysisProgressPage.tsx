import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ErrorState } from '../components/ErrorState';
import { fetchAnalysisStatus, subscribeToAnalysisEvents } from '../api/client';
import { AnalysisStatus, AnalysisEvent } from '../types';
import { Bot, Check, Loader2, RefreshCw, ArrowLeft, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export const AnalysisProgressPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const [statusInfo, setStatusInfo] = useState<AnalysisStatus | null>(null);
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [connectionMode, setConnectionMode] = useState<string>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clarificationChoice, setClarificationChoice] = useState<string | null>(null);

  const defaultAgentSteps = [
    { role: 'Supervisor', title: 'Query Supervisor', msg: 'Understanding your analytical question' },
    { role: 'Data Profiler', title: 'Data Profiler', msg: 'Checking dataset quality & column schema' },
    { role: 'Intent Strategy', title: 'Intent Strategy', msg: 'Matching your question with available columns' },
    { role: 'Analytical Execution', title: 'Analytical Execution', msg: 'Running statistical analysis' },
    { role: 'Self Verification', title: 'Self Verification', msg: 'Checking whether the result is reliable' },
    { role: 'Synthesis and Visualization', title: 'Synthesis & Visuals', msg: 'Preparing charts and findings' }
  ];

  useEffect(() => {
    if (!analysisId) return;

    let cleanupStream: (() => void) | null = null;
    let pollInterval: any = null;

    // Polling fallback function
    const doPoll = async () => {
      try {
        const status = await fetchAnalysisStatus(analysisId);
        setStatusInfo(status);
        setConnectionMode('polling');

        if (status.status === 'completed') {
          navigate(`/analysis/${analysisId}/result`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch analysis status.');
      }
    };

    // Initial status fetch
    doPoll();

    // Subscribe via SSE stream with polling fallback
    cleanupStream = subscribeToAnalysisEvents(
      analysisId,
      (evt: AnalysisEvent) => {
        setEvents(prev => {
          if (prev.some(e => e.sequence === evt.sequence)) return prev;
          return [...prev, evt];
        });
        setConnectionMode('connected (SSE)');

        if (evt.status === 'completed') {
          setTimeout(() => navigate(`/analysis/${analysisId}/result`), 800);
        }
      },
      () => {
        // SSE disconnected or failed -> fallback to polling
        setConnectionMode('polling');
        pollInterval = setInterval(doPoll, 1500);
      }
    );

    return () => {
      if (cleanupStream) cleanupStream();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [analysisId, navigate]);

  if (errorMsg) {
    return (
      <div>
        <button className="btn-secondary" onClick={() => navigate('/ask')} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Return to Ask Analyst
        </button>
        <ErrorState message={errorMsg} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const currentAgent = statusInfo?.current_agent || 'Supervisor';
  const progressPercent = statusInfo?.progress_percent || 15;
  const isFailed = statusInfo?.status === 'failed';
  const isClarification = statusInfo?.status === 'needs_clarification';

  return (
    <div>
      <PageHeader
        title="Multi-Agent Analysis Pipeline"
        description="Visible agentic orchestration execution. Observe safe agent timeline in real-time."
      />

      {/* Progress Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
              Question
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              "{statusInfo?.question || 'Analytical query processing...'}"
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-high" style={{ fontSize: '0.75rem' }}>
              Connection: {connectionMode}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span>Pipeline Execution Progress</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--accent-gradient)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Clarification State */}
        {isClarification && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
              <HelpCircle size={18} />
              <span>Clarification Required</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              {statusInfo?.clarification_question || 'Please select how you would like to scope the target columns for analysis:'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(statusInfo?.clarification_options || ['Analyze overall average', 'Breakdown by top category', 'Use numerical features']).map((opt, idx) => (
                <button
                  key={idx}
                  className="btn-secondary"
                  onClick={() => {
                    setClarificationChoice(opt);
                    // Resume analysis
                    navigate(`/analysis/${analysisId}/result`);
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Failure State */}
        {isFailed && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, marginBottom: '0.4rem' }}>
              <AlertCircle size={18} />
              <span>Analysis Stopped</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
              {statusInfo?.error_message || 'The analysis pipeline stopped due to a data processing error.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => navigate('/ask')}>
                <ArrowLeft size={16} /> Return to Ask Analyst
              </button>
            </div>
          </div>
        )}

        {/* Agent Step Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {defaultAgentSteps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentAgent === step.role;
            const isPast = progressPercent >= (stepNum * 16);

            return (
              <div
                key={step.role}
                className={`step-item ${isCurrent ? 'running' : isPast ? 'completed' : ''}`}
              >
                <div className={`step-icon-wrapper ${isPast ? 'step-icon-completed' : isCurrent ? 'step-icon-running' : 'step-icon-pending'}`}>
                  {isPast ? <Check size={16} /> : isCurrent ? <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <span>{stepNum}</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isCurrent ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                    {step.role}: {step.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {step.msg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
