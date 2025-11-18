import React, { useEffect } from 'react';
import { View } from 'react-native';
import api from '../services/api';
import usePushNotifications from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';

// Small invisible component that registers device push token with backend
export default function PushManager() {
  const { pushToken } = usePushNotifications();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!pushToken?.token || !isAuthenticated) return;
    // Send token to backend
    (async () => {
      try {
        await api.post('/api/users/push-token', { token: pushToken.token });
      } catch (e) {
        // ignore errors; registration is best-effort
        // eslint-disable-next-line no-console
        console.warn('[PushManager] failed to register token', e?.message || e);
      }
    })();
  }, [pushToken, isAuthenticated]);

  return <View style={{ display: 'none' }} />;
}
