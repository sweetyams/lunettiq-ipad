import { useEffect } from 'react';
import * as Network from 'expo-network';
import { useAppStore } from './store';

export function useNetworkStatus() {
  const { isOnline, setOnline } = useAppStore();

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setOnline(state.isConnected ?? false);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return isOnline;
}
