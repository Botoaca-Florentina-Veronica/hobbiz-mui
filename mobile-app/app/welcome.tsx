import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '@/src/context/LocaleContext';

const TRANSLATIONS = {
  ro: {
    login: 'Conectează-te',
    signup: 'Înregistrează-te',
    noAccount: 'Nu ai cont?',
    welcome: 'Bine ai venit',
    subtitle: 'Transformă-ți hobby-urile în oportunități de câștig',
    guestMode: 'Navighează ca vizitator',
  },
  en: {
    login: 'Log in',
    signup: 'Sign up',
    noAccount: "Don't have an account?",
    welcome: 'Welcome',
    subtitle: 'Turn your hobbies into earning opportunities',
    guestMode: 'Browse as guest',
  },
};

export const options = {
  headerShown: false,
};

export default function WelcomeScreen() {
  const { tokens, isDark } = useAppTheme();
  const { setGuestMode } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale];

  const isSmallDevice = width < 600;
  const isMediumDevice = width >= 600 && width < 900;

  const responsiveSizes = {
    // Reduced heights to avoid cropping image edges
    imageHeight: isSmallDevice ? height * 0.55 : isMediumDevice ? height * 0.58 : height * 0.6,
    titleSize: isSmallDevice ? 32 : isMediumDevice ? 38 : 42,
    subtitleSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    buttonPadding: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    buttonFontSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    contentPadding: isSmallDevice ? 24 : isMediumDevice ? 32 : 40,
    linkFontSize: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  const handleGuestMode = () => {
    // Enable guest mode and navigate to tabs
    setGuestMode(true);
    router.push('/(tabs)');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Image Section - Fixed at top (covers into status bar) */}
      <View
        style={[
          styles.imageContainer,
          {
            height: responsiveSizes.imageHeight + insets.top,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <Image
          source={require('../assets/images/intro-image.png')}
          style={[styles.image, { marginTop: -insets.top }]}
          resizeMode="cover"
        />
      </View>

      {/* Content Section - Scrollable (offset below image) */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { marginTop: responsiveSizes.imageHeight + insets.top }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { padding: responsiveSizes.contentPadding }]}>
          {/* HOBBIZ Logo */}
          <View style={[styles.logoWrapper, { marginTop: isSmallDevice ? -200 : -300, marginBottom: isSmallDevice ? 12 : 18 }]}>
            <Image
              source={isDark ? require('../assets/images/logo-dark-mode.png') : require('../assets/images/logo.jpg')}
              style={[styles.logo, { width: isSmallDevice ? 1240 : 2360, height: isSmallDevice ? 300 : 480 }]}
              resizeMode="contain"
              accessibilityLabel="Hobbiz logo"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: tokens.colors.primary,
                paddingVertical: responsiveSizes.buttonPadding,
              },
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.loginButtonText,
                {
                  fontSize: responsiveSizes.buttonFontSize,
                  color: '#FFFFFF',
                },
              ]}
            >
              {t.login}
            </ThemedText>
          </TouchableOpacity>

          {/* Guest Mode Button */}
          <TouchableOpacity
            style={[
              styles.guestButton,
              {
                borderColor: tokens.colors.border,
                paddingVertical: responsiveSizes.buttonPadding,
              },
            ]}
            onPress={handleGuestMode}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.guestButtonText,
                {
                  fontSize: responsiveSizes.buttonFontSize,
                  color: tokens.colors.text,
                },
              ]}
            >
              {t.guestMode}
            </ThemedText>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <ThemedText
              style={[
                styles.signupText,
                {
                  fontSize: responsiveSizes.linkFontSize,
                  color: tokens.colors.muted,
                },
              ]}
            >
              {t.noAccount}{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleSignup} activeOpacity={0.7}>
              <ThemedText
                style={[
                  styles.signupLink,
                  {
                    fontSize: responsiveSizes.linkFontSize,
                    color: tokens.colors.primary,
                  },
                ]}
              >
                {t.signup}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    justifyContent: 'center',
    gap: 24,
  },
  loginButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  guestButton: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontWeight: '400',
  },
  signupLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    // width/height are set responsively inline
    marginBottom: 4,
  },
});
