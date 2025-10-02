import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Image } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

// Map route name -> icon + label (adjust later as you add screens)
const TAB_CONFIG: Record<string, { icon: string; label: string; special?: boolean }> = {
  index: { icon: 'search', label: 'Explorează' },
  favorites: { icon: 'heart-outline', label: 'Favorite' },
  sell: { icon: 'pricetag', label: 'Vinde', special: true },
  chat: { icon: 'chatbubble-ellipses-outline', label: 'Chat' },
  account: { icon: 'person-circle-outline', label: 'Cont' },
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { tokens } = useAppTheme();
  const { isAuthenticated, loading, user } = useAuth();
  const activeColor = tokens.colors.primary;
  const inactiveColor = tokens.colors.muted;

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
      Animated.parallel([
        Animated.timing(indicatorLeft, { toValue: l.x, duration: 260, useNativeDriver: false }),
        Animated.timing(indicatorWidth, { toValue: l.width, duration: 260, useNativeDriver: false }),
      ]).start();
    }
  }, [state.index, layouts]);

  return (
    <View style={[styles.wrapper, { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.border }]}>      
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { icon: 'ellipse', label: route.name };
          const onPress = () => {
            // Dacă nu e autentificat și nu este tab-ul Explorează (index), redirecționează la login
            if (!loading && !isAuthenticated && route.name !== 'index') {
              navigation.navigate('login' as any);
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
                pressed && !config.special && { opacity: 0.6 },
              ]}
              onLayout={(e) => onLayoutTab(e, index)}
            >
              <View style={config.special ? [styles.publishWrapper] : undefined}>
                <View
                  style={config.special ? [
                    styles.publishCircle,
                    { backgroundColor: isFocused ? activeColor : activeColor, shadowColor: '#000' },
                  ] : undefined}
                >
                  {route.name === 'account' && user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: config.special ? 28 : 24, height: config.special ? 28 : 24, borderRadius: 999 }} />
                  ) : (
                    <Ionicons
                      name={config.icon as any}
                      size={config.special ? 22 : 23}
                      color={config.special ? tokens.colors.primaryContrast : isFocused ? activeColor : inactiveColor}
                    />
                  )}
                </View>
              </View>
              <Text style={[styles.label, { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '600' : '500' }]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* Active indicator line (simple implementation) */}
      <Animated.View style={[styles.indicator, { backgroundColor: activeColor, transform: [{ translateX: indicatorLeft }], width: indicatorWidth }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.select({ ios: 10, default: 6 }),
    paddingTop: 2,
    height: 65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  indicator: {
    position: 'absolute',
    height: 3,
    top: 0,
    left: 0,
    borderRadius: 0,
  },
  publishWrapper: {
    marginBottom: 2,
  },
  publishCircle: {
    width: 32,
    height: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
});

export default CustomTabBar;
