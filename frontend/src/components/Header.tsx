import React from 'react';
import { ShieldCheck, Database, Cpu } from 'lucide-react';

interface HeaderProps {
  serverOnline: boolean;
  activeDatasetCount: number;
}

export const Header: React.FC<HeaderProps> = ({ serverOnline, activeDatasetCount }) => {
  return (
    <header className="app-header">
      <div className="brand-container">
        <div className="brand-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="brand-title">InsightForge AI</h1>
          <div className="brand-subtitle">Self-Verifying Multi-Agent Data Analyst</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Database size={16} />
          <span>{activeDatasetCount} Dataset{activeDatasetCount !== 1 ? 's' : ''} Loaded</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: serverOnline ? '#10b981' : '#ef4444',
            boxShadow: serverOnline ? '0 0 10px #10b981' : 'none'
          }} />
          <span style={{ color: serverOnline ? '#34d399' : '#f87171', fontWeight: 500 }}>
            {serverOnline ? 'Backend Online' : 'Backend Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
