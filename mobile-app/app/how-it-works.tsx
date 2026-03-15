import React, { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getHowItWorksTranslations } from '../src/i18n/how-it-works';


export default function HowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const t = getHowItWorksTranslations(locale);

  const tintList = ['#355070', '#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#2E8B57'];

  const isWeb = Platform.OS === 'web';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? tokens.colors.bg : '#FFFFFF' }]}>
      <ScrollView
        style={[styles.scrollView, isWeb && { maxHeight: height - insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tokens.colors.surface }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: tokens.colors.bg }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText style={[styles.title, { color: tokens.colors.text }]}>
              {t.title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: tokens.colors.muted }]}>
              {t.subtitle}
            </ThemedText>
          </View>
        </View>

        {/* Steps Section */}
        <View style={[styles.section, { backgroundColor: isDark ? tokens.colors.bg : '#FFFFFF' }]}>
          {t.steps.map((step, index) => (
            <TouchableOpacity
              key={step.number}
              style={[
                styles.stepCard,
                {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  marginBottom: 16,
                }
              ]}
              onPress={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepCircle,
                  { backgroundColor: tintList[index % tintList.length] }
                ]}>
                  <ThemedText style={styles.stepNumber}>{step.number}</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>
                    {step.title}
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, { color: tokens.colors.muted }]}>
                    {step.description}
                  </ThemedText>
                </View>
                <Ionicons
                  name={expandedStep === step.number ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={tokens.colors.muted}
                />
              </View>
              {expandedStep === step.number && (
                <View style={[styles.stepDetails, { borderTopColor: tokens.colors.border }]}>
                  <ThemedText style={[styles.stepDetailsText, { color: tokens.colors.muted }]}>
                    {step.details}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Section */}
        <View style={[styles.section, { backgroundColor: isDark ? tokens.colors.bg : '#FFFFFF' }]}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            {locale === 'en' ? 'Key Features' : 'Funcționalități principale'}
          </ThemedText>
          <View style={styles.featuresGrid}>
            {t.features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    width: (width - 48) / 2 - 8,
                  }
                ]}
              >
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: tintList[index % tintList.length] + '20' }
                ]}>
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={tintList[index % tintList.length]}
                  />
                </View>
                <ThemedText style={[styles.featureTitle, { color: tokens.colors.text }]}>
                  {feature.title}
                </ThemedText>
                <ThemedText style={[styles.featureDescription, { color: tokens.colors.muted }]}>
                  {feature.description}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={[tintList[0], tintList[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaSection}
        >
          <ThemedText style={styles.ctaTitle}>{t.cta.title}</ThemedText>
          <ThemedText style={styles.ctaDescription}>{t.cta.description}</ThemedText>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              router.push({ pathname: '/all-announcements' });
            }}
          >
            <ThemedText style={styles.ctaButtonText}>{t.cta.button}</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#355070" />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stepDetailsText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaSection: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#355070',
  },
});