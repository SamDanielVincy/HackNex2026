import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Execution Error', message, onRetry }) => {
  return (
    <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem auto',
        color: '#f87171'
      }}>
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171', marginBottom: '0.4rem' }}>{title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
