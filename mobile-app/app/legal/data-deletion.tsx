import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, ScrollView, View, TouchableOpacity, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocale } from '@/src/context/LocaleContext';
import { LinearGradient } from 'expo-linear-gradient';

const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';

export default function DataDeletionScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = tokens.colors.bg === '#121212';
  const { locale } = useLocale();

  const openMail = (addr: string) => Linking.openURL(`mailto:${addr}`);

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <ThemedText style={[styles.bulletSymbol, { color: tokens.colors.primary }]}>→</ThemedText>
      <ThemedText style={[styles.paragraph, styles.bulletText, { color: isDark ? '#ffffff' : '#4a5568' }]}>{children}</ThemedText>
    </View>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.sectionCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>      
      <LinearGradient colors={[tokens.colors.primary, isDark ? '#f5186644' : WEB_ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionGradient} />
      <ThemedText style={[styles.sectionHeading, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{title}</ThemedText>
      {children}
    </View>
  );

  const StepCard = ({ step, title, children }: { step: string; title: string; children: React.ReactNode }) => (
    <View style={[styles.stepCard, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa', borderColor: tokens.colors.border }]}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumber, { backgroundColor: tokens.colors.primary }]}>
          <ThemedText style={styles.stepNumberText}>{step}</ThemedText>
        </View>
        <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>{title}</ThemedText>
      </View>
      <View style={styles.stepContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top header with back */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{locale === 'en' ? 'Data Deletion' : "Ștergerea datelor"}</ThemedText>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? `${WEB_PRIMARY}22` : WEB_PRIMARY }]}>          
          <View style={styles.heroOverlay} />
            <ThemedText style={[styles.heroIcon, { color: isDark ? tokens.colors.primary : '#fff' }]}>🗑️</ThemedText>
            <ThemedText style={[styles.heroTitle, { color: '#fff' }]}>{locale === 'en' ? 'Data Deletion Instructions' : 'Instrucțiuni ștergere date'}</ThemedText>
            <ThemedText style={[styles.heroDate, { color: '#fff' }]}>{locale === 'en' ? 'Your right to data deletion' : 'Dreptul tău de a șterge datele'}</ThemedText>
        </View>

        {/* Intro Box */}
        <View style={[styles.introBox, { backgroundColor: isDark ? '#282828' : WEB_ACCENT, borderColor: isDark ? 'rgba(245,24,102,0.3)' : WEB_ACCENT }]}>          
          <ThemedText style={[styles.introIcon, { color: isDark ? tokens.colors.primary : '#2c5f7a' }]}>ℹ️</ThemedText>
          <View style={styles.introContent}>            
            <ThemedText style={[styles.introStrong, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'Complete Control Over Your Data' : 'Control complet asupra datelor tale'}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'At Hobbiz, we respect your right to privacy and data deletion under GDPR. You have full control over your personal data and can request deletion at any time. This page explains how to delete all data associated with your account, including data received through Google Sign-In or other third-party authentication services.' : 'La Hobbiz, respectăm dreptul tău la confidențialitate și ștergerea datelor conform GDPR. Ai control complet asupra datelor tale personale și poți solicita ștergerea oricând. Această pagină explică cum să ștergi toate datele asociate contului tău, inclusiv datele primite prin Google Sign-In sau alte servicii de autentificare terțe.'}</ThemedText>
          </View>
        </View>

        {/* Data Deletion Options */}
        <SectionCard title={locale === 'en' ? '1. What data will be deleted?' : '1. Ce date vor fi șterse?'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'When you request account deletion, the following data will be permanently removed from our systems:' : 'Când soliciți ștergerea contului, următoarele date vor fi eliminate permanent din sistemele noastre:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Account information (name, email, phone, profile picture, cover image)' : 'Informații cont (nume, email, telefon, poză profil, imagine copertă)'}</Bullet>
          <Bullet>{locale === 'en' ? 'All announcements you created (titles, descriptions, images, contact details)' : 'Toate anunțurile create de tine (titluri, descrieri, imagini, detalii contact)'}</Bullet>
          <Bullet>{locale === 'en' ? 'Favorite/saved announcements' : 'Anunțuri favorite/salvate'}</Bullet>
          <Bullet>{locale === 'en' ? 'Login credentials and authentication tokens (including Google Sign-In data)' : 'Credențiale login și token-uri autentificare (inclusiv date Google Sign-In)'}</Bullet>
          <Bullet>{locale === 'en' ? 'App usage data and preferences' : 'Date utilizare aplicație și preferințe'}</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', fontStyle: 'italic', marginTop: 8 }]}>{locale === 'en' ? 'Note: Some anonymous analytics data may be retained for platform improvement, but this data cannot be linked back to your identity.' : 'Notă: Unele date analitice anonime pot fi păstrate pentru îmbunătățirea platformei, dar aceste date nu pot fi legate de identitatea ta.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '2. How to delete your data' : '2. Cum să îți ștergi datele'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'You have two options to delete your Hobbiz account and all associated data:' : 'Ai două opțiuni pentru a-ți șterge contul Hobbiz și toate datele asociate:'}</ThemedText>
          
          <StepCard step="A" title={locale === 'en' ? 'Delete from App Settings (Recommended)' : 'Ștergere din Setări Aplicație (Recomandat)'}>
            <Bullet>{locale === 'en' ? 'Open the Hobbiz app and log into your account' : 'Deschide aplicația Hobbiz și autentifică-te în cont'}</Bullet>
            <Bullet>{locale === 'en' ? 'Go to Settings > Account > Delete Account' : 'Mergi la Setări > Cont > Șterge Cont'}</Bullet>
            <Bullet>{locale === 'en' ? 'Read the warning and confirm deletion' : 'Citește avertismentul și confirmă ștergerea'}</Bullet>
            <Bullet>{locale === 'en' ? 'Enter your password for final confirmation' : 'Introdu parola pentru confirmarea finală'}</Bullet>
            <Bullet>{locale === 'en' ? 'Your account and data are deleted immediately and permanently — this action cannot be undone' : 'Contul și datele tale sunt șterse imediat și definitiv — acțiunea nu poate fi anulată'}</Bullet>
          </StepCard>

          <StepCard step="B" title={locale === 'en' ? 'Delete via Email Request' : 'Ștergere prin Cerere Email'}>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>
              {locale === 'en' ? <>Send an email to <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText> with the subject line &quot;Data Deletion Request&quot; and include:</> : <>Trimite un email la <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText> cu subiectul &quot;Cerere Ștergere Date&quot; și include:</>}
            </ThemedText>
            <Bullet>{locale === 'en' ? 'Your full name as registered on Hobbiz' : 'Numele complet așa cum este înregistrat pe Hobbiz'}</Bullet>
            <Bullet>{locale === 'en' ? 'Your email address associated with your account' : 'Adresa de email asociată contului tău'}</Bullet>
            <Bullet>{locale === 'en' ? 'Statement confirming you want to delete all your data' : 'Declarație confirmând că dorești ștergerea tuturor datelor'}</Bullet>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 8 }]}>{locale === 'en' ? 'We will verify your identity and process your request within 30 days of receiving it, in line with data protection law (GDPR) deadlines. You will receive a reply by email once your request has been completed.' : 'Vom verifica identitatea ta și vom procesa cererea în cel mult 30 de zile de la primire, conform termenelor legale privind protecția datelor (GDPR). Vei primi un răspuns prin email odată ce cererea este finalizată.'}</ThemedText>
          </StepCard>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '3. What happens when you request deletion' : '3. Ce se întâmplă când soliciți ștergerea'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'How we handle your deletion request depends on the option you choose:' : 'Modul în care procesăm cererea ta de ștergere depinde de opțiunea pe care o alegi:'}</ThemedText>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Deletion from the app (Option A)' : 'Ștergere din aplicație (Opțiunea A)'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Your account, announcements, profile data, preferences and authentication credentials are deleted immediately and permanently from our active systems, right at the moment of confirmation. There is no grace period.' : 'Contul tău, anunțurile, datele de profil, preferințele și acreditările de autentificare sunt șterse imediat și definitiv din sistemele noastre active, chiar în momentul confirmării. Nu există nicio perioadă de grație.'}</ThemedText>
          </View>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Email request (Option B)' : 'Cerere prin email (Opțiunea B)'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'We verify your identity and process your request within 30 days of receiving it, in line with the deadlines set by data protection law (GDPR). You will receive a reply by email once your request has been completed.' : 'Verificăm identitatea ta și procesăm cererea în cel mult 30 de zile de la primire, conform termenelor impuse de legislația privind protecția datelor (GDPR). Vei primi un răspuns prin email odată ce cererea este finalizată.'}</ThemedText>
          </View>
          <View style={[styles.timelineItem, { borderLeftColor: tokens.colors.primary }]}>
            <ThemedText style={[styles.timelineTitle, { color: isDark ? '#ffffff' : WEB_PRIMARY }]}>{locale === 'en' ? 'Analytics data and legal obligations' : 'Date analitice și obligații legale'}</ThemedText>
            <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Aggregated, anonymized data that can no longer identify you may be retained to improve the platform. We may also retain certain information for as long as needed to comply with legal obligations, such as fraud prevention.' : 'Datele agregate și anonimizate, care nu te mai pot identifica, pot fi păstrate pentru îmbunătățirea platformei. De asemenea, putem reține anumite informații atât timp cât este necesar pentru a respecta obligații legale, precum prevenirea fraudei.'}</ThemedText>
          </View>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 12 }]}>{locale === 'en' ? 'Important: account deletion performed from the app is immediate and irreversible. We recommend downloading or saving any information you need before confirming the deletion.' : 'Important: ștergerea contului realizată din aplicație este imediată și ireversibilă. Îți recomandăm să descarci sau să salvezi orice informație de care ai nevoie înainte de a confirma ștergerea.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '4. Important considerations' : '4. Considerații importante'}>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Data that may be retained' : 'Date care pot fi păstrate'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'In certain limited circumstances, some data may be retained even after deletion:' : 'În anumite circumstanțe limitate, unele date pot fi păstrate chiar și după ștergere:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Legal obligations: We may retain certain records if required by law or for legitimate legal purposes (e.g., fraud prevention, regulatory compliance)' : 'Obligații legale: Putem păstra anumite înregistrări dacă este necesar prin lege sau pentru scopuri legale legitime (ex. prevenirea fraudei, conformitate reglementară)'}</Bullet>
          <Bullet>{locale === 'en' ? 'Anonymous analytics: Aggregated, anonymized usage data that cannot be linked to you personally' : 'Analize anonime: Date agregate, anonimizate de utilizare care nu pot fi legate de tine personal'}</Bullet>
          <Bullet>{locale === 'en' ? 'Messages and reviews: Conversations and reviews exchanged with other users may remain on the platform to preserve the integrity of their history — removing them would also affect data belonging to those other users' : 'Mesaje și recenzii: Conversațiile și recenziile schimbate cu alți utilizatori pot rămâne pe platformă, pentru a păstra integritatea istoricului acestora — eliminarea lor ar afecta și datele celorlalți utilizatori implicați'}</Bullet>
          <Bullet>{locale === 'en' ? 'Third-party copies: Content you shared publicly may have been copied by other users before deletion. We cannot control or delete such copies.' : 'Copii terțe: Conținutul partajat public poate fi fost copiat de alți utilizatori înainte de ștergere. Nu putem controla sau șterge astfel de copii.'}</Bullet>

          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070', marginTop: 16 }]}>{locale === 'en' ? 'This action is permanent' : 'Această acțiune este permanentă'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Account deletion performed from the app is immediate and irreversible from the moment of confirmation. Once your data is permanently deleted:' : 'Ștergerea contului realizată din aplicație este imediată și ireversibilă, din momentul confirmării. Odată ce datele tale sunt șterse permanent:'}</ThemedText>
          <Bullet>{locale === 'en' ? 'You cannot recover your account, announcements, messages, or reviews' : 'Nu poți recupera contul, anunțurile, mesajele sau recenziile'}</Bullet>
          <Bullet>{locale === 'en' ? 'If you want to use Hobbiz again, you must create a new account from scratch' : 'Dacă vrei să folosești Hobbiz din nou, trebuie să creezi un cont nou de la zero'}</Bullet>
          <Bullet>{locale === 'en' ? 'Your username and email may become available for others to register' : 'Numele de utilizator și email-ul tău pot deveni disponibile pentru alții să se înregistreze'}</Bullet>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '5. Need help?' : '5. Ai nevoie de ajutor?'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>
            {locale === 'en' ? <>If you have questions about data deletion or encounter any issues, please contact our support team at <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText>. We typically respond within 48 hours.</> : <>Dacă ai întrebări despre ștergerea datelor sau întâmpini probleme, te rugăm să contactezi echipa noastră de suport la <ThemedText onPress={() => openMail('team.hobbiz@gmail.com')} style={[styles.link, { color: tokens.colors.primary }]}>team.hobbiz@gmail.com</ThemedText>. De obicei răspundem în 48 de ore.</>}
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568', marginTop: 12 }]}>{locale === 'en' ? 'For more information about how we handle your data, please review our Privacy Policy and Terms and Conditions.' : 'Pentru mai multe informații despre cum gestionăm datele tale, te rugăm să consulți Politica de Confidențialitate și Termenii și Condițiile.'}</ThemedText>
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  heroCard: { padding: 40, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  heroOverlay: { position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(252,194,46,0.18)' },
  heroIcon: { fontSize: 48, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  heroDate: { fontSize: 14, fontWeight: '500', opacity: 0.95 },
  introBox: { borderRadius: 20, padding: 28, flexDirection: 'row', gap: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  introIcon: { fontSize: 30, marginTop: 4 },
  introContent: { flex: 1 },
  introStrong: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sectionCard: { borderRadius: 20, padding: 24, marginBottom: 10, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  sectionGradient: { position: 'absolute', top: 0, left: 0, height: 4, right: 0 },
  sectionHeading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subHeading: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  paragraph: { fontSize: 14.5, lineHeight: 22, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletSymbol: { fontSize: 16, marginRight: 6, lineHeight: 22, fontWeight: '700' },
  bulletText: { flex: 1, marginBottom: 0 },
  link: { textDecorationLine: 'underline' },
  stepCard: { 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600'
  },
  stepContent: {
    paddingLeft: 48
  },
  timelineItem: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    marginBottom: 16,
    paddingBottom: 8
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  }
});
