import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import { TabBarProvider } from '@/src/context/TabBarContext';
import storage from '@/src/services/storage';

const TAB_TITLES: Record<string, { ro: string; en: string }> = {
  index: { ro: 'Explorează', en: 'Explore' },
  favorites: { ro: 'Favorite', en: 'Favorites' },
  sell: { ro: 'Vinde', en: 'Sell' },
  chat: { ro: 'Chat', en: 'Chat' },
  account: { ro: 'Cont', en: 'Account' },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [locale, setLocale] = useState<string>('ro');

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.getItemAsync('locale');
        setLocale(s === 'en' ? 'en' : 'ro');
      } catch (e) {
        setLocale('ro');
      }
    })();
  }, []);

  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      <Tabs.Screen name="index" options={{ title: TAB_TITLES.index[locale] }} />
      <Tabs.Screen name="favorites" options={{ title: TAB_TITLES.favorites[locale] }} />
      <Tabs.Screen name="sell" options={{ title: TAB_TITLES.sell[locale] }} />
      <Tabs.Screen name="chat" options={{ title: TAB_TITLES.chat[locale] }} />
      <Tabs.Screen name="account" options={{ title: TAB_TITLES.account[locale] }} />
      </Tabs>
    </TabBarProvider>
  );
}
