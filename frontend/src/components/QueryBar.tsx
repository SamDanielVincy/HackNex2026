import React, { useState } from 'react';
import { Search, Sparkles, Send, Loader2 } from 'lucide-react';
import { ColumnProfile } from '../types';

interface QueryBarProps {
  columns: ColumnProfile[];
  onRunQuery: (question: string) => void;
  isAnalyzing: boolean;
}

export const QueryBar: React.FC<QueryBarProps> = ({ columns, onRunQuery, isAnalyzing }) => {
  const [question, setQuestion] = useState('');

  const numCols = columns.filter(c => c.data_type.includes('int') || c.data_type.includes('float')).map(c => c.name);
  const catCols = columns.filter(c => !numCols.includes(c.name)).map(c => c.name);

  // Generate dynamic contextual suggestions based on uploaded columns
  const suggestions = [
    catCols.length > 0 && numCols.length > 0
      ? `What is the total ${numCols[0]} by ${catCols[0]}?`
      : 'Show me metric breakdown by category',
    numCols.length >= 2
      ? `What is the correlation between ${numCols[0]} and ${numCols[1]}?`
      : 'Check statistical correlation between numerical variables',
    numCols.length > 0
      ? `Detect statistical anomalies in ${numCols.join(', ')}`
      : 'Detect data anomalies',
    numCols.length >= 2
      ? `Segment records using clustering on ${numCols.slice(0, 2).join(' and ')}`
      : 'Segment data into behavioral clusters',
    numCols.length >= 2
      ? `Predict ${numCols[0]} using regression models`
      : 'Build predictive regression model'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isAnalyzing) {
      onRunQuery(question.trim());
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={20} color="var(--secondary-accent)" />
        Ask Analytical Question
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Enter any natural-language query. InsightForge multi-agent engine will parse intent, run DuckDB/SciPy/ML calculations, verify confidence, and render findings.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is the correlation between revenue and profit? or Show breakdown by department..."
            disabled={isAnalyzing}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!question.trim() || isAnalyzing}
          style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Run Analysis</span>
            </>
          )}
        </button>
      </form>

      {/* Suggested Queries */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Suggested:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            className="btn-secondary"
            onClick={() => {
              setQuestion(s);
              onRunQuery(s);
            }}
            disabled={isAnalyzing}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
