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

const TRANSLATIONS = {
  ro: {
    title: 'Cum funcționează?',
    subtitle: 'Descoperă cum să folosești Hobbiz în doar câțiva pași simpli',
    steps: [
      {
        number: 1,
        title: 'Creează-ți contul',
        description: 'Înregistrează-te gratuit cu emailul sau continuă ca invitat. Personalizează-ți profilul cu o fotografie și o scurtă descriere.',
        details: 'Completezi informațiile de bază și, opțional, adaugi avatar și o scurtă descriere. Poți porni în modul invitat și să îți creezi contul mai târziu.'
      },
      {
        number: 2,
        title: 'Publică anunțuri',
        description: 'Creează anunțuri complete cu imagini, descrieri detaliate și preț opțional.',
        details: 'Apasă butonul "+" din ecranul principal pentru a crea un anunț nou. Adaugă până la 5 imagini, alege categoria potrivită, scrie o descriere detaliată și setează un preț sau lasă-l liber pentru negociere. Poți edita sau șterge anunțurile tale oricând din secțiunea "Anunțurile mele".'
      },
      {
        number: 3,
        title: 'Conectează-te',
        description: 'Discută direct cu ceilalți utilizatori prin sistemul de mesagerie integrat.',
        details: 'Chat integrat pentru întrebări rapide și negocieri. Primești notificări despre mesaje noi sau activitate pe anunțurile tale.'
      },
      {
        number: 4,
        title: 'Colaborează smart',
        description: 'Acceptă prețul direct sau negociază sume personalizate pentru colaborări flexibile.',
        details: 'Dacă anunțul are preț setat, poți accepta direct cu butonul "Vrei să colaborăm?" - balanța vânzătorului va fi actualizată automat. Altfel, poți negocia o sumă customizată prin sistemul de oferte și contraoferte.'
      },
      {
        number: 5,
        title: 'Gestionează anunțurile',
        description: 'Arhivează anunțurile inactive și organizează-le eficient.',
        details: 'Din secțiunea "Anunțurile mele" poți vedea toate anunțurile tale active. Dacă un serviciu este indisponibil temporar, poți să-l arhivezi pentru a-l ascunde din listări publice, dar îl poți reactiva oricând. Anunțurile arhivate rămân salvate în contul tău.'
      },
      {
        number: 6,
        title: 'Lasă recenzii',
        description: 'Construiește reputația ta prin feedback autentic din partea comunității.',
        details: 'După o colaborare reușită, utilizatorii pot lăsa recenzii cu rating de la 1 la 5 stele și comentarii. Recenziile apar pe profilul tău și ajută la construirea încrederii în comunitate. Poți vedea toate recenziile tale în secțiunea de profil.'
      }
    ],
    features: [
      {
        icon: 'pricetag-outline',
        title: 'Prețuri flexibile',
        description: 'Setează prețuri fixe pentru tranzacții rapide sau permite negocierea.'
      },
      {
        icon: 'flash-outline',
        title: 'Colaborare instantanee',
        description: 'Acceptă prețurile direct pentru actualizarea automată a balanței.'
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Negociere avansată',
        description: 'Sistem complet de oferte și contraoferte pentru sume personalizate.'
      },
      {
        icon: 'shield-checkmark-outline',
        title: 'Tranzacții sigure',
        description: 'Toate colaborările sunt înregistrate și securizate în platformă.'
      },
      {
        icon: 'images-outline',
        title: 'Galerie foto',
        description: 'Adaugă până la 5 imagini la fiecare anunț pentru prezentare completă.'
      },
      {
        icon: 'archive-outline',
        title: 'Arhivare anunțuri',
        description: 'Ascunde temporar anunțurile inactive și reactivează-le când dorești.'
      },
      {
        icon: 'star-outline',
        title: 'Sistem de recenzii',
        description: 'Evaluează colaborările și construiește-ți reputația în comunitate.'
      },
      {
        icon: 'notifications-outline',
        title: 'Notificări instant',
        description: 'Fii la curent cu mesaje noi, oferte și activitate pe anunțuri.'
      }
    ],
    cta: {
      title: 'Gata să începi?',
      description: 'Alătură-te comunității noastre și începe să colaborezi cu oameni cu aceleași pasiuni!',
      button: 'Explorează anunțuri'
    }
  },
  en: {
    title: 'How it works?',
    subtitle: 'Discover how to use Hobbiz in just a few simple steps',
    steps: [
      {
        number: 1,
        title: 'Create your account',
        description: 'Register for free with your email or continue as a guest. Customize your profile with a photo and short description.',
        details: 'Fill in basic information and optionally add an avatar and short description. You can start in guest mode and create your account later.'
      },
      {
        number: 2,
        title: 'Post listings',
        description: 'Create complete listings with images, detailed descriptions, and optional pricing.',
        details: 'Tap the "+" button on the main screen to create a new listing. Add up to 5 images, choose the right category, write a detailed description, and set a price or leave it open for negotiation. You can edit or delete your listings anytime from the "My Listings" section.'
      },
      {
        number: 3,
        title: 'Connect',
        description: 'Communicate directly with other users through the integrated messaging system.',
        details: 'Integrated chat for quick questions and negotiations. You receive notifications about new messages or activity on your listings.'
      },
      {
        number: 4,
        title: 'Smart collaboration',
        description: 'Accept direct pricing or negotiate custom amounts for flexible collaborations.',
        details: 'If the listing has a set price, you can accept directly with the "Want to collaborate?" button - the seller\'s balance will be updated automatically. Otherwise, you can negotiate a custom amount through the offer and counteroffer system.'
      },
      {
        number: 5,
        title: 'Manage listings',
        description: 'Archive inactive listings and organize them efficiently.',
        details: 'From the "My Listings" section, you can see all your active listings. When a service is no longer available, you can archive it to hide it from public listings, but you can reactivate it anytime. Archived listings remain saved in your account.'
      },
      {
        number: 6,
        title: 'Leave reviews',
        description: 'Build your reputation through authentic feedback from the community.',
        details: 'After a successful collaboration, users can leave reviews with ratings from 1 to 5 stars and comments. Reviews appear on your profile and help build trust in the community. You can see all your reviews in the profile section.'
      }
    ],
    features: [
      {
        icon: 'pricetag-outline',
        title: 'Flexible pricing',
        description: 'Set fixed prices for quick transactions or allow negotiation.'
      },
      {
        icon: 'flash-outline',
        title: 'Instant collaboration',
        description: 'Accept prices directly for automatic balance updates.'
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Advanced negotiation',
        description: 'Complete system of offers and counteroffers for custom amounts.'
      },
      {
        icon: 'shield-checkmark-outline',
        title: 'Safe transactions',
        description: 'All collaborations are recorded and secured in the platform.'
      },
      {
        icon: 'images-outline',
        title: 'Photo gallery',
        description: 'Add up to 5 images to each listing for complete presentation.'
      },
      {
        icon: 'archive-outline',
        title: 'Archive listings',
        description: 'Temporarily hide inactive listings and reactivate them when you want.'
      },
      {
        icon: 'star-outline',
        title: 'Review system',
        description: 'Rate collaborations and build your reputation in the community.'
      },
      {
        icon: 'notifications-outline',
        title: 'Instant notifications',
        description: 'Stay updated with new messages, offers, and activity on listings.'
      }
    ],
    cta: {
      title: 'Ready to start?',
      description: 'Join our community and start collaborating with people who share your passions!',
      button: 'Explore listings'
    }
  }
};

export default function HowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const t = TRANSLATIONS[locale as keyof typeof TRANSLATIONS] || TRANSLATIONS.ro;

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