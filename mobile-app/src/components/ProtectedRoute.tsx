import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Component that protects routes requiring authentication.
 * Redirects to /login if user is not authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isGuest, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    
    if (!isAuthenticated && !isGuest && inAuthGroup) {
      // User is not authenticated and not in guest mode but trying to access protected route
      router.replace('/welcome');
    }
  }, [isAuthenticated, isGuest, loading, segments, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not authenticated and not guest, show nothing (will redirect)
  if (!isAuthenticated && !isGuest) {
    return null;
  }

  return <>{children}</>;
}
