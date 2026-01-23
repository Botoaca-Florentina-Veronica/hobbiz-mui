import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';

interface GuestModeRestrictionProps {
  children: React.ReactNode;
  allowedRoutes?: string[]; // Routes allowed in guest mode
}

const TRANSLATIONS = {
  ro: {
    guestLimitedTitle: 'Acces limitat pentru vizitatori',
    guestLimitedMessage: 'Pentru a accesa această funcționalitate, trebuie să te conectezi sau să îți creezi un cont.',
    login: 'Conectează-te',
    signup: 'Creează cont',
    backToExplore: 'Înapoi la Explorează',
  },
  en: {
    guestLimitedTitle: 'Limited access for guests',
    guestLimitedMessage: 'To access this feature, you need to log in or create an account.',
    login: 'Log in',
    signup: 'Sign up',
    backToExplore: 'Back to Explore',
  },
};

/**
 * Component that restricts access for guest users to only allowed routes.
 * Shows a restriction message for disallowed routes.
 */
export function GuestModeRestriction({ children, allowedRoutes = ['index'] }: GuestModeRestrictionProps) {
  const { isGuest, isAuthenticated, user, token } = useAuth();
  const { tokens } = useAppTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const t = TRANSLATIONS[locale];

  // If user is authenticated (has token and user data), allow full access
  // This check is more explicit to prevent false negatives
  if (isAuthenticated || (user && token && !isGuest)) {
    return <>{children}</>;
  }

  // If user is guest (or not authenticated), check if current route is allowed
  if (isGuest || !isAuthenticated) {
    // For now, we'll allow the index route (explore page) and block others
    // You can extend this logic based on current route detection
    const currentRoute = 'index'; // This should be dynamically determined
    
    if (allowedRoutes.includes(currentRoute)) {
      return <>{children}</>;
    }

    // Show restriction message for disallowed routes
    return (
      <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
        <View style={[styles.content, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <Ionicons name="lock-closed-outline" size={48} color={tokens.colors.primary} style={styles.icon} />
          
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>
            {t.guestLimitedTitle}
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: tokens.colors.muted }]}>
            {t.guestLimitedMessage}
          </ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tokens.colors.primary }]}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                {t.login}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: tokens.colors.border }]}
              onPress={() => router.push('/signup')}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.secondaryButtonText, { color: tokens.colors.text }]}>
                {t.signup}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.linkButtonText, { color: tokens.colors.primary }]}>
                {t.backToExplore}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
  }

  // If neither authenticated nor guest (shouldn't happen), show children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});