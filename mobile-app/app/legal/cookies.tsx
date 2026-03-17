import React, { useRef, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, findNodeHandle, UIManager, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import storage from '@/src/services/storage';
import { useLocale } from '@/src/context/LocaleContext';
import { getLegalCookiesTranslations } from '@/src/i18n/legal-cookies';

export default function CookiesScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale } = useLocale();
  const scrollRef = useRef<any>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const t = getLegalCookiesTranslations(locale);

  const secCeRef = useRef<View | null>(null);
  const secTipuriRef = useRef<View | null>(null);
  const secDeCeRef = useRef<View | null>(null);
  const secGestionareRef = useRef<View | null>(null);
  const secTertiRef = useRef<View | null>(null);
  const secConsimRef = useRef<View | null>(null);
  const secUpdatesRef = useRef<View | null>(null);
  const secContactRef = useRef<View | null>(null);

  const scrollToSection = (ref: React.RefObject<View | null>) => {
    if (!ref.current || !scrollRef.current) return;

    // Web: avoid calling findNodeHandle (not supported). Use DOM scrollIntoView when available.
    if (Platform.OS === 'web') {
      try {
        // Some RNW components expose the underlying DOM node via getNode()
        const possibleNode: any = (ref.current as any)?.getNode ? (ref.current as any).getNode() : (ref.current as any);
        if (possibleNode && typeof possibleNode.scrollIntoView === 'function') {
          possibleNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        // Fallback: try scrolling the container element
        const container: any = (scrollRef.current as any)?.getNode ? (scrollRef.current as any).getNode() : (scrollRef.current as any);
        if (container && typeof container.scrollTo === 'function' && possibleNode && possibleNode.offsetTop != null) {
          container.scrollTo({ top: Math.max(0, possibleNode.offsetTop - 12), behavior: 'smooth' });
          return;
        }
      } catch (e) {
        // ignore and fall back to native approach below if any
      }
      return;
    }

    // Native (iOS/Android): use findNodeHandle + UIManager.measureLayout to compute Y offset and animate.
    const node = findNodeHandle(ref.current);
    const scrollNode = findNodeHandle(scrollRef.current as any);
    if (!node || !scrollNode) return;
    try {
      UIManager.measureLayout(
        node,
        scrollNode,
        () => {},
        (_x, y, _w, _h) => {
          // Animate the scroll position using Animated.Value to control duration/easing
          Animated.timing(scrollAnim, {
            toValue: Math.max(0, y - 12),
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      );
    } catch (e) {
      // ignore
    }
  };

  // Keep the Animated value driving the actual ScrollView position.
  useEffect(() => {
    const id = scrollAnim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ y: value, animated: false });
    });
    return () => {
      scrollAnim.removeListener(id);
    };
  }, [scrollAnim]);

  function CookieTag({ children }: { children: React.ReactNode }) {
    return (
      <LinearGradient colors={["#f51866", "#fa4875"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cookieTag}>
        <ThemedText style={styles.cookieTagText}>{children}</ThemedText>
      </LinearGradient>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>      
  <Animated.ScrollView ref={scrollRef} style={Platform.OS === 'web' ? ({ height: '100vh' } as any) : { flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{t.title}</ThemedText>
        </View>

        {/* Hero */}
        {isDark ? (
          <View style={[styles.hero, { backgroundColor: '#282828', shadowColor: '#000', shadowOpacity: 0.35 }]}> 
            <View
              style={[
                styles.heroBefore,
                { backgroundColor: 'rgba(245,24,102,0.18)' },
                Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
              ]}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
            />
            <View style={styles.heroBadgeWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245,24,102,0.15)', borderColor: 'rgba(245,24,102,0.3)' }]}>
                <ThemedText style={styles.badgeEmoji}>🍪</ThemedText>
                <ThemedText style={[styles.heroBadgeText, { color: '#ffffff' }]}>{t.heroBadge}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>{t.heroTitle} <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>{t.heroHighlight}</ThemedText></ThemedText>
          </View>
        ) : (
          <LinearGradient
            colors={["#ffabb7", "#ff96a6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View
              style={[styles.heroBefore, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
            />
            <View style={styles.heroBadgeWrap}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245,24,102,0.08)', borderColor: 'rgba(245,24,102,0.25)' }]}>
                <ThemedText style={styles.badgeEmoji}>🍪</ThemedText>
                <ThemedText style={[styles.heroBadgeText, { color: '#121212' }]}>{t.heroBadge}</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.heroTitle, { color: '#121212' }]}>{t.heroTitle} <ThemedText style={[styles.highlight, { color: '#fa4875' }]}>{t.heroHighlight}</ThemedText></ThemedText>
          </LinearGradient>
        )}

        {/* Content */}
        {/* Table of Contents */}
  <View style={[styles.cookieToc, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={styles.tocTitle}>{t.tocTitle}</ThemedText>
          <View style={styles.tocList}>
            <TouchableOpacity onPress={() => scrollToSection(secCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[0]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTipuriRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[1]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secDeCeRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[2]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secGestionareRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[3]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secTertiRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[4]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secConsimRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[5]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secUpdatesRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[6]}</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(secContactRef)} activeOpacity={0.7}><ThemedText style={styles.tocItem}>• {t.tocItems[7]}</ThemedText></TouchableOpacity>
          </View>
        </View>

  <View ref={secCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: isDark ? '#ffffff' : tokens.colors.text }]}>{t.sec1Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>{t.sec1P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#d6d6d6' : '#575757' }]}>{t.sec1P2}</ThemedText>
        </View>

  <View ref={secTipuriRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Title}</ThemedText>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type1}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type1Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags1[0]}</CookieTag>
              <CookieTag>{t.sec2Tags1[1]}</CookieTag>
              <CookieTag>{t.sec2Tags1[2]}</CookieTag>
              <CookieTag>{t.sec2Tags1[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type2}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type2Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags2[0]}</CookieTag>
              <CookieTag>{t.sec2Tags2[1]}</CookieTag>
              <CookieTag>{t.sec2Tags2[2]}</CookieTag>
              <CookieTag>{t.sec2Tags2[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type3}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type3Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags3[0]}</CookieTag>
              <CookieTag>{t.sec2Tags3[1]}</CookieTag>
              <CookieTag>{t.sec2Tags3[2]}</CookieTag>
              <CookieTag>{t.sec2Tags3[3]}</CookieTag>
            </View>
          </View>

          <View style={styles.cookieType}>
            <ThemedText style={[styles.h3, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type4}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? 'rgb(214, 214, 214)' : '#000000' }]}>{t.sec2Type4Desc}</ThemedText>
            <View style={styles.cookieExamples}>
              <CookieTag>{t.sec2Tags4[0]}</CookieTag>
              <CookieTag>{t.sec2Tags4[1]}</CookieTag>
              <CookieTag>{t.sec2Tags4[2]}</CookieTag>
              <CookieTag>{t.sec2Tags4[3]}</CookieTag>
            </View>
          </View>
        </View>

  <View ref={secDeCeRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec3Title}</ThemedText>
          <View style={styles.reasonsGrid}>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🔐</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason1Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason1Desc}</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>⚙️</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason2Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason2Desc}</ThemedText>
            </View>
            <View style={styles.reasonCard}>
              <ThemedText style={styles.reasonIcon}>🎯</ThemedText>
              <ThemedText style={[styles.reasonTitle, { color: tokens.colors.text }]}>{t.sec3Reason3Title}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec3Reason3Desc}</ThemedText>
            </View>
          </View>
        </View>

  <View ref={secGestionareRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec4Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec4P1}</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>{t.sec4GuidesTitle}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Chrome:</ThemedText> {t.sec4Chrome}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Firefox:</ThemedText> {t.sec4Firefox}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Safari:</ThemedText> {t.sec4Safari}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>Edge:</ThemedText> {t.sec4Edge}</ThemedText>

          <ThemedText style={[styles.h3, { color: tokens.colors.text }]}>{t.sec4NoteTitle}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec4Note}</ThemedText>
        </View>

  <View ref={secTertiRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec5Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec5P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Cloudinary:</ThemedText> {t.sec5Cloudinary}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Firebase (FCM):</ThemedText> Push notifications (push tokens) and related services used to deliver in-app notifications.</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Analytics/Umami</ThemedText> {t.sec5Analytics}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>• <ThemedText style={styles.strong}>Google Maps:</ThemedText> {t.sec5Maps}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec5P2}</ThemedText>
        </View>

  <View ref={secConsimRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec6Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec6P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec6P2}</ThemedText>
        </View>

  <View ref={secUpdatesRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec7Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec7P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec7Updated}</ThemedText> {t.sec7Date}</ThemedText>
        </View>

  <View ref={secContactRef} style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: 'transparent' }]}> 
          <ThemedText style={[styles.h2, { color: tokens.colors.text }]}>{t.sec8Title}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t.sec8P1}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Email}</ThemedText> {t.sec8EmailValue}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Support}</ThemedText> {t.sec8SupportValue}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}><ThemedText style={styles.strong}>{t.sec8Address}</ThemedText> {t.sec8AddressValue}</ThemedText>
        </View>
      
  </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },

  hero: { borderRadius: 18, paddingVertical: 28, paddingHorizontal: 18, marginBottom: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffd6db', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  heroBadgeWrap: { width: '100%', alignItems: 'center', marginBottom: 12 },
  heroBefore: { position: 'absolute', top: '-50%', right: '-50%', width: '200%', height: '200%', transform: [{ rotate: '30deg' }], backgroundColor: 'transparent' },
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ffc0c8', borderWidth: 1, borderColor: '#ff9dac', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  badgeEmoji: { fontSize: 18, marginRight: 10 },
  heroBadgeText: { fontSize: 14, fontWeight: '700' },
  heroTitle: { fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
  highlight: { fontWeight: '900' },

  sectionCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  h2: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  strong: { fontWeight: '700', color: '#f51866' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginRight: 8, fontSize: 13 },

  reasonsGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  reasonCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  reasonIcon: { fontSize: 22, marginBottom: 8 },
  reasonTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  /* TOC and content styles */
  cookieToc: { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 20, shadowColor: '#3f3f3f', shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  tocTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color:'rgb(87, 87, 87)' },
  tocList: { gap: 6 },
  tocItem: { fontWeight: '600', fontSize: 15, paddingVertical: 6, color: 'rgb(87, 87, 87)'},

  cookieType: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cookieExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  cookieTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  cookieTagText: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
});
