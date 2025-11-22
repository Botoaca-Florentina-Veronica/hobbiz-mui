import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ChatNotificationProvider } from '../src/context/ChatNotificationContext';
import { LocaleProvider } from '../src/context/LocaleContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  function AuthGate() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;
      // Determine if current route is the Explore (index) tab.
      // In expo-router the tabs layout is represented as '(tabs)' followed by the tab name (e.g. '(tabs)', 'index').
      const seg0 = segments[0] || '';
      const seg1 = segments[1] || '';

      const isExplore = (
        // direct root
        segments.length === 0 ||
        // top-level index
        seg0 === 'index' ||
        // tabs root or tabs index
        (seg0 === '(tabs)' && (seg1 === '' || seg1 === 'index'))
      );

      const isLogin = segments.includes('login');

      if (!isAuthenticated && !isExplore && !isLogin) {
        // Redirect unauthenticated users to login for any page except Explore
        router.replace('/login');
      }
    }, [isAuthenticated, loading, segments.join('/')]);

    return null;
  }

  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <ChatNotificationProvider>
            <SafeAreaProvider>
              <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGate />
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
