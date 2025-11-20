import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, ScrollView, View, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';
import { LinearGradient } from 'expo-linear-gradient';

// App palette per user request
const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';
const WEB_ACCENT_GRAD_TO = '#fcc22eff';
const WEB_BORDER_LIGHT = '#ffffff';
const WEB_TEXT_DARK = '#100e9aff';
const WEB_TEXT_BODY = '#64748b';

export default function PrivacyScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = tokens.colors.bg === '#121212';

  const [locale, setLocale] = useState<'ro' | 'en'>('ro');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storage.getItemAsync('locale');
        if (mounted && stored) setLocale(stored === 'en' ? 'en' : 'ro');
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top header with back */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{locale === 'en' ? 'Privacy Policy' : "Politica de confidențialitate"}</ThemedText>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? `${WEB_PRIMARY}22` : WEB_PRIMARY }]}>          
          <View style={styles.heroOverlay} />
            <ThemedText style={[styles.heroIcon, { color: isDark ? tokens.colors.primary : '#fff' }]}>🛡️</ThemedText>
            <ThemedText style={[styles.heroTitle, { color: '#fff' }]}>{locale === 'en' ? 'Privacy Policy' : 'Politica de confidențialitate'}</ThemedText>
            <ThemedText style={[styles.heroDate, { color: '#fff' }]}>{locale === 'en' ? 'Last updated: July 19, 2025' : 'Ultima actualizare: 19 iulie 2025'}</ThemedText>
        </View>

        {/* Intro / Transparency Box */}
        <View style={[styles.introBox, { backgroundColor: isDark ? '#282828' : WEB_ACCENT, borderColor: isDark ? 'rgba(245,24,102,0.3)' : WEB_ACCENT }]}>          
          <ThemedText style={[styles.introIcon, { color: isDark ? tokens.colors.primary : '#2c5f7a' }]}>ℹ️</ThemedText>
          <View style={styles.introContent}>            
            <ThemedText style={[styles.introStrong, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'Transparency and Data Protection' : 'Transparență și protecție a datelor'}</ThemedText>
              <ThemedText style={[styles.paragraph, { color: isDark ? '#fff' : '#2c5f7a' }]}>{locale === 'en' ? 'At Hobbiz we consider the protection of personal data a core responsibility. This document describes our information handling practices in detail, in accordance with the EU General Data Protection Regulation (GDPR) and applicable Romanian law.' : 'La Hobbiz, considerăm protecția datelor personale o responsabilitate fundamentală. Acest document descrie în detaliu practicile noastre de gestionare a informațiilor, conform Regulamentului General privind Protecția Datelor (GDPR) și legislației românești aplicabile.'}</ThemedText>
          </View>
        </View>

        {/* Sections */}
        <SectionCard title={locale === 'en' ? '1. Purpose and scope' : '1. Scopul și domeniul de aplicare'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'This policy applies to all information collected through the Hobbiz platform, including the website, mobile applications and any associated interfaces. It defines the legal and operational framework for processing personal data, including collection purposes, processing methods, user rights and implemented security measures.' : 'Această politică se aplică tuturor informațiilor colectate prin intermediul platformei Hobbiz, inclusiv prin website, aplicații mobile și orice alte interfețe asociate. Documentul definește cadrul legal și operațional pentru prelucrarea datelor cu caracter personal, inclusiv scopurile de colectare, metodele de procesare, drepturile utilizatorilor și măsurile de securitate implementate.'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'The data controller is SC Hobbiz SRL, registered in Romania, which determines the purposes and means of personal data processing. For any questions regarding this policy, please contact us using the details provided in the final section.' : 'Operatorul de date este SC Hobbiz SRL, înregistrată în România, care determină scopurile și mijloacele prelucrării datelor. Pentru orice nelămuriri referitoare la conținutul acestei politici, vă rugăm să ne contactați folosind detaliile furnizate în secțiunea finală.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '2. Categories of processed data' : '2. Categorii de date prelucrate'}>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Data you provide voluntarily' : 'Date furnizate voluntar'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'During account creation and use of the platform we collect full name, email, phone number, optional demographic data (age, gender) and any information you voluntarily enter in your profile or generated content. For premium services, payment data are processed exclusively by PCI DSS-compliant processors.' : 'În procesul de creare a contului și utilizare a platformei colectăm nume complet, email, telefon, date demografice opționale (vârstă, gen) și orice informații introduse voluntar în profil sau conținut generat. Pentru servicii premium, datele de plată sunt procesate exclusiv prin procesatori certificați PCI DSS.'}</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Automatically collected data' : 'Date colectate automat'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'IP address, device identifiers, browser, operating system, usage data (pages, time, actions), approximate location derived and cookie technologies for functionality, analytics and personalization.' : 'Adresă IP, identificatori dispozitiv, browser, sistem de operare, date de utilizare (pagini, timp, acțiuni), localizare aproximativă derivată și tehnologii cookie pentru funcționalitate, analiză și personalizare.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '3. Purposes and legal bases for processing' : '3. Scopurile și bazele juridice ale prelucrării'}>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Contract performance' : 'Executarea contractului'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Access to the platform, account administration, listing publication, enabling communication and processing transactions.' : 'Acces la platformă, gestionare cont, publicare anunțuri, facilitarea comunicării și procesarea tranzacțiilor.'}</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Legitimate interests' : 'Interese legitime'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Improving services, preventing fraud and abuse, usage analysis, feature development, securing infrastructure.' : 'Îmbunătățirea serviciilor, prevenirea fraudelor și abuzurilor, analiză utilizare, dezvoltare funcționalități, securizare infrastructură.'}</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Consent' : 'Consimțământ'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Direct marketing, certain analytics and non-essential cookies (revocable at any time).' : 'Marketing direct, anumite analize și cookie-uri neesențiale (revocabil oricând).'}</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'Legal compliance' : 'Conformitate legală'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Fulfilling tax obligations, AML and other applicable regulations.' : 'Îndeplinirea obligațiilor fiscale, AML și alte reglementări aplicabile.'}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '4. Data security and confidentiality' : '4. Securitatea și confidențialitatea datelor'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Technical and organizational measures: encryption in transit and at rest, granular access control (principle of least privilege), monitoring and logging, periodic penetration testing, internal policies and staff training.' : 'Măsuri tehnice și organizatorice: criptare în tranzit și la rest, control granular de acces (principiul privilegiilor minime), monitorizare și jurnalizare, teste de penetrare periodice, politici interne și instruire personal.'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Advanced encryption (TLS 1.2+/TLS 1.3, AES, additional per-field encryption)' : 'Criptare avansată (TLS 1.2+/TLS 1.3, AES, criptare suplimentară per câmp)'}</Bullet>
          <Bullet>{locale === 'en' ? 'Access control and permission reviews' : 'Control acces și revizuiri permisiuni'}</Bullet>
          <Bullet>{locale === 'en' ? 'Security testing and vulnerability management' : 'Testări de securitate și management vulnerabilități'}</Bullet>
          <Bullet>{locale === 'en' ? 'Internal policies + periodic training' : 'Politici interne + training periodic'}</Bullet>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '5. Information security' : '5. Securitatea informațiilor tale'}>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? 'Multi-layer architecture (Tier III+/ISO 27001 EU data centers), perimeter protection, secure-by-design application security, MFA for privileged access, end-to-end encryption, redundant backups and an incident response plan.' : 'Arhitectură multi-layer (centre date Tier III+/ISO 27001 UE), protecție perimetrală, securitate aplicativă secure-by-design, MFA pentru acces privilegiat, criptare end-to-end, backup redundant și plan de răspuns la incidente.'}</ThemedText>
          <ThemedText style={[styles.subHeading, { color: isDark ? '#ffffff' : '#355070' }]}>{locale === 'en' ? 'User recommendations' : 'Recomandări utilizatori'}</ThemedText>
          <Bullet>{locale === 'en' ? 'Use complex and unique passwords' : 'Folosiți parole complexe și unice'}</Bullet>
          <Bullet>{locale === 'en' ? 'Enable two-factor authentication' : 'Activați autentificarea cu doi factori'}</Bullet>
          <Bullet>{locale === 'en' ? 'Avoid unsecured public Wi‑Fi networks' : 'Evitați rețele Wi‑Fi publice nesecurizate'}</Bullet>
          <Bullet>{locale === 'en' ? 'Regularly review account activity' : 'Verificați periodic activitatea contului'}</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? <>Security inquiries: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></> : <>Întrebări de securitate: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></>}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '6. User rights' : '6. Drepturile utilizatorilor'}>
          <Bullet>{locale === 'en' ? 'Right of access and portability' : 'Dreptul de acces și portabilitate'}</Bullet>
          <Bullet>{locale === 'en' ? 'Right of rectification' : 'Dreptul de rectificare'}</Bullet>
          <Bullet>{locale === 'en' ? 'Right to erasure' : 'Dreptul la ștergere'}</Bullet>
          <Bullet>{locale === 'en' ? 'Right to restriction' : 'Dreptul la restricționare'}</Bullet>
          <Bullet>{locale === 'en' ? 'Right to object and withdraw consent' : 'Dreptul de opoziție și retragere consimțământ'}</Bullet>
          <ThemedText style={[styles.paragraph, { color: isDark ? '#ffffff' : '#4a5568' }]}>{locale === 'en' ? <>Requests to: <ThemedText onPress={() => openMail('protectiadatelor@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>protectiadatelor@hobbiz.ro</ThemedText> (response within 30 days; we may request identity verification).</> : <>Solicitări la: <ThemedText onPress={() => openMail('protectiadatelor@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>protectiadatelor@hobbiz.ro</ThemedText> (răspuns în max. 30 zile; putem cere verificare identitate).</>}</ThemedText>
        </SectionCard>

        <SectionCard title={locale === 'en' ? '7. Contact and additional information' : '7. Contact și informații suplimentare'}>
          <Bullet>{locale === 'en' ? 'Controller: SC Hobbiz SRL' : 'Operator: SC Hobbiz SRL'}</Bullet>
          <Bullet>{locale === 'en' ? <>DPO: <ThemedText onPress={() => openMail('dpo@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>dpo@hobbiz.ro</ThemedText></> : <>DPO: <ThemedText onPress={() => openMail('dpo@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>dpo@hobbiz.ro</ThemedText></>}</Bullet>
          <Bullet>{locale === 'en' ? <>Security incidents: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></> : <>Incidente securitate: <ThemedText onPress={() => openMail('security@hobbiz.ro')} style={[styles.link, { color: tokens.colors.primary }]}>security@hobbiz.ro</ThemedText></>}</Bullet>
          <Bullet>{locale === 'en' ? 'Complaints: National Supervisory Authority' : 'Plângeri: Autoritatea Națională de Supraveghere'}</Bullet>
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
});
