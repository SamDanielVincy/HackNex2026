import {
  DatasetProfile,
  DatasetUploadResponse,
  AnalysisStartResponse,
  AnalysisStatus,
  AnalysisResponse,
  AnalysisEvent,
  AnalysisHistoryItem,
  DashboardData
} from '../types';

const API_BASE = '/api';

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/');
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function uploadDatasetFile(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function listUploadedDatasets(): Promise<DatasetProfile[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) {
    throw new Error('Failed to fetch dataset list');
  }
  return res.json();
}

export async function fetchDatasetProfile(datasetId: string): Promise<DatasetProfile> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch profile for dataset ${datasetId}`);
  }
  return res.json();
}

export async function fetchDatasetDashboard(datasetId: string): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/dashboard`);
  if (!res.ok) {
    throw new Error(`Failed to fetch executive dashboard for dataset ${datasetId}`);
  }
  return res.json();
}

export async function startAnalysisJob(datasetId: string, question: string, mode: string = 'Quick Insight'): Promise<AnalysisStartResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      question: question,
      analysis_mode: mode,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Analysis failed to queue' }));
    throw new Error(errData.detail || `Analysis start error: ${res.status}`);
  }

  return res.json();
}

export async function fetchAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
  const res = await fetch(`${API_BASE}/analyze/${analysisId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch status for analysis ${analysisId}`);
  }
  return res.json();
}

export async function fetchAnalysisResult(analysisId: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze/${analysisId}/result`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Result not ready' }));
    throw new Error(errData.detail || `Result fetch error: ${res.status}`);
  }
  return res.json();
}

export async function fetchAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const res = await fetch(`${API_BASE}/analyze/history`);
  if (!res.ok) {
    throw new Error('Failed to fetch analysis history');
  }
  return res.json();
}

export function subscribeToAnalysisEvents(
  analysisId: string,
  onEvent: (event: AnalysisEvent) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/analyze/${analysisId}/events`);

  eventSource.onmessage = (e) => {
    try {
      const parsed: AnalysisEvent = JSON.parse(e.data);
      onEvent(parsed);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    eventSource.close();
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

