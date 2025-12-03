import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { TransitionPresets } from '@react-navigation/stack';

import { JsStack } from '../components/JsStack';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ChatNotificationProvider } from '../src/context/ChatNotificationContext';
import { NotificationProvider } from '../src/context/NotificationContext';
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
               const params: any = { conversationId: parts[2] };
               if (parts[3]) params.messageId = parts[3];
               // Pass additional metadata if available
               if (data.senderName) params.senderName = data.senderName;
               if (data.senderAvatar) params.senderAvatar = data.senderAvatar;
               if (data.announcementOwnerId) params.announcementOwnerId = data.announcementOwnerId;
               if (data.announcementId) params.announcementId = data.announcementId;
               if (data.announcementTitle) params.announcementTitle = data.announcementTitle;
               if (data.announcementImage) params.announcementImage = data.announcementImage;
               router.push({
                  pathname: '/conversation',
                  params
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
          <NotificationProvider>
            <ChatNotificationProvider>
              <SafeAreaProvider>
                <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <JsStack
                  screenOptions={{
                    ...TransitionPresets.SlideFromRightIOS,
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    cardStyle: {
                      backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                    },
                  }}
                >
                <JsStack.Screen name="(tabs)" options={{ headerShown: false }} />
                <JsStack.Screen name="login" options={{ headerShown: false }} />
                <JsStack.Screen name="oauth" options={{ headerShown: false }} />
                <JsStack.Screen name="settings" options={{ headerShown: false }} />
                <JsStack.Screen name="notification-settings" options={{ headerShown: false }} />
                <JsStack.Screen name="about" options={{ headerShown: false }} />
                <JsStack.Screen name="legal" options={{ headerShown: false }} />
                <JsStack.Screen name="notifications" options={{ headerShown: false }} />
                <JsStack.Screen name="conversation" options={{ headerShown: false }} />
                <JsStack.Screen name="profile" options={{ headerShown: false }} />
                <JsStack.Screen name="my-announcements" options={{ headerShown: false }} />
                <JsStack.Screen name="edit-announcement" options={{ headerShown: false }} />
                <JsStack.Screen name="post-success" options={{ headerShown: false }} />
                <JsStack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </JsStack>
                <StatusBar style="auto" />
              </NavThemeProvider>
            </SafeAreaProvider>
          </ChatNotificationProvider>
        </NotificationProvider>
      </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}