import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../themed-text';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTabBar } from '../../src/context/TabBarContext';
import { useChatNotifications } from '../../src/context/ChatNotificationContext';
import storage from '../../src/services/storage';
import { useLocale } from '../../src/context/LocaleContext';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { normalizeLocale } from '../../src/i18n';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

// Static icon config; labels will be provided via translations below
const TAB_CONFIG: Record<string, { icon: string; label?: string; special?: boolean }> = {
  index: { icon: 'search' },
  favorites: { icon: 'heart-outline' },
  sell: { icon: 'pricetag', special: true },
  chat: { icon: 'chatbubble-ellipses-outline' },
  account: { icon: 'person-circle-outline' },
};

const TAB_LABELS: Record<string, { ro: string; en: string; es: string }> = {
  index: { ro: 'Explorează', en: 'Explore', es: 'Explorar' },
  favorites: { ro: 'Favorite', en: 'Favorites', es: 'Favoritos' },
  sell: { ro: 'Vinde', en: 'Sell', es: 'Vender' },
  chat: { ro: 'Chat', en: 'Chat', es: 'Chat' },
  account: { ro: 'Cont', en: 'Account', es: 'Cuenta' },
};

const TAB_BAR_HEIGHT = 70;
const INDICATOR_HEIGHT = 62;
const INDICATOR_TOP = (TAB_BAR_HEIGHT - INDICATOR_HEIGHT) / 2;
const INDICATOR_REGULAR_WIDTH = 80;
const INDICATOR_SPECIAL_WIDTH = 74;

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { tokens, isDark } = useAppTheme();
  const webBox = (tokens as any)?.shadow?.elev2?.boxShadow;
  const { isAuthenticated, isGuest, loading, user } = useAuth();
  const { hidden } = useTabBar();
  const { unreadCount } = useChatNotifications();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const tabLocale = normalizeLocale(locale);
  const router = useRouter();
  // For uniformity between Expo Web and Expo Go, render the same tab bar style path.
  // This avoids diverging native glass look and keeps consistency with web appearance.
  const canUseNativeLiquid = false;
  
  // Helper to normalize image URLs for web compatibility
  const getImageSrc = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    return `${base}/uploads/${img}`;
  };
  
  // In guest mode, only show the 'index' (explore) tab
  const allowedTabsInGuest = ['index'];
  
  // Accent adapts to theme: dark uses brand pink, light keeps existing blue tone
  const activeColor = isDark ? tokens.colors.primary : '#1a2d47';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.86)' : '#1e293b';
  const isNative = Platform.OS !== 'web';
  // Keep mobile tab bar glass aligned with web header blur palette.
  const glassBaseColor = isDark ? 'rgba(18,18,18,0.34)' : 'rgba(38,62,98,0.14)';
  const glassEdgeColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(44,68,102,0.08)';
  const nativeTint = isDark ? 'rgba(12,12,16,0.08)' : 'rgba(42,68,106,0.06)';
  const webBackdropFilter = isDark ? 'blur(10px) saturate(125%)' : 'blur(8px) saturate(120%)';
  const darkBaseColor = isNative ? 'rgba(18,18,18,0.16)' : glassBaseColor;
  const darkOverlayColor = isNative ? 'rgba(24,24,24,0.10)' : 'rgba(18,18,18,0.20)';
  const darkGradientColors = isNative
    ? (['rgba(24,24,24,0.12)', 'rgba(24,24,24,0.06)'] as const)
    : (['rgba(18,18,18,0.22)', 'rgba(18,18,18,0.14)'] as const);
  const lightBaseColor = isNative ? 'rgba(38,62,98,0.02)' : glassBaseColor;
  const lightOverlayColor = isNative ? 'rgba(42,72,110,0.03)' : 'rgba(46,74,112,0.11)';
  const lightGradientColors = isNative
    ? (['rgba(40,66,102,0.02)', 'rgba(40,66,102,0.005)'] as const)
    : (['rgba(44,70,106,0.06)', 'rgba(44,70,106,0.02)'] as const);

  // Indicator bazat pe măsurători reale
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([]);
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const onLayoutTab = (event: any, index: number) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts(prev => {
      const clone = [...prev];
      clone[index] = { x, width };
      return clone;
    });
  };

  useEffect(() => {
    const l = layouts[state.index];
    if (l) {
      const focusedRoute = state.routes[state.index];
      const focusedConfig = TAB_CONFIG[focusedRoute.name] || { icon: 'ellipse' };
      const targetWidth = focusedConfig.special ? INDICATOR_SPECIAL_WIDTH : INDICATOR_REGULAR_WIDTH;
      const targetLeft = l.x + (l.width - targetWidth) / 2;
      Animated.parallel([
        Animated.spring(indicatorLeft, { 
          toValue: targetLeft, 
          useNativeDriver: false,
          friction: 9,
          tension: 60 
        }),
        Animated.spring(indicatorWidth, { 
          toValue: targetWidth,
          useNativeDriver: false,
          friction: 9, 
          tension: 60
        }),
      ]).start();
    }
  }, [state.index, layouts, state.routes]);

  // Floating tab bar constants
  // Use a fixed height for the floating bar
  const BAR_HEIGHT = 64;
  // Margin from bottom of screen (safe area + spacing)
  const bottomMargin = Math.max(insets.bottom, 20);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteCount(0);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await api.get('/api/favorites');
        if (isMounted) {
          const count = Array.isArray(res.data?.favorites) ? res.data.favorites.length : 0;
          setFavoriteCount(count);
        }
      } catch (e) {
        // ignore errors; badge stays 0
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  if (hidden) return null;

  const tabItems = (
    <View style={styles.contentRow}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const base = TAB_CONFIG[route.name] || { icon: 'ellipse' };
        const config = { ...base, label: (TAB_LABELS as any)[route.name]?.[tabLocale] ?? route.name } as any;

        const onPress = () => {
          if (!loading && !isAuthenticated && route.name !== 'index') {
            try {
              router.replace('/login');
            } catch (e) {
              (navigation as any).replace('login');
            }
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tab,
              pressed && !config.special && { opacity: 0.7 },
            ]}
            onLayout={(e) => onLayoutTab(e, index)}
          >
            <View style={config.special ? [styles.specialButtonWrapper] : undefined}>
              <View
                style={config.special ? [
                  styles.specialButton,
                  { backgroundColor: activeColor },
                  (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : undefined,
                ] : undefined}
              >
                {route.name === 'account' && user?.avatar ? (
                  <Image source={{ uri: getImageSrc(user.avatar) || undefined }} style={{ width: config.special ? 28 : 24, height: config.special ? 28 : 24, borderRadius: 999 }} />
                ) : (
                  <Ionicons
                    name={isFocused ? (config.icon as any) : (`${config.icon}` as any)}
                    size={config.special ? 26 : 24}
                    color={config.special ? tokens.colors.primaryContrast : isFocused ? activeColor : inactiveColor}
                    style={[
                      styles.tabIcon,
                      !isDark && styles.tabIconLightOutline,
                    ]}
                  />
                )}
              </View>
              {route.name === 'chat' && unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: tokens.colors.primary }]}>
                  <ThemedText style={[styles.badgeText, { color: tokens.colors.primaryContrast }]}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </ThemedText>
                </View>
              )}
              {route.name === 'favorites' && favoriteCount > 0 && (
                <View style={[styles.badge, { backgroundColor: tokens.colors.primary }]}>
                  <ThemedText style={[styles.badgeText, { color: tokens.colors.primaryContrast }]}>
                    {favoriteCount > 99 ? '99+' : favoriteCount}
                  </ThemedText>
                </View>
              )}
            </View>
            {!config.special && (
              <ThemedText
                style={[
                  styles.label,
                  { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '600' : '500' },
                  isFocused ? { opacity: 1 } : { opacity: 0.8 },
                ]}
              >
                {config.label}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.absoluteContainer}>
      {canUseNativeLiquid ? (
        <GlassContainer style={[styles.nativeContainer, { bottom: bottomMargin }]} spacing={12}>
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            colorScheme={isDark ? 'dark' : 'light'}
            tintColor={nativeTint}
            style={[styles.floatingWrapper, { shadowColor: isDark ? '#000' : '#889', borderColor: glassEdgeColor }]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.nativeBubbleWrap,
                {
                  transform: [{ translateX: indicatorLeft }],
                  width: indicatorWidth,
                },
              ]}
            >
              <GlassView
                glassEffectStyle="clear"
                colorScheme={isDark ? 'dark' : 'light'}
                tintColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)'}
                style={styles.nativeBubbleInner}
              />
            </Animated.View>
            {tabItems}
          </GlassView>
        </GlassContainer>
      ) : (
      <View
        style={[
          styles.floatingWrapper,
          {
            bottom: bottomMargin,
            shadowColor: isDark ? '#000' : '#889',
            backgroundColor: isDark ? darkBaseColor : lightBaseColor,
            borderColor: glassEdgeColor,
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: webBackdropFilter,
                WebkitBackdropFilter: webBackdropFilter,
              } as any)
            : undefined,
        ]}
      >
        {/* Native platforms use real blur from expo-blur to match the web glass style. */}
        {Platform.OS !== 'web' && (
          <BlurView
            intensity={isDark ? 55 : 58}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        )}

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? darkOverlayColor : lightOverlayColor },
          ]}
        />
        
        {/* Subtle Gradient Overlay for "Liquid" / "Glass" shine */}
        <LinearGradient
          colors={isDark ? darkGradientColors : lightGradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Animated "Bubble" Indicator */}
        <Animated.View 
          style={[
            styles.indicatorBubble, 
            { 
              transform: [{ translateX: indicatorLeft }], 
              width: indicatorWidth,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.30)',
            }
          ]} 
        />

        {tabItems}
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through empty areas
  },
  nativeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingWrapper: {
    width: '90%', // Floating width
    maxWidth: 400,
    height: 70,
    borderRadius: 35, // Pill shape
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  nativeBubbleWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -(INDICATOR_HEIGHT / 2),
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    overflow: 'hidden',
  },
  nativeBubbleInner: {
    flex: 1,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-Regular',
  },
  specialButtonWrapper: {
    marginBottom: 0,
  },
  specialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  tabIcon: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  tabIconLightOutline: {
    textShadowColor: 'rgba(255,255,255,0.95)',
  },
  indicatorBubble: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    top: '50%',
    marginTop: -(INDICATOR_HEIGHT / 2),
    borderRadius: INDICATOR_HEIGHT / 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    lineHeight: 11,
  },
});

export default CustomTabBar;

