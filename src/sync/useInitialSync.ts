import { useState } from 'react';
import { api } from '@/src/api/client';

export interface InitialSyncState {
  progress: number;
  status: 'idle' | 'syncing' | 'complete' | 'error';
  message: string;
}

export function useInitialSync() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<InitialSyncState['status']>('idle');
  const [message, setMessage] = useState('');

  const startSync = async (): Promise<void> => {
    setStatus('syncing');
    setProgress(0);
    
    try {
      setMessage('Downloading products...');
      setProgress(10);
      
      // Download full product catalogue
      await api.get('/api/storefront/products', { 
        params: { limit: '500' } 
      });
      setProgress(40);
      
      setMessage('Downloading appointments...');
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0] ?? '';
      await api.get('/api/scheduling', { 
        params: { date: today } 
      });
      setProgress(70);
      
      setMessage('Downloading settings...');
      
      // Get location settings and configuration
      await api.get('/api/storefront/settings');
      setProgress(90);
      
      setMessage('Almost ready...');
      setProgress(100);
      
      // Brief pause for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus('complete');
      
    } catch (error) {
      console.error('Initial sync failed:', error);
      setStatus('error');
      setMessage('Sync failed. Check connection and try again.');
    }
  };

  const reset = (): void => {
    setProgress(0);
    setStatus('idle');
    setMessage('');
  };

  return { 
    progress, 
    status, 
    message, 
    startSync,
    reset
  };
}