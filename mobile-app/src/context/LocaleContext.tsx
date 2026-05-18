import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import storage from '../services/storage';

type Locale = 'ro' | 'en' | 'es';

interface LocaleContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => Promise<void>;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ro');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storage.getItemAsync('locale');
        if (!mounted) return;
        if (stored === 'en' || stored === 'ro' || stored === 'es') {
          setLocaleState(stored);
        }
      } catch (e) {
        console.warn('Failed to load locale', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    try {
      await storage.setItemAsync('locale', newLocale);
      setLocaleState(newLocale);
    } catch (e) {
      console.warn('Failed to save locale', e);
    }
  }, []);

  const value = useMemo<LocaleContextType>(() => ({ locale, setLocale, isLoading }), [locale, setLocale, isLoading]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
