import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, icon: Icon, color = 'var(--primary-accent)' }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
      {Icon && (
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0
        }}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
