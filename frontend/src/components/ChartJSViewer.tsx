import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartJSViewerProps {
  chartType: 'bar' | 'line' | 'doughnut' | 'polar' | string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
  title?: string;
  height?: number;
}

export const ChartJSViewer: React.FC<ChartJSViewerProps> = ({
  chartType,
  labels,
  datasets,
  title,
  height = 300
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter, sans-serif', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#f8fafc',
        font: { family: 'Inter, sans-serif', size: 14, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true
      }
    },
    scales: chartType === 'doughnut' || chartType === 'polar' ? undefined : {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };

  const formattedData = {
    labels: labels.length > 0 ? labels : ['Data 1', 'Data 2', 'Data 3'],
    datasets: datasets.map((ds, idx) => {
      const palette = [
        { bg: 'rgba(99, 102, 241, 0.6)', border: '#6366f1' },
        { bg: 'rgba(16, 185, 129, 0.6)', border: '#10b981' },
        { bg: 'rgba(236, 72, 153, 0.6)', border: '#ec4899' },
        { bg: 'rgba(245, 158, 11, 0.6)', border: '#f59e0b' }
      ];
      const color = palette[idx % palette.length];

      return {
        ...ds,
        backgroundColor: ds.backgroundColor || (chartType === 'doughnut' || chartType === 'polar' ? [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(14, 165, 233, 0.8)'
        ] : color.bg),
        borderColor: ds.borderColor || (chartType === 'doughnut' || chartType === 'polar' ? '#0f172a' : color.border),
        borderWidth: ds.borderWidth || 2,
        tension: 0.35,
        fill: ds.fill !== undefined ? ds.fill : (chartType === 'line')
      };
    })
  };

  return (
    <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
      {chartType === 'line' && <Line options={options} data={formattedData} />}
      {chartType === 'bar' && <Bar options={options} data={formattedData} />}
      {chartType === 'doughnut' && <Doughnut options={options} data={formattedData} />}
      {chartType === 'polar' && <PolarArea options={options} data={formattedData} />}
      {!['line', 'bar', 'doughnut', 'polar'].includes(chartType) && <Bar options={options} data={formattedData} />}
    </div>
  );
};
