import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { checkServerHealth, listUploadedDatasets } from '../api/client';
import { DatasetProfile } from '../types';

export const AppShell: React.FC = () => {
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [datasetsCount, setDatasetsCount] = useState<number>(0);

  useEffect(() => {
    const check = async () => {
      const isOnline = await checkServerHealth();
      setServerOnline(isOnline);
      if (isOnline) {
        try {
          const list = await listUploadedDatasets();
          setDatasetsCount(list.length);
        } catch (err) {
          // Silent fallback
        }
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <Header serverOnline={serverOnline} activeDatasetCount={datasetsCount} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />

        <main style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
