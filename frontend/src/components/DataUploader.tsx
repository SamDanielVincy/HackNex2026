import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { uploadDatasetFile } from '../api/client';
import { DatasetProfile } from '../types';

interface DataUploaderProps {
  onDatasetUploaded: (profile: DatasetProfile) => void;
}

export const DataUploader: React.FC<DataUploaderProps> = ({ onDatasetUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const resp = await uploadDatasetFile(file);
      onDatasetUploaded(resp.profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset');
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleDataset = async (type: 'sales' | 'churn' | 'salary') => {
    setErrorMsg(null);
    setIsUploading(true);

    let csvContent = '';
    let filename = '';

    if (type === 'sales') {
      filename = 'regional_sales_performance.csv';
      csvContent = `region,store,revenue,profit,discount_percent,units_sold,satisfaction_score
North,StoreA,125000,32000,5.0,1200,8.5
North,StoreB,98000,21000,8.0,950,7.9
South,StoreC,210000,58000,4.5,1850,9.1
South,StoreD,175000,42000,6.0,1500,8.8
East,StoreE,85000,18000,12.0,800,7.2
East,StoreF,92000,19500,10.0,890,7.5
West,StoreG,240000,65000,3.0,2100,9.4
West,StoreH,190000,49000,5.5,1650,8.9
North,StoreI,110000,26000,7.0,1050,8.2
South,StoreJ,195000,51000,4.0,1700,9.0
West,StoreK,260000,71000,2.5,2300,9.6
`;
    } else if (type === 'churn') {
      filename = 'customer_churn_analytics.csv';
      csvContent = `customer_id,contract_length_months,monthly_charges,total_charges,support_tickets,churned
CUST-101,12,65.5,786.0,2,0
CUST-102,2,89.0,178.0,6,1
CUST-103,24,45.0,1080.0,1,0
CUST-104,1,95.5,95.5,7,1
CUST-105,36,55.0,1980.0,0,0
CUST-106,6,75.0,450.0,4,1
CUST-107,18,80.0,1440.0,2,0
CUST-108,3,92.0,276.0,5,1
CUST-109,48,40.0,1920.0,1,0
CUST-110,12,70.0,840.0,3,0
`;
    } else {
      filename = 'employee_compensation.csv';
      csvContent = `employee_id,department,experience_years,salary,performance_rating,bonus
EMP-01,Engineering,6,135000,4.5,15000
EMP-02,Engineering,3,95000,4.0,8000
EMP-03,Engineering,10,165000,4.8,22000
EMP-04,Marketing,4,88000,3.8,6000
EMP-05,Marketing,7,112000,4.2,11000
EMP-06,Sales,5,102000,4.6,18000
EMP-07,Sales,2,72000,3.5,9000
EMP-08,Sales,8,138000,4.7,25000
EMP-09,Operations,5,82000,4.1,7000
EMP-10,Operations,9,115000,4.4,12000
`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], filename, { type: 'text/csv' });
    await handleFile(file);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UploadCloud size={20} color="var(--primary-accent)" />
        Upload Dataset
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Upload CSV, Excel, Parquet, or JSON tabular data to trigger multi-agent profiling.
      </p>

      <div
        className={`dropzone-container ${isDragging ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.parquet,.json,.jsonl"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <UploadCloud className="dropzone-icon" />
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          {isUploading ? 'Ingesting & Profiling Dataset...' : 'Click or Drag & Drop File Here'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          Supports CSV, XLSX, Parquet, JSON (Max 50MB)
        </div>
      </div>

      {errorMsg && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Load Sample Datasets */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Sparkles size={14} color="var(--secondary-accent)" />
          Quick Test Sample Datasets:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            disabled={isUploading}
            onClick={() => loadSampleDataset('sales')}
          >
            Sales Performance
          </button>
          <button
            className="btn-secondary"
            disabled={isUploading}
            onClick={() => loadSampleDataset('churn')}
          >
            Customer Churn
          </button>
          <button
            className="btn-secondary"
            disabled={isUploading}
            onClick={() => loadSampleDataset('salary')}
          >
            Employee Salaries
          </button>
        </div>
      </div>
    </div>
  );
};
