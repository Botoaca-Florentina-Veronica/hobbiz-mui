import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

type PushToken = { token?: string; error?: string };

export default function usePushNotifications() {
  const [pushToken, setPushToken] = useState<PushToken>({});
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => setPushToken({ token }))
      .catch(err => setPushToken({ error: String(err) }));

    // Listener when a notification is received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // handle foreground notification if needed
      // console.log('Notification received', notification);
    });

    // Listener when user interacts with a notification (tap, action)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // handle response (navigate, mark read, etc.)
      // console.log('Notification response', response);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { pushToken };
}

async function registerForPushNotificationsAsync(): Promise<string> {
  // Use expo-constants as a safe fallback so the hook works while developing in Expo Go
  const isDevice = (Constants as any)?.isDevice === undefined ? true : (Constants as any).isDevice;
  if (!isDevice) {
    throw new Error('Must use physical device for push notifications');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Failed to get push token for push notification!');
  }

  // Try to get native device push token first (available in EAS-built native apps).
  // If not available (Expo Go), fallback to Expo push token.
  try {
    const tokenData = await (Notifications as any).getDevicePushTokenAsync();
    const token = (tokenData as any).data || (tokenData as any).token || JSON.stringify(tokenData);
    if (token) return token;
  } catch (e) {
    // ignore and fallback
  }

  // Fallback: Expo push token (works in Expo Go)
  try {
    const expoTokenData = await (Notifications as any).getExpoPushTokenAsync();
    return (expoTokenData as any).data || (expoTokenData as any).expoPushToken || JSON.stringify(expoTokenData);
  } catch (e) {
    throw new Error('Failed to get any push token: ' + (e?.message || e));
  }
}
