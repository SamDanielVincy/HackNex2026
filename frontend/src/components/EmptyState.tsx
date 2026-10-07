import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon: Icon = Inbox, action }) => {
  return (
    <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(79, 140, 255, 0.1)',
        border: '1px solid rgba(79, 140, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem auto',
        color: 'var(--primary-accent)'
      }}>
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
