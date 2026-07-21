import { useMutation } from '@tanstack/react-query';
import { api } from './client';

interface PushRegistrationPayload {
  token: string;
  platform: 'ios';
  deviceName: string;
}

export function useRegisterPush() {
  return useMutation({
    mutationFn: (payload: PushRegistrationPayload) =>
      api.post('/api/admin/push/register', payload),
  });
}

export function useDeregisterPush() {
  return useMutation({
    mutationFn: () => api.delete('/api/admin/push/register'),
  });
}