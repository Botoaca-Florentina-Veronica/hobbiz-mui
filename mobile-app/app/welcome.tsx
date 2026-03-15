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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '@/src/context/LocaleContext';
import { getWelcomeTranslations } from '../src/i18n/welcome';


// Logo configuration - easy to modify
const LOGO_CONFIG = {
  // Values chosen to lift the logo higher but keep it visible across device sizes
  small: { width: 320, height: 210, marginTop: -160, marginBottom: -10 },
  large: { width: 480, height: 280, marginTop: -140, marginBottom: 12 },
};


const BUTTONS_CONFIG = {
  gap: 2, 
  loginButton: {
    marginBottom: 5, // Space after login button
    marginTop: 2
  },
  guestButton: {
    marginBottom: 2, // Space after guest button
  },
  signupLink: {
    marginTop: 0, 
    marginBottom: 2,
  },
};

// Image configuration - easy to modify intro image height ratios
const IMAGE_CONFIG = {
  small: 0.55, // 55% of device height for small devices
  medium: 0.58, // 58% of device height for medium devices
  large: 0.6, // 60% of device height for large devices
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
  const t = getWelcomeTranslations(locale);

  const isSmallDevice = width < 600;
  const isMediumDevice = width >= 600 && width < 900;

  const responsiveSizes = {
    // Image height based on device type - configured in IMAGE_CONFIG
    imageHeight: isSmallDevice ? height * IMAGE_CONFIG.small : isMediumDevice ? height * IMAGE_CONFIG.medium : height * IMAGE_CONFIG.large,
    titleSize: isSmallDevice ? 32 : isMediumDevice ? 38 : 42,
    subtitleSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    buttonPadding: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    buttonFontSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    contentPadding: isSmallDevice ? 24 : isMediumDevice ? 32 : 40,
    linkFontSize: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
    buttonsMarginTop: height * (isSmallDevice ? 0.12 : isMediumDevice ? 0.17 : 0.20),
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

  // Calculate gradient height to be responsive
  const gradientHeight = Math.min(480, height * 0.45);

  // Logo and decorative texts removed per request


  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Image Section - Background (covers entire screen) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Image
          source={require('../assets/images/intro.png')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Bottom Gradient overlay (between image and content) */}
      <View style={[styles.bottomGradient, { height: gradientHeight }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />
      </View>









      {/* Content Section - Scrollable (overlay on image) */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsiveSizes.contentPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ minHeight: 1 }}>{false && (<>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: tokens.colors.primary,
                paddingVertical: responsiveSizes.buttonPadding,
                marginBottom: BUTTONS_CONFIG.loginButton.marginBottom,
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
                marginBottom: BUTTONS_CONFIG.guestButton.marginBottom,
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
          <View style={[styles.signupContainer, { marginBottom: insets.bottom + 8, marginTop: BUTTONS_CONFIG.signupLink.marginTop }]}>
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
        </>) }
        </View>
      </ScrollView>
      {/* Buttons anchored to bottom using safe area insets for consistent placement */}
      <View style={{
        position: 'absolute',
        left: responsiveSizes.contentPadding,
        right: responsiveSizes.contentPadding,
        bottom: insets.bottom + (isSmallDevice ? 16 : isMediumDevice ? 20 : 24),
        zIndex: 10,
        gap: BUTTONS_CONFIG.gap,
      }}>
        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            {
              backgroundColor: tokens.colors.primary,
              paddingVertical: responsiveSizes.buttonPadding,
              marginBottom: BUTTONS_CONFIG.loginButton.marginBottom,
            },
          ]}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.loginButtonText, { fontSize: responsiveSizes.buttonFontSize, color: '#FFFFFF' }]}>
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
              marginBottom: BUTTONS_CONFIG.guestButton.marginBottom,
            },
          ]}
          onPress={handleGuestMode}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.guestButtonText, { fontSize: responsiveSizes.buttonFontSize, color: tokens.colors.text }]}>
            {t.guestMode}
          </ThemedText>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={[styles.signupContainer, { marginBottom: insets.bottom + 8, marginTop: BUTTONS_CONFIG.signupLink.marginTop }]}> 
          <ThemedText style={[styles.signupText, { fontSize: responsiveSizes.linkFontSize, color: tokens.colors.muted }]}>
            {t.noAccount}{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleSignup} activeOpacity={0.7}>
            <ThemedText style={[styles.signupLink, { fontSize: responsiveSizes.linkFontSize, color: tokens.colors.primary }]}>
              {t.signup}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
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
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
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
