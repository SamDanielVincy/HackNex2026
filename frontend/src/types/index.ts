export interface ColumnProfile {
  name: string;
  data_type: string;
  missing_count: number;
  missing_percent: number;
  unique_count: number;
  sample_values: any[];
  min?: number | null;
  max?: number | null;
  mean?: number | null;
  std?: number | null;
  skewness?: number | null;
  outliers_count?: number;
}

export interface DatasetQualityWarning {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  column?: string | null;
  category: string;
  message: string;
  recommendation: string;
}

export interface DatasetProfile {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  memory_usage_kb: number;
  quality_score: number;
  duplicate_rows: number;
  columns: ColumnProfile[];
  warnings: DatasetQualityWarning[];
  data_summary: string;
  created_at: string;
}

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  message: string;
  profile: DatasetProfile;
}

export interface AgentProgressStep {
  step_id: number;
  agent_name: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
}

export interface StatisticalSummary {
  test_name?: string | null;
  statistic_value?: number | null;
  p_value?: number | null;
  is_significant?: boolean | null;
  effect_size?: number | null;
  details?: Record<string, any>;
}

export interface VerifiedFinding {
  finding_id: string;
  title: string;
  summary: string;
  detailed_explanation: string;
  key_metrics: Record<string, any>;
  chart_spec?: Record<string, any> | null;
  statistical_summary?: StatisticalSummary | null;
}

export interface ConfidenceBreakdown {
  sample_size_score: number;
  data_completeness_score: number;
  statistical_validity_score: number;
  distribution_normality_score: number;
  overall_confidence: number;
  confidence_level: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface AnalysisStartResponse {
  analysis_id: string;
  status: 'queued' | 'running';
  message: string;
  created_at: string;
}

export interface AnalysisStatus {
  analysis_id: string;
  dataset_id: string;
  question: string;
  status: 'queued' | 'running' | 'needs_clarification' | 'completed' | 'failed';
  progress_percent: number;
  current_agent: string;
  current_message: string;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
  clarification_question?: string | null;
  clarification_options?: string[] | null;
}

export interface AnalysisEvent {
  analysis_id: string;
  sequence: number;
  agent: string;
  status: 'waiting' | 'active' | 'completed' | 'warning' | 'failed';
  safe_message: string;
  progress: number;
  timestamp: string;
}

export interface AnalysisHistoryItem {
  analysis_id: string;
  dataset_id: string;
  dataset_name: string;
  question: string;
  analysis_type: string;
  quality_status: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  dataset_id: string;
  question: string;
  data_source: string;
  analysis_type: string;
  quality_status: 'HIGH_QUALITY' | 'VERIFIED_WITH_WARNINGS' | 'DEGRADED';
  confidence_score: number;
  confidence_breakdown: ConfidenceBreakdown;
  assumptions: string[];
  warnings: string[];
  executive_summary: string;
  findings: VerifiedFinding[];
  recommendations: string[];
  progress_steps: AgentProgressStep[];
  created_at: string;
}

export interface DashboardKPICard {
  title: string;
  value: string;
  subtitle?: string | null;
  status: 'positive' | 'negative' | 'neutral' | 'warning';
}

export interface DashboardChart {
  chart_id: string;
  title: string;
  description: string;
  spec: Record<string, any>;
}

export interface DashboardData {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  dashboard_title: string;
  executive_summary: string;
  kpis: DashboardKPICard[];
  charts: DashboardChart[];
  key_insights: string[];
  dataset_summary: {
    columns: Array<{ name: string; type: string; null_count: number }>;
    sample_rows: Array<Record<string, any>>;
  };
}

