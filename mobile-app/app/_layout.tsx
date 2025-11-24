import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ChatNotificationProvider } from '../src/context/ChatNotificationContext';
import { LocaleProvider } from '../src/context/LocaleContext';
import { setupNotificationListeners } from '../src/services/notificationService';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Notification received in foreground
      },
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.link) {
          try {
            // link format: /chat/:conversationId/:messageId
            const parts = data.link.split('/');
            // parts[0] is empty, parts[1] is 'chat', parts[2] is conversationId, parts[3] is messageId
            if (parts[1] === 'chat' && parts[2]) {
               router.push({
                  pathname: '/(tabs)/chat',
                  params: { conversationId: parts[2], messageId: parts[3] }
               });
            } else if (parts[1] === 'users' && parts[3] === 'reviews') {
               // /users/:id/reviews
               router.push({
                  pathname: '/all-reviews',
                  params: { userId: parts[2] }
               });
            } else if (parts[1] === 'announcements' && parts[2]) {
               // /announcements/:id
               router.push({
                  pathname: '/announcement-details',
                  params: { id: parts[2] }
               });
            }
          } catch (e) {
            console.error('Error handling notification link:', e);
          }
        }
      }
    );
    return cleanup;
  }, []);

  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <ChatNotificationProvider>
            <SafeAreaProvider>
              <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="legal" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="my-announcements" options={{ headerShown: false }} />
                <Stack.Screen name="edit-announcement" options={{ headerShown: false }} />
                <Stack.Screen name="post-success" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </NavThemeProvider>
          </SafeAreaProvider>
        </ChatNotificationProvider>
      </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
