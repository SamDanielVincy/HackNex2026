import React from 'react';
import Plot from 'react-plotly.js';

interface ChartViewerProps {
  spec: Record<string, any>;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({ spec }) => {
  if (!spec || !spec.data) return null;

  const data = spec.data || [];
  const layout = {
    ...(spec.layout || {}),
    autosize: true,
    height: 380,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(15, 23, 42, 0.6)',
    font: {
      color: '#f8fafc',
      family: 'Inter, sans-serif'
    }
  };

  return (
    <div style={{
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      padding: '0.5rem',
      background: 'rgba(15, 23, 42, 0.6)',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      <Plot
        data={data}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d']
        }}
      />
    </div>
  );
};
