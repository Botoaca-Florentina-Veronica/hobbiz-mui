import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import storage from '../src/services/storage';
import { useLocale } from '../src/context/LocaleContext';
import { getAboutTranslations } from '../src/i18n/about';

interface FAQ { question: string; answer: string; }

export default function AboutScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const { locale } = useLocale();
  const t = getAboutTranslations(locale);
  const { width } = useWindowDimensions();
  // Use a conservative breakpoint: >=350dp -> 2 coloane, altfel 1 coloană
  const isTwoCol = width >= 350;

  // Dark palette tints (used as accents). Matches the attached palette.
  const tints = {
    a10: '#f51866',
    a20: '#fa4875',
    a30: '#fe6585',
    a40: '#ff7e95',
    a50: '#ff96a6',
    a60: '#ffabb7',
  } as const;
  const tintList = [tints.a10, tints.a20, tints.a30, tints.a40, tints.a50, tints.a60];

  const toggle = (idx: number) => setOpen(open === idx ? null : idx);

  // StrokeWord: layered white text behind the colored word to simulate a simple contour/stroke
  const StrokeWord = ({ children, color = tints.a10, stroke = true }: { children: React.ReactNode; color?: string; stroke?: boolean }) => (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {stroke && (
        <>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: -1, top: 0, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 1, top: 0, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 0, top: -1, zIndex: 0 }]}>{children}</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: '#ffffff', position: 'absolute', left: 0, top: 1, zIndex: 0 }]}>{children}</ThemedText>
        </>
      )}
      <ThemedText style={[styles.heroTitle, { color: color, fontWeight: '800', zIndex: 1 }]}>{children}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView style={Platform.OS === 'web' ? ({ height: '100vh' } as any) : { flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{t?.title ?? 'Despre noi'}</ThemedText>
            </View>

            {/* Hero */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: tints.a10,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.xl,
                  ...tokens.shadow.elev2,
                },
              ]}
            >
              <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: '#ffffff',
                      borderRadius: tokens.radius.pill,
                      paddingHorizontal: tokens.spacing.lg,
                      paddingVertical: tokens.spacing.sm,
                      borderWidth: 0,
                      alignSelf: 'center',
                    },
                  ]}
                >
                  <ThemedText style={[styles.badgeText, { color: tints.a10, textAlign: 'center' }]}>{t?.badge}</ThemedText>
                </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: tokens.spacing.md }}>
                <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>{t?.heroPrefix} </ThemedText>
                <View style={{ marginHorizontal: 4 }}>
                  <StrokeWord color={tints.a40} stroke={false}>{t?.heroHighlighted}</StrokeWord>
                </View>
                <ThemedText style={[styles.heroTitle, { color: '#ffffff' }]}>{' '}{t?.heroSuffix}</ThemedText>
              </View>

            {/* subtle decorative element: a lighter strip to mimic web gradient */}
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -20,
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: tints.a60,
                  opacity: 0.12,
                  transform: [{ rotate: '20deg' }],
                }}
              />
            </View>

            {/* Mission */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <View style={styles.missionHeader}>            
                <View style={[styles.missionIcon, { backgroundColor: tokens.colors.elev }]}>              
                  <ThemedText style={{ fontSize: 22 }}>🎯</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.missionTitle, { color: tokens.colors.text }]}>{t?.missionTitle}</ThemedText>
                  <ThemedText style={[styles.missionSubtitle, { color: tokens.colors.muted }]}>{t?.missionSubtitle}</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.text }]}>{t?.missionText}</ThemedText>

              <View style={styles.pillars}>            
                {t?.pillars?.map((p: any) => (
                  <View key={p.title} style={[styles.pillarItem, { borderColor: tokens.colors.border }]}>                
                    <View style={styles.pillarIcon}><ThemedText>{p.icon}</ThemedText></View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.pillarTitle, { color: tokens.colors.text }]}>{p.title}</ThemedText>
                      <ThemedText style={[styles.pillarText, { color: tokens.colors.muted }]}>{p.text}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Features */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.featuresHeader ?? 'Ce poți face pe Hobbiz?'}</ThemedText>
              <View style={styles.checkList}>
                {t?.features?.map((line: string) => (
                  <View key={line} style={styles.checkRow}>
                    <View style={[styles.checkIconWrapper, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}
                    >
                      <Ionicons name="checkmark" size={16} color={tintList[t?.features.indexOf(line) % tintList.length]} />
                    </View>
                    <ThemedText style={[styles.checkText, { color: tokens.colors.muted }]}>{line}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Reasons */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.reasonsHeader ?? 'De ce să alegi Hobbiz?'}</ThemedText>
              <View style={styles.checkList}>
                {t?.reasons?.map((line: string) => (
                  <View key={line} style={styles.checkRow}>
                    <View style={[styles.checkIconWrapper, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
                      <Ionicons name="checkmark" size={16} color={tintList[t?.reasons.indexOf(line) % tintList.length]} />
                    </View>
                    <ThemedText style={[styles.checkText, { color: tokens.colors.muted }]}>{line}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* How it works */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.howHeader ?? 'Cum funcționează?'}</ThemedText>
              {t?.steps?.map((step: any, idx: number) => (
                <View key={step.n} style={styles.stepRow}>
                  <View style={[styles.stepCircle, { backgroundColor: tintList[idx % tintList.length], borderColor: 'transparent', borderWidth: 0 }]}>
                    <ThemedText style={[styles.stepNumber, { color: '#ffffff' }]}>{step.n}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>{step.t}</ThemedText>
                    <ThemedText style={[styles.stepDesc, { color: tokens.colors.muted }]}>{step.d}</ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {/* Values */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.valuesHeader ?? 'Valorile noastre'}</ThemedText>
              <View style={styles.valuesGrid}>
                {t?.values?.map((v: any) => (
                  <View key={v.title} style={[
                    styles.valueCard, 
                    { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border },
                    isTwoCol ? { width: '48%' } : { width: '100%' }
                  ]}>
                    <ThemedText style={styles.valueIcon}>{v.icon}</ThemedText>
                    <ThemedText style={[styles.valueTitle, { color: tokens.colors.text }]}>{v.title}</ThemedText>
                    <ThemedText style={[styles.valueText, { color: tokens.colors.muted }]}>{v.text}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* FAQ */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.faqHeader ?? 'Întrebări frecvente'}</ThemedText>
              {t?.faqs?.map((f: any, idx: number) => {
                const tint = tintList[idx % tintList.length];
                return (
                  <View key={f.q}>
                    <TouchableOpacity
                      onPress={() => toggle(idx)}
                      activeOpacity={0.7}
                      style={[
                        styles.faqQuestion,
                        { borderColor: tokens.colors.border, borderLeftWidth: 4, borderLeftColor: tint, paddingLeft: 12 },
                      ]}
                    >
                      <ThemedText style={[styles.faqQuestionText, { color: tint }]}>{f.q}</ThemedText>
                      <Ionicons name={open === idx ? 'chevron-up' : 'chevron-down'} size={18} color={tint} />
                    </TouchableOpacity>
                    {open === idx && (
                      <View style={styles.faqAnswer}>                  
                        <ThemedText style={{ color: tokens.colors.muted, lineHeight: 20 }}>{f.a}</ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
              <ThemedText style={[styles.updateText, { color: tokens.colors.muted }]}>{t?.updateText}</ThemedText>
            </View>

            {/* Contact Section */}
            <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
              <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>{t?.contactTitle ?? 'Contactează-ne'}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: tokens.colors.muted }]}>{t?.contactText}</ThemedText>
              <View style={[styles.pillarItem, { borderColor: tokens.colors.border, marginTop: 12 }]}>                
                <View style={styles.pillarIcon}><ThemedText>📧</ThemedText></View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.pillarTitle, { color: tokens.colors.text }]}>{t?.contactEmail}</ThemedText>
                  <ThemedText style={[styles.pillarText, { color: tokens.colors.muted }]}>{t?.contactCompany}</ThemedText>
                </View>
              </View>
            </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '600' },

  heroCard: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgePill: { alignSelf: 'flex-start', marginBottom: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 30, fontWeight: '800', lineHeight: 40 },

  card: { borderRadius: 16, padding: 18, gap: 16, borderWidth: 1 },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  missionIcon: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  missionTitle: { fontSize: 18, fontWeight: '700' },
  missionSubtitle: { fontSize: 13, fontWeight: '500' },
  paragraph: { fontSize: 14, lineHeight: 20 },

  pillars: { gap: 12, marginTop: 12 },
  pillarItem: { flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderRadius: 12 },
  pillarIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  pillarTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  pillarText: { fontSize: 13, lineHeight: 18 },

  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  checkList: { marginTop: 8 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  checkIconWrapper: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20 },

  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 12 },
  stepCircle: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: 16, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '700' },
  stepDesc: { fontSize: 13, lineHeight: 18 },

  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  valueCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 8, minHeight: 130, marginBottom: 12 },
  valueIcon: { fontSize: 22 },
  valueTitle: { fontSize: 15, fontWeight: '700' },
  valueText: { fontSize: 12, lineHeight: 16, flex: 1 },

  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  faqQuestionText: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 8 },
  faqAnswer: { paddingVertical: 12 },
  updateText: { fontSize: 11, marginTop: 12, textAlign: 'center' },
});
