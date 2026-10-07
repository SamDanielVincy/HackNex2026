import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DatasetProfilePage } from './pages/DatasetProfilePage';
import { AskAnalystPage } from './pages/AskAnalystPage';
import { AnalysisProgressPage } from './pages/AnalysisProgressPage';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { HistoryPage } from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="datasets/:datasetId" element={<DatasetProfilePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/:datasetId" element={<DashboardPage />} />
          <Route path="ask" element={<AskAnalystPage />} />
          <Route path="analysis/:analysisId/progress" element={<AnalysisProgressPage />} />
          <Route path="analysis/:analysisId/result" element={<AnalysisResultPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="*" element={<OverviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

