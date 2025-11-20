import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';

// App palette per user request
const WEB_PRIMARY = '#100e9aff';
const WEB_ACCENT = '#fcc22eff';
const WEB_ACCENT_GRAD_TO = '#fcc22eff';
const WEB_BORDER_LIGHT = '#ffffff';
const WEB_TEXT_DARK = '#100e9aff';
const WEB_TEXT_BODY = '#64748b';

export default function TermsScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  const isDarkMode = isDark;
  const surface = isDarkMode ? '#1e1e1e' : tokens.colors.surface;
  const footerBg = isDarkMode ? '#1a1a1a' : '#f8fafc';
  const bodyColor = isDarkMode ? '#b0b0b0' : WEB_TEXT_BODY;
  const headingColor = isDarkMode ? WEB_ACCENT : WEB_PRIMARY;
  const subHeadingColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;
  const strongColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.pageTitle, { color: tokens.colors.text }]}>{locale === 'en' ? 'Terms and Conditions' : 'Termeni și condiții'}</ThemedText>
        </View>

        {/* Hero Header (desktop style is hidden on web mobile, we'll show compact) */}
        <View style={[styles.desktopHeader, { backgroundColor: WEB_PRIMARY }]}>          
          <ThemedText style={styles.headerIcon}>📝</ThemedText>
          <ThemedText style={styles.headerH1}>{locale === 'en' ? 'Terms and Conditions' : 'Termeni și condiții'}</ThemedText>
          <ThemedText style={styles.headerDate}>{locale === 'en' ? 'Last updated: September 5, 2025' : 'Ultima actualizare: 5 septembrie 2025'}</ThemedText>
          <View style={styles.radialOverlay} />
        </View>

        {/* Intro Gradient Card (fallback without expo-linear-gradient) */}
        <View
          style={[styles.introCard, { backgroundColor: WEB_ACCENT }]}
        >
          <View style={styles.introRow}>
            <ThemedText style={styles.introIcon}>ℹ️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.introStrong}>{locale === 'en' ? 'Hobbiz Platform Terms of Use' : 'Acordul de utilizare a platformei Hobbiz'}</ThemedText>
              <ThemedText style={styles.introParagraph}>
                {locale === 'en'
                  ? 'By accessing and using the Hobbiz platform, you agree to comply with the terms and conditions set out in this document. Please read these provisions carefully before creating an account or using our services.'
                  : 'Prin accesarea și utilizarea platformei Hobbiz, acceptați să respectați termenii și condițiile prezentate în acest document. Vă rugăm să citiți cu atenție aceste prevederi înainte de a crea un cont sau de a utiliza serviciile noastre.'}
              </ThemedText>
            </View>
          </View>
  </View>

        {/* Section 1 - Agreement to Terms */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '1. Agreement to Terms' : '1. Acord cu privire la termeni'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}> {
            locale === 'en'
              ? 'By accessing, creating an account, or otherwise using the Hobbiz platform (the "Platform"), you acknowledge that you have read, understand, and agree to be bound by these Terms and Conditions (the "Terms"). This agreement constitutes an electronic contract between you and the operator of the Platform. If you do not agree with these Terms, you are expressly prohibited from using the Platform and should delete your account if one has been created.'
              : 'Prin accesarea, crearea unui cont sau utilizarea în orice mod a platformei Hobbiz ("Platforma"), declarați că ați citit, ați înțeles și că sunteți de acord să respectați toți acești termeni și condiții ("Termeni"). Acest acord constituie un contract încheiat în format electronic între dumneavoastră și operatorul Platformei. Dacă nu sunteți de acord cu acești Termeni, atunci vă este interzis în mod expres să utilizați Platforma și, dacă ați creat deja un cont, să îl ștergeți.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'If you use the Platform on behalf of a legal entity, you represent and warrant that you have the authority to accept these Terms on behalf of that entity. "You" will include the entity you represent. You are responsible for compliance with these Terms both personally and for any person who uses your account.'
              : 'În cazul în care utilizați Platforma în numele unei persoane juridice, declarați și garantați că aveți autoritatea legală de a accepta acești Termeni în numele respectivei entități, iar termenul "dumneavoastră" va include entitatea pe care o reprezentați. Sunteți responsabil(ă) de respectarea acestor Termeni atât personal, cât și pentru orice persoană care utilizează contul dumneavoastră.'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Incorporated Documents' : 'Documente parte integrantă'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'The Terms include and refer to our related policies governing specific aspects of Platform use: the Privacy Policy, Cookie Policy, and any community rules or procedures published in the app/website. In case of any inconsistency, service-specific provisions may prevail over these general clauses.'
              : 'Termenii includ și fac trimitere la politicile noastre conexe, care reglementează aspecte specifice ale utilizării Platformei: Politica de Confidențialitate, Politica de Cookie-uri și orice reguli ale comunității sau proceduri publicate în aplicație/website. În măsura oricărei neconcordanțe, prevederile specifice serviciului utilizat pot prevala asupra prezentelor clauze generale.'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Updates to the Terms' : 'Actualizări ale Termenilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We may update these Terms periodically to reflect legal or service changes. We will notify users of material changes in accordance with the "Changes and Termination" section. Continued use of the Platform after the effective date of any changes constitutes acceptance of the updated version. If you disagree with the changes, you must stop using the services.'
              : 'Putem modifica periodic acești Termeni pentru a reflecta schimbări legislative sau ale serviciilor. Vom notifica utilizatorii în caz de modificări materiale, conform secțiunii „Modificări și încetarea serviciilor”. Continuarea utilizării Platformei după data intrării în vigoare a modificărilor constituie acceptarea fără rezerve a versiunii actualizate. Dacă nu sunteți de acord cu modificările, trebuie să încetați utilizarea serviciilor.'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Explicit Consent' : 'Consimțământul explicit'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Ticking an acceptance box, clicking the "Create account" button, or continued use of the Platform constitutes your express consent to comply with these Terms and associated policies. We recommend saving or printing a copy of the current version for your records.'
              : 'Bifarea unei căsuțe de acceptare, apăsarea butonului „Creează cont”, respectiv utilizarea continuă a Platformei, reprezintă consimțământul dumneavoastră expres cu privire la respectarea acestor Termeni și a politicilor asociate. Vă recomandăm să salvați sau să tipăriți o copie a versiunii curente pentru arhiva personală.'
          }</ThemedText>
        </View>

        {/* Section 2 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '2. Definitions and Interpretation' : '2. Definiții și interpretare'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en' ? (
              <>
                In these Terms, the following definitions apply: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Platform&quot;</ThemedText> refers to the Hobbiz website and all associated mobile applications; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Services&quot;</ThemedText> includes all functionality provided through the Platform, including posting listings, search, user communication and payment processing; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;User&quot;</ThemedText> means any natural or legal person who accesses or uses the Platform; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Content&quot;</ThemedText> includes text, images, video, data, and other materials uploaded to the Platform.
              </>
            ) : (
              <>În cadrul acestor termeni și condiții, următoarele definiții se aplică: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Platforma&quot;</ThemedText> se referă la website-ul Hobbiz și toate aplicațiile mobile asociate; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Servicii&quot;</ThemedText> include toate funcționalitățile oferite prin platformă, inclusiv publicarea anunțurilor, căutarea, comunicarea între utilizatori și procesarea plăților; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Utilizator&quot;</ThemedText> desemnează orice persoană fizică sau juridică care accesează sau folosește platforma; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Conținut&quot;</ThemedText> include texte, imagini, video, date și alte materiale încărcate pe platformă.</>
            )
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Hobbiz operates as a digital marketplace connecting people who wish to sell or buy various products and services. We are not the owners or sellers of the listed items but facilitate interaction between users using modern web technologies, including React.js, Node.js and MongoDB.'
              : 'Platforma Hobbiz funcționează ca un marketplace digital care conectează persoane interesate să vândă sau să cumpere produse și servicii diverse. Nu suntem proprietarii sau vânzătorii produselor listate, ci facilităm interacțiunea între utilizatori prin intermediul tehnologiilor web moderne, inclusiv React.js, Node.js și baze de date MongoDB.'
          }</ThemedText>
        </View>

        {/* Section 3 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '3. Eligibility and Registration' : '3. Eligibilitate și înregistrare'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Age and Legal Capacity' : 'Cerințe de vârstă și capacitate juridică'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'To use Hobbiz services you must be at least 18 years old and have full legal capacity under applicable law. Minors aged 16-17 may use the Platform only with the explicit consent of a parent or legal guardian and under their supervision.'
              : 'Pentru a utiliza serviciile Hobbiz, trebuie să aveți minimum 18 ani și să dețineți capacitatea juridică deplină conform legislației românești. Minorilor cu vârsta cuprinsă între 16-18 ani li se permite utilizarea platformei doar cu consimțământul explicit al părinților sau reprezentanților legali și sub supravegherea acestora.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Legal entities may use the Platform through authorized representatives, who are responsible for all actions taken on behalf of the organization. We may verify registration documents for business accounts and reserve the right to request additional documentation to validate identity.'
              : 'Persoanele juridice pot utiliza platforma prin intermediul reprezentanților autorizați, care răspund pentru toate acțiunile întreprinse în numele organizației. Verificăm documentele de înregistrare pentru conturile business și ne rezervăm dreptul de a solicita documente suplimentare pentru validarea identității.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Registration Process' : 'Procesul de înregistrare'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Creating an account requires providing accurate and complete information: real name, a valid email address, and a functional phone number. False or misleading information constitutes a breach of these Terms and may result in suspension or account termination without notice.'
              : 'Crearea unui cont necesită furnizarea unor informații exacte și complete: nume real, adresă de email validă și număr de telefon funcțional. Informațiile false sau înșelătoare constituie o încălcare a acestor termeni și pot duce la suspendarea sau închiderea contului fără preaviz.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We support multiple registration methods: email and password, Google OAuth 2.0, or other authorized identity providers. Each user may have a single active account; creating multiple accounts to avoid restrictions is prohibited.'
              : 'Suportăm înregistrarea prin metode multiple: email și parolă, autentificare prin Google OAuth 2.0, sau prin alți furnizori de identitate autorizați. Fiecare utilizator poate deține un singur cont activ, iar crearea de conturi multiple pentru evitarea restricțiilor este strict interzisă.'
          }</ThemedText>
        </View>

        {/* Section 4 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '4. Platform Use and Listings' : '4. Utilizarea platformei și anunțuri'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Posting Listings' : 'Publicarea anunțurilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users may post listings to sell new or second-hand items, offer services, rent goods, or conduct other lawful commercial transactions. Each listing must include an accurate and complete description, genuine unaltered photos, and a clear transparent price.'
              : 'Utilizatorii pot publica anunțuri pentru vânzarea de produse noi sau second-hand, prestarea de servicii, închirierea de bunuri sau alte tranzacții comerciale legale. Fiecare anunț trebuie să conțină o descriere exactă și completă a produsului sau serviciului, fotografii reale și nemodificate și un preț corect și transparent.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Posting listings for counterfeit or pirated goods, illegal substances, weapons and ammunition, protected or illegally obtained animals, illegal or immoral services, adult content, or materials infringing copyright is strictly prohibited. We actively monitor content using automated algorithms and human moderation.'
              : 'Este strict interzisă publicarea de anunțuri pentru: produse contrafăcute sau piratate, substanțe interzise prin lege, arme și muniții, animale protejate sau obținute ilegal, servicii ilegale sau imorale, conținut pentru adulți sau materiale ce încalcă drepturile de autor. Monitorizăm activ conținutul prin algoritmi automatizați și moderare umană.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'User Responsibilities' : 'Responsabilitățile utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users are fully responsible for the content they post, the accuracy of information provided, and compliance with applicable laws. We reserve the right to remove any content that violates these Terms or applicable law without obligation to provide detailed explanations.'
              : 'Utilizatorii sunt integral responsabili pentru conținutul publicat, exactitatea informațiilor furnizate și respectarea tuturor legilor aplicabile. Ne rezervăm dreptul de a elimina orice conținut care încalcă acești termeni sau legislația în vigoare, fără obligația de a oferi explicații detaliate.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Communication between users must be respectful and professional. Harassment, threats, vulgar or discriminatory language, spam, and attempts at fraud will be sanctioned with temporary or permanent account restrictions.'
              : 'Comunicarea între utilizatori trebuie să se desfășoare într-un mod respectuos și profesional. Hărțuirea, amenințările, limbajul vulgar sau discriminatoriu, spam-ul și tentativele de fraudă vor fi sancționate prin restricții temporare sau permanente ale contului.'
          }</ThemedText>
        </View>

        {/* Section 5 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '5. Transactions and Payments' : '5. Tranzacții și plăți'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Facilitating Transactions' : 'Facilitarea tranzacțiilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Hobbiz acts as a technical intermediary between buyers and sellers and is not a party to transactions. We do not guarantee the quality, authenticity or conformity of items sold; these are the sole responsibility of sellers. We recommend users exercise caution and inspect items before finalizing transactions.'
              : 'Hobbiz acționează ca intermediar tehnologic între cumpărători și vânzători, fără a fi parte în tranzacțiile efectuate. Nu garantăm calitatea, autenticitatea sau conformitatea produselor vândute, acestea fiind responsabilitatea exclusivă a vânzătorilor. Recomandăm utilizatorilor să fie precauți și să verifice întotdeauna produsele înainte de finalizarea tranzacțiilor.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'For certain premium services we process payments via certified processors such as Stripe and PayPal, which comply with PCI DSS standards. We do not store credit card details on our servers; all sensitive data is handled by specialized providers.'
              : 'Pentru anumite servicii premium, procesăm plăți prin intermediul procesatorilor certificați Stripe și PayPal, care respectă standardele PCI DSS pentru securitatea datelor financiare. Nu stocăm informații despre carduri de credit pe serverele noastre, toate datele sensibile fiind gestionate exclusiv de furnizorii specializați.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Disputes and Resolution' : 'Dispute și rezolvarea conflictelor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'In user disputes we provide an internal reporting and mediation system, but final responsibility for resolving disputes rests with the parties involved. For high-value transactions we recommend written contracts and secure payment methods that provide protection for both parties.'
              : 'În cazul disputelor între utilizatori, oferim un sistem intern de raportare și mediere, însă responsabilitatea finală pentru rezolvarea conflictelor revine părților implicate. Pentru tranzacții de valoare mare, recomandăm utilizarea de contracte scrise și metode de plată securizate care oferă protecție pentru ambele părți.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We may suspend accounts involved in repeated or serious disputes, but are not legally obligated to arbitrate commercial disputes between users. For matters involving potential criminal activity we cooperate with competent authorities as required by law.'
              : 'Putem interveni prin suspendarea temporară a conturilor implicate în dispute repetate sau grave, dar nu avem obligația legală de a arbitra conflictele comerciale dintre utilizatori. Pentru situații care implică posibile infracțiuni, cooperăm cu autoritățile competente conform cerințelor legale.'
          }</ThemedText>
        </View>

        {/* Section 6 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '6. Intellectual Property' : '6. Proprietate intelectuală'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Platform Rights' : 'Drepturile platformei'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'The source code, design, logo, trademarks and all technical elements of the Hobbiz platform are protected by copyright and intellectual property rights. Unauthorized use of these elements, including copying code or replicating design, constitutes an infringement of our rights and may be subject to legal action.'
              : 'Codul sursă, designul, logo-ul, mărcile comerciale și toate elementele tehnice ale platformei Hobbiz sunt protejate prin drepturi de autor și proprietate intelectuală. Utilizarea neautorizată a acestor elemente, inclusiv copierea codului sau replicarea designului, constituie o încălcare a drepturilor noastre și poate fi urmărită legal.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Open-source technologies used (React.js, Node.js, MongoDB) are subject to their respective licenses, but our specific implementation and system architecture are proprietary. Reverse engineering or attempts to replicate functionality are prohibited.'
              : 'Tehnologiile folosite (React.js, Node.js, MongoDB) sunt open-source și utilizate conform licențelor respective, însă implementarea specifică și arhitectura sistemului nostru sunt proprietate exclusivă. Interzicerea reverse engineering-ului sau tentativelor de replicare a funcționalităților este strict aplicată.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'User Content' : 'Conținutul utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users retain ownership of the content they publish (photos, descriptions, reviews), but grant Hobbiz a non-exclusive, transferable, sublicensable license to display, modify and distribute that content for the purpose of providing the Platform services.'
              : 'Utilizatorii rămân proprietarii conținutului pe care îl publică (fotografii, descrieri, recenzii), dar acordă Hobbiz o licență neexclusivă, transferabilă și sub-licențiabilă pentru a afișa, modifica și distribui acest conținut în scopul furnizării serviciilor platformei.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users are responsible for ensuring they hold all necessary rights to the content they publish and do not infringe third party copyrights. For valid DMCA notices we will promptly remove infringing content and take action against repeat infringers.'
              : 'Este responsabilitatea utilizatorilor să se asigure că dețin toate drepturile necesare pentru conținutul publicat și că nu încalcă drepturile de autor ale terților. În cazul reclamațiilor DMCA valide, vom elimina prompt conținutul problematic și vom lua măsurile necesare împotriva conturilor care încalcă în mod repetat drepturile de autor.'
          }</ThemedText>
        </View>

        {/* Section 7 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '7. Security and Data Protection' : '7. Securitate și protecția datelor'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Technical Security Measures' : 'Măsuri de securitate tehnice'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We implement advanced security measures: SSL/TLS encryption for all communications, secure password hashing (bcrypt), protections against CSRF and XSS attacks, configured firewalls and continuous monitoring for suspicious activity. We regularly update components to address vulnerabilities.'
              : 'Implementăm măsuri avansate de securitate informatică: criptarea SSL/TLS pentru toate comunicațiile, hashing-ul securizat al parolelor cu algoritmi bcrypt, protecție împotriva atacurilor CSRF și XSS, firewall-uri configurate și monitorizare constantă pentru activități suspecte. Actualizăm regulat toate componentele software pentru a corecta vulnerabilitățile de securitate.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Data is stored in SOC 2 Type II certified data centers with daily backups and geographic redundancy. Access to production systems is tightly controlled with multi-factor authentication and full administrative activity logging.'
              : 'Datele sunt stocate în centre de date certificate SOC 2 Type II, cu backup-uri automate zilnice și sisteme de redundanță geografică. Accesul la sistemele de producție este strict controlat prin autentificare cu doi factori și jurnalizarea completă a activităților administrative.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'User Responsibilities' : 'Responsabilitățile utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users must keep credentials confidential, use strong unique passwords, and notify us immediately if account compromise is suspected. We are not responsible for losses due to user negligence in account security.'
              : 'Utilizatorii trebuie să păstreze confidențialitatea credențialelor de acces, să folosească parole complexe și unice și să ne notifice imediat în cazul suspiciunii că contul a fost compromis. Nu suntem responsabili pentru pierderi rezultate din neglijența utilizatorilor în păstrarea securității conturilor.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Enabling two-factor authentication is strongly recommended, especially for accounts handling frequent financial transactions. We offer multiple options: SMS, TOTP apps (Google Authenticator, Authy), and FIDO2 hardware keys.'
              : 'Activarea autentificării cu doi factori este puternic recomandată pentru toate conturile, în special pentru cele care gestionează tranzacții financiare frecvente. Oferim opțiuni multiple: SMS, aplicații TOTP (Google Authenticator, Authy) și chei hardware compatibile FIDO2.'
          }</ThemedText>
        </View>

        {/* Section 8 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '8. Limitation of Liability' : '8. Limitări de răspundere'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Disclaimers' : 'Excluderi de răspundere'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Hobbiz is not responsible for damages resulting from transactions between users, data loss due to hardware or software failures, temporary service interruptions for technical reasons, fraudulent actions by users or third parties, or consequences of improper use of the Platform.'
              : 'Hobbiz nu este responsabil pentru: daunele rezultate din tranzacțiile între utilizatori, pierderea de date din cauza defecțiunilor hardware sau software, întreruperile temporare ale serviciilor din motive tehnice, acțiunile frauduloase ale utilizatorilor sau terților sau consecințele utilizării inadecvate a platformei.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'In no event will our total liability exceed the amount of fees paid by the user for premium services in the last 12 months. This limitation applies regardless of the nature of the claim: contractual, tortious, or otherwise.'
              : 'În niciun caz răspunderea noastră totală nu va depăși valoarea taxelor plătite de utilizator pentru serviciile premium în ultimele 12 luni. Această limitare se aplică indiferent de natura reclamației: contractuală, delictuală sau din orice altă cauză legală.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Force Majeure' : 'Forță majoră'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We are not liable for delays or inability to perform due to force majeure events: natural disasters, wars, large-scale cyber attacks, restrictive government regulations, or other events beyond our reasonable control.'
              : 'Nu suntem responsabili pentru întârzieri sau imposibilitatea de a îndeplini obligațiile din cauza evenimentelor de forță majoră: dezastre naturale, războaie, atacuri cibernetice la scară largă, reglementări guvernamentale restrictive sau alte evenimente în afara controlului nostru rezonabil.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'In such situations we will use reasonable efforts to minimize impact and restore services as quickly as possible. Users will be promptly informed of major outages via our official communication channels.'
              : 'În astfel de situații, vom depune toate eforturile rezonabile pentru a minimiza impactul asupra utilizatorilor și pentru a restabili serviciile cât mai rapid posibil. Utilizatorii vor fi informați prompt despre orice întreruperi majore prin canalele noastre oficiale de comunicare.'
          }</ThemedText>
        </View>

        {/* Section 9 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '9. Changes and Termination of Services' : '9. Modificări și încetarea serviciilor'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Changes to the Terms' : 'Modificări ale termenilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We reserve the right to modify these Terms to reflect changes in services, legal requirements, or business practices. Users will be notified at least 30 days before the effective date of material changes by email and in-platform notifications.'
              : 'Ne rezervăm dreptul de a modifica acești termeni și condiții pentru a reflecta schimbările în serviciile oferite, cerințele legale sau practicile comerciale. Utilizatorii vor fi notificați cu minimum 30 de zile înainte de intrarea în vigoare a modificărilor majore prin email și notificări în platformă.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Continued use of the services after changes become effective constitutes acceptance of the new Terms. Users who disagree may close their accounts and stop using the Platform without additional penalties.'
              : 'Continuarea utilizării serviciilor după intrarea în vigoare a modificărilor constituie acceptarea noilor termeni. Utilizatorii care nu sunt de acord cu modificările pot închide conturile și înceta utilizarea platformei fără penalități suplimentare.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Suspension and Account Closure' : 'Suspendarea și închiderea conturilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We may suspend or close accounts that violate these Terms, engage in fraudulent activities, negatively affect other users, or present security risks. Depending on severity, we may issue warnings, temporary restrictions, or permanent closure.'
              : 'Putem suspenda sau închide conturile care încalcă acești termeni, participă la activități frauduloase, afectează negativ experiența altor utilizatori sau prezintă riscuri de securitate pentru platformă. În funcție de gravitatea încălcării, putem aplica avertismente, restricții temporare sau închiderea definitivă.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Users may voluntarily close their accounts at any time via platform settings. Upon account closure, personal data will be anonymized or deleted in accordance with our privacy policy, and active listings will be removed.'
              : 'Utilizatorii pot închide voluntar conturile oricând prin setările platformei. La închiderea contului, datele personale vor fi anonimizate sau șterse conform politicii noastre de confidențialitate, iar anunțurile active vor fi eliminate automat.'
          }</ThemedText>
        </View>

        {/* Section 10 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '10. Governing Law and Jurisdiction' : '10. Legea aplicabilă și jurisdicția'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Legal Framework' : 'Cadrul legal'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'These Terms are governed by Romanian law and interpreted accordingly. Disputes arising from Platform use will be resolved by the competent courts in Romania, and users waive any objection to territorial jurisdiction.'
              : 'Acești termeni și condiții sunt guvernați de legea română și se interpretează conform acesteia. Toate disputele rezultate din utilizarea platformei vor fi soluționate de instanțele competente din România, utilizatorii renunțând la orice pretenție de incompetență teritorială.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'For users in the European Union, we comply with the Digital Services Act (DSA) and relevant consumer rights directives. Consumers may benefit from alternative dispute resolution procedures under applicable EU rules.'
              : 'Pentru utilizatorii din Uniunea Europeană, respectăm prevederile Regulamentului Digital Services Act (DSA) și ale Directivei privind Drepturile Consumatorilor. Consumatorii pot beneficia de proceduri alternative de soluționare a disputelor conform reglementărilor UE aplicabile.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Regulatory Compliance' : 'Conformitate cu reglementările'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'The Platform complies with GDPR for data protection, PSD2 requirements for payment services, e-commerce regulations and other applicable Romanian and EU laws. We cooperate with regulators and promptly implement legal requirements.'
              : 'Platforma respectă prevederile GDPR pentru protecția datelor, reglementările PSD2 pentru serviciile de plată, cerințele de e-commerce conform OUG 34/2014 și alte acte normative relevante din România și UE. Cooperăm cu autoritățile de reglementare și aplicăm prompt orice cerințe legale noi.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'For consumer protection issues, users may contact the Romanian National Authority for Consumer Protection (ANPC) or use the EU Online Dispute Resolution (ODR) platform.'
              : 'Pentru problemele specifice protecției consumatorilor, utilizatorii se pot adresa ANPC (Autoritatea Națională pentru Protecția Consumatorilor) sau pot folosi platforma europeană ODR pentru soluționarea online a disputelor comerciale.'
          }</ThemedText>
        </View>

        {/* Section 11 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{locale === 'en' ? '11. Contact and Support' : '11. Contact și asistență'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Contact Information' : 'Informații de contact'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? <>For questions about these Terms, complaints or support requests you can contact us at the official email <ThemedText style={styles.strong}>legal@hobbiz.ro</ThemedText>, via the in-platform contact form, or by postal mail to our registered office address.</>
              : <>Pentru întrebări despre acești termeni și condiții, reclamații sau solicitări de asistență, ne puteți contacta prin următoarele modalități: email oficial la <ThemedText style={styles.strong}>legal@hobbiz.ro</ThemedText>, formularul de contact din platformă sau poșta tradițională la adresa sediului social înregistrat.</>
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'Our support team typically responds within 24-48 hours for standard inquiries and up to 72 hours for complex cases requiring technical or legal investigation. For security emergencies we provide prioritized support channels.'
              : 'Echipa noastră de asistență răspunde în general în termen de 24-48 de ore pentru întrebările standard și în maximum 72 de ore pentru problemele complexe care necesită investigații tehnice sau legale. Pentru urgențe de securitate, oferim suport accelerat prin canale prioritare.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{locale === 'en' ? 'Complaint Procedure' : 'Procedura de reclamații'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? <>Complaints can be submitted via the integrated platform system, which allows tracking and automated notifications. For serious matters, direct email to <ThemedText style={styles.strong}>complaints@hobbiz.ro</ThemedText> is also accepted.</>
              : <>Reclamațiile se pot depune prin sistemul integrat din platformă, care permite urmărirea statusului și primirea de notificări automate. Pentru situații grave, acceptăm și comunicarea directă prin email la adresa dedicată <ThemedText style={styles.strong}>complaints@hobbiz.ro</ThemedText>.</>
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            locale === 'en'
              ? 'We investigate complaints impartially and transparently, respecting the rights of all parties. Investigation results are communicated in writing and for complex cases we provide detailed explanations of measures taken.'
              : 'Investigăm toate reclamațiile într-un mod imparțial și transparent, respectând drepturile tuturor părților implicate. Rezultatele investigațiilor sunt comunicate în scris, iar pentru cazurile complexe oferim explicații detaliate despre măsurile luate.'
          }</ThemedText>
        </View>

        {/* Footer notice */}
        <View style={[styles.footerNotice, { backgroundColor: footerBg, borderLeftColor: WEB_PRIMARY }]}>          
          <ThemedText style={[styles.footerParagraph, { color: isDarkMode ? '#888' : '#64748b' }]}>{
            locale === 'en'
              ? 'This document was updated on September 5, 2025 and is effective immediately for all Hobbiz users. For prior versions of these Terms please contact us at legal@hobbiz.ro.'
              : 'Documentul a fost actualizat la data de 5 septembrie 2025 și intră în vigoare imediat pentru toți utilizatorii platformei Hobbiz. Pentru versiunile anterioare ale acestor termeni, vă rugăm să ne contactați la adresa legal@hobbiz.ro.'
          }</ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 80, gap: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700' },

  desktopHeader: { marginTop: 40, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  headerIcon: { fontSize: 54, marginBottom: 16, zIndex: 2 },
  headerH1: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5, color: '#fff', zIndex: 2, marginBottom: 12 },
  headerDate: { fontSize: 15, color: 'rgba(255,255,255,0.9)', zIndex: 2 },
  radialOverlay: { position: 'absolute', top: -120, right: -120, width: 360, height: 360, backgroundColor: 'rgba(252,194,46,0.15)', borderRadius: 360, transform: [{ rotate: '30deg' }] },

  introCard: { borderRadius: 20, padding: 28, backgroundColor: WEB_ACCENT, shadowColor: WEB_ACCENT_GRAD_TO, shadowOpacity: 0.3, shadowRadius: 32, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  introIcon: { fontSize: 30, marginTop: 2 },
  introStrong: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 10 },
  introParagraph: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.95)' },

  sectionCard: { borderRadius: 16, padding: 28, marginTop: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 4 } },
  h2: { fontSize: 26, fontWeight: '700', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: WEB_ACCENT, alignSelf: 'flex-start' },
  h3: { fontSize: 18, fontWeight: '600', marginTop: 28, marginBottom: 12, paddingLeft: 20, position: 'relative' },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 14, textAlign: 'left' },
  strong: { fontWeight: '600' },
  footerNotice: { marginTop: 16, padding: 24, borderRadius: 16, borderLeftWidth: 4 },
  footerParagraph: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },
});
