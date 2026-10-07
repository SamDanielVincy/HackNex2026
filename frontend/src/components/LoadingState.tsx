import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading workspace data...' }) => {
  return (
    <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
      <Loader2 size={36} color="var(--primary-accent)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
      <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {message}
      </div>
    </div>
  );
};
