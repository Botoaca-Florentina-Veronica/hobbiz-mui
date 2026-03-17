import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import { TabBarProvider } from '@/src/context/TabBarContext';
import storage from '@/src/services/storage';
import { useLocale } from '@/src/context/LocaleContext';
import { normalizeLocale } from '@/src/i18n';

const TAB_TITLES: Record<string, { ro: string; en: string; es: string }> = {
  index: { ro: 'Explorează', en: 'Explore', es: 'Explorar' },
  favorites: { ro: 'Favorite', en: 'Favorites', es: 'Favoritos' },
  sell: { ro: 'Vinde', en: 'Sell', es: 'Vender' },
  chat: { ro: 'Chat', en: 'Chat', es: 'Chat' },
  account: { ro: 'Cont', en: 'Account', es: 'Cuenta' },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { locale } = useLocale();
  const tabLocale = normalizeLocale(locale);

  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      <Tabs.Screen name="index" options={{ title: TAB_TITLES.index[tabLocale] }} />
      <Tabs.Screen name="favorites" options={{ title: TAB_TITLES.favorites[tabLocale] }} />
      <Tabs.Screen name="sell" options={{ title: TAB_TITLES.sell[tabLocale] }} />
      <Tabs.Screen name="chat" options={{ title: TAB_TITLES.chat[tabLocale] }} />
      <Tabs.Screen name="account" options={{ title: TAB_TITLES.account[tabLocale] }} />
      </Tabs>
    </TabBarProvider>
  );
}