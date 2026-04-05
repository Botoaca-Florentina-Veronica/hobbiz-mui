import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';
import { useLocale } from '../../src/context/LocaleContext';
import { normalizeLocale } from '../../src/i18n';

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
  const { locale } = useLocale();
  const normalizedLocale = normalizeLocale(locale);
  const isEn = normalizedLocale === 'en';
  const isEs = normalizedLocale === 'es';

  const isDarkMode = isDark;
  const surface = isDarkMode ? '#1e1e1e' : tokens.colors.surface;
  const footerBg = isDarkMode ? '#1a1a1a' : '#f8fafc';
  const bodyColor = isDarkMode ? '#b0b0b0' : WEB_TEXT_BODY;
  const headingColor = isDarkMode ? WEB_ACCENT : WEB_PRIMARY;
  const subHeadingColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;
  const strongColor = isDarkMode ? '#e0e0e0' : WEB_TEXT_DARK;

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>      
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
          <ThemedText style={[styles.pageTitle, { color: tokens.colors.text }]}>
            {isEn ? 'Terms and Conditions' : isEs ? 'Terminos y condiciones' : 'Termeni și condiții'}
          </ThemedText>
        </View>

        {/* Hero Header (desktop style is hidden on web mobile, we'll show compact) */}
        <View style={[styles.desktopHeader, { backgroundColor: WEB_PRIMARY }]}>          
          <View style={styles.headerIconCircle}>
            <ThemedText style={styles.headerIcon}>📝</ThemedText>
          </View>
          <ThemedText style={styles.headerH1}>{isEn ? 'Terms and Conditions' : isEs ? 'Terminos y condiciones' : 'Termeni și condiții'}</ThemedText>
          <ThemedText style={styles.headerDate}>{isEn ? 'Last updated: December 13, 2025' : isEs ? 'Ultima actualizacion: 13 de diciembre de 2025' : 'Ultima actualizare: 13 decembrie 2025'}</ThemedText>
          <View style={styles.radialOverlay} />
        </View>

        {/* Intro Gradient Card (fallback without expo-linear-gradient) */}
        <View
          style={[styles.introCard, { backgroundColor: WEB_ACCENT }]}
        >
          <View style={styles.introRow}>
            <ThemedText style={styles.introIcon}>ℹ️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.introStrong}>{isEn ? 'Hobbiz Platform Terms of Use' : isEs ? 'Terminos de uso de la plataforma Hobbiz' : 'Acordul de utilizare a platformei Hobbiz'}</ThemedText>
              <ThemedText style={styles.introParagraph}>
                {isEn
                  ? 'Hobbiz is a free community platform operated by an individual in Romania. By accessing and using this platform, you agree to these terms and acknowledge that services are provided "as is" without warranties. Please read these provisions carefully before creating an account.'
                  : isEs
                    ? 'Hobbiz es una plataforma comunitaria gratuita operada por una persona en Rumania. Al acceder y usar esta plataforma, aceptas estos terminos y reconoces que los servicios se ofrecen "tal cual" y sin garantias. Por favor lee estas condiciones con atencion antes de crear una cuenta.'
                    : 'Hobbiz este o platformă comunitară gratuită administrată de o persoană fizică din România. Prin accesarea și utilizarea acestei platforme, acceptați acești termeni și recunoașteți că serviciile sunt oferite "în forma actuala" fără garanții. Vă rugăm să citiți cu atenție aceste prevederi înainte de a crea un cont.'}
              </ThemedText>
            </View>
          </View>
  </View>

        {/* Section 1 - Agreement to Terms */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '1. Agreement to Terms' : isEs ? '1. Aceptacion de los terminos' : '1. Acord cu privire la termeni'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}> {
            isEn
              ? 'By accessing, creating an account, or otherwise using the Hobbiz platform (the "Platform"), you acknowledge that you have read, understand, and agree to be bound by these Terms and Conditions (the "Terms"). This agreement constitutes an electronic contract between you and the operator of the Platform. If you do not agree with these Terms, you are expressly prohibited from using the Platform and should delete your account if one has been created.'
              : isEs
                ? 'Al acceder, crear una cuenta o usar de cualquier forma la plataforma Hobbiz (la "Plataforma"), reconoces que has leido, entendido y aceptado estos Terminos y Condiciones (los "Terminos"). Este acuerdo constituye un contrato electronico entre ti y el operador de la Plataforma. Si no estas de acuerdo con estos Terminos, tienes prohibido usar la Plataforma y debes eliminar tu cuenta si ya fue creada.'
                : 'Prin accesarea, crearea unui cont sau utilizarea în orice mod a platformei Hobbiz ("Platforma"), declarați că ați citit, ați înțeles și că sunteți de acord să respectați toți acești termeni și condiții ("Termeni"). Acest acord constituie un contract încheiat în format electronic între dumneavoastră și operatorul Platformei. Dacă nu sunteți de acord cu acești Termeni, atunci vă este interzis în mod expres să utilizați Platforma și, dacă ați creat deja un cont, să îl ștergeți.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'If you use the Platform on behalf of a legal entity, you represent and warrant that you have the authority to accept these Terms on behalf of that entity. "You" will include the entity you represent. You are responsible for compliance with these Terms both personally and for any person who uses your account.'
              : isEs
                ? 'Si usas la Plataforma en nombre de una entidad legal, declaras y garantizas que tienes autoridad para aceptar estos Terminos en nombre de dicha entidad. "Tu" incluira a la entidad que representas. Eres responsable del cumplimiento de estos Terminos tanto personalmente como por cualquier persona que use tu cuenta.'
                : 'În cazul în care utilizați Platforma în numele unei persoane juridice, declarați și garantați că aveți autoritatea legală de a accepta acești Termeni în numele respectivei entități, iar termenul "dumneavoastră" va include entitatea pe care o reprezentați. Sunteți responsabil(ă) de respectarea acestor Termeni atât personal, cât și pentru orice persoană care utilizează contul dumneavoastră.'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Incorporated Documents' : isEs ? 'Documentos incorporados' : 'Documente parte integrantă'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'The Terms include and refer to our related policies governing specific aspects of Platform use: the Privacy Policy, Cookie Policy, and any community rules or procedures published in the app/website. In case of any inconsistency, service-specific provisions may prevail over these general clauses.'
              : isEs
                ? 'Los Terminos incluyen y hacen referencia a nuestras politicas relacionadas que regulan aspectos especificos del uso de la Plataforma: la Politica de Privacidad, la Politica de Cookies y cualquier regla o procedimiento publicado en la app/web. En caso de conflicto, las disposiciones especificas del servicio pueden prevalecer sobre estas clausulas generales.'
                : 'Termenii includ și fac trimitere la politicile noastre conexe, care reglementează aspecte specifice ale utilizării Platformei: Politica de Confidențialitate, Politica de Cookie-uri și orice reguli ale comunității sau proceduri publicate în aplicație/website. În măsura oricărei neconcordanțe, prevederile specifice serviciului utilizat pot prevala asupra prezentelor clauze generale.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Security practices: We implement industry-standard protections including encrypting chat messages at rest (AES-256-CBC with per-message IV) and secure password reset workflows (MailerSend 6-digit verification codes, valid for 15 minutes).'
              : isEs
                ? 'Practicas de seguridad: Implementamos protecciones estandar de la industria, incluyendo cifrado de mensajes de chat en reposo (AES-256-CBC con IV por mensaje) y flujos seguros de restablecimiento de contrasena (codigos de verificacion MailerSend de 6 digitos, validos por 15 minutos).'
                : 'Practicile de securitate: Implementăm protecții standard din industrie, inclusiv criptarea mesajelor de chat în repaus (AES-256-CBC cu IV per mesaj) și proceduri sigure de resetare a parolei (coduri de verificare MailerSend de 6 cifre, valabile 15 minute).'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Updates to the Terms' : isEs ? 'Actualizaciones de los terminos' : 'Actualizări ale Termenilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We may update these Terms periodically to reflect legal or service changes. We will notify users of material changes in accordance with the "Changes and Termination" section. Continued use of the Platform after the effective date of any changes constitutes acceptance of the updated version. If you disagree with the changes, you must stop using the services.'
              : isEs
                ? 'Podemos actualizar estos Terminos periodicamente para reflejar cambios legales o del servicio. Notificaremos a los usuarios sobre cambios materiales segun la seccion "Cambios y Terminacion". El uso continuo de la Plataforma despues de la fecha efectiva implica aceptacion de la version actualizada. Si no estas de acuerdo, debes dejar de usar los servicios.'
                : 'Putem modifica periodic acești Termeni pentru a reflecta schimbări legislative sau ale serviciilor. Vom notifica utilizatorii în caz de modificări materiale, conform secțiunii „Modificări și încetarea serviciilor”. Continuarea utilizării Platformei după data intrării în vigoare a modificărilor constituie acceptarea fără rezerve a versiunii actualizate. Dacă nu sunteți de acord cu modificările, trebuie să încetați utilizarea serviciilor.'
          }</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Explicit Consent' : isEs ? 'Consentimiento expreso' : 'Consimțământul explicit'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Ticking an acceptance box, clicking the "Create account" button, or continued use of the Platform constitutes your express consent to comply with these Terms and associated policies. We recommend saving or printing a copy of the current version for your records.'
              : isEs
                ? 'Marcar una casilla de aceptacion, pulsar el boton "Crear cuenta" o el uso continuo de la Plataforma constituye tu consentimiento expreso para cumplir estos Terminos y politicas asociadas. Recomendamos guardar o imprimir una copia de la version actual para tus registros.'
                : 'Bifarea unei căsuțe de acceptare, apăsarea butonului „Creează cont”, respectiv utilizarea continuă a Platformei, reprezintă consimțământul dumneavoastră expres cu privire la respectarea acestor Termeni și a politicilor asociate. Vă recomandăm să salvați sau să tipăriți o copie a versiunii curente pentru arhiva personală.'
          }</ThemedText>
        </View>

        {/* Section 2 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '2. Definitions and Interpretation' : isEs ? '2. Definiciones e interpretacion' : '2. Definiții și interpretare'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn ? (
              <>
                In these Terms, the following definitions apply: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Platform&quot;</ThemedText> refers to the Hobbiz website and all associated mobile applications; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Services&quot;</ThemedText> includes all functionality provided through the Platform, including posting listings, search, user communication and payment processing; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;User&quot;</ThemedText> means any natural or legal person who accesses or uses the Platform; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Content&quot;</ThemedText> includes text, images, video, data, and other materials uploaded to the Platform.
              </>
            ) : isEs ? (
              <>
                En estos Terminos se aplican las siguientes definiciones: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Plataforma&quot;</ThemedText> se refiere al sitio web Hobbiz y a todas las aplicaciones moviles asociadas; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Servicios&quot;</ThemedText> incluye todas las funcionalidades ofrecidas por la Plataforma, incluyendo publicar anuncios, busqueda, comunicacion entre usuarios y procesamiento de pagos; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Usuario&quot;</ThemedText> significa cualquier persona fisica o juridica que accede o usa la Plataforma; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Contenido&quot;</ThemedText> incluye texto, imagenes, video, datos y otros materiales subidos a la Plataforma.
              </>
            ) : (
              <>În cadrul acestor termeni și condiții, următoarele definiții se aplică: <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Platforma&quot;</ThemedText> se referă la website-ul Hobbiz și toate aplicațiile mobile asociate; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Servicii&quot;</ThemedText> include toate funcționalitățile oferite prin platformă, inclusiv publicarea anunțurilor, căutarea, comunicarea între utilizatori și procesarea plăților; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Utilizator&quot;</ThemedText> desemnează orice persoană fizică sau juridică care accesează sau folosește platforma; <ThemedText style={[styles.strong, { color: strongColor }]}>&quot;Conținut&quot;</ThemedText> include texte, imagini, video, date și alte materiale încărcate pe platformă.</>
            )
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Hobbiz operates as a free digital community platform connecting people who wish to share, exchange, or trade various products and services. I, as the individual administrator, am not the owner or seller of listed items but facilitate interaction between users. The platform uses modern web technologies including React.js, Node.js and MongoDB.'
              : isEs
                ? 'Hobbiz funciona como una plataforma comunitaria digital gratuita que conecta a personas que desean compartir, intercambiar o comerciar productos y servicios. Yo, como administrador individual, no soy propietario ni vendedor de los elementos listados, sino que facilito la interaccion entre usuarios. La plataforma usa tecnologias web modernas incluyendo React.js, Node.js y MongoDB.'
                : 'Platforma Hobbiz funcționează ca o platformă comunitară digitală gratuită care conectează persoane interesate să partajeze, să facă schimb sau să tranzacționeze produse și servicii diverse. Eu, ca administrator individual, nu sunt proprietarul sau vânzătorul produselor listate, ci facilitez interacțiunea între utilizatori. Platforma folosește tehnologii web moderne, inclusiv React.js, Node.js și baze de date MongoDB.'
          }</ThemedText>
        </View>

        {/* Section 3 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '3. Eligibility and Registration' : isEs ? '3. Elegibilidad y registro' : '3. Eligibilitate și înregistrare'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Age and Legal Capacity' : isEs ? 'Edad y capacidad legal' : 'Cerințe de vârstă și capacitate juridică'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'To use Hobbiz services you must be at least 18 years old and have full legal capacity under applicable law. Minors aged 16-17 may use the Platform only with the explicit consent of a parent or legal guardian and under their supervision.'
              : isEs
                ? 'Para usar los servicios de Hobbiz debes tener al menos 18 anos y plena capacidad legal segun la ley aplicable. Los menores de 16-17 anos solo pueden usar la Plataforma con el consentimiento explicito de un padre o tutor y bajo su supervision.'
                : 'Pentru a utiliza serviciile Hobbiz, trebuie să aveți minimum 18 ani și să dețineți capacitatea juridică deplină conform legislației românești. Minorilor cu vârsta cuprinsă între 16-18 ani li se permite utilizarea platformei doar cu consimțământul explicit al părinților sau reprezentanților legali și sub supravegherea acestora.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Legal entities may use the Platform through authorized representatives, who are responsible for all actions taken on behalf of the organization. We may verify registration documents for business accounts and reserve the right to request additional documentation to validate identity.'
              : isEs
                ? 'Las entidades legales pueden usar la Plataforma mediante representantes autorizados, quienes son responsables de todas las acciones realizadas en nombre de la organizacion. Podemos verificar documentos de registro para cuentas business y nos reservamos el derecho de solicitar documentacion adicional para validar la identidad.'
                : 'Persoanele juridice pot utiliza platforma prin intermediul reprezentanților autorizați, care răspund pentru toate acțiunile întreprinse în numele organizației. Verificăm documentele de înregistrare pentru conturile business și ne rezervăm dreptul de a solicita documente suplimentare pentru validarea identității.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Registration Process' : isEs ? 'Proceso de registro' : 'Procesul de înregistrare'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Creating an account requires providing accurate and complete information: real name, a valid email address, and a functional phone number. False or misleading information constitutes a breach of these Terms and may result in suspension or account termination without notice.'
              : isEs
                ? 'Crear una cuenta requiere proporcionar informacion precisa y completa: nombre real, correo valido y un numero de telefono funcional. La informacion falsa o engañosa constituye una violacion de estos Terminos y puede resultar en suspension o cierre de la cuenta sin aviso.'
                : 'Crearea unui cont necesită furnizarea unor informații exacte și complete: nume real, adresă de email validă și număr de telefon funcțional. Informațiile false sau înșelătoare constituie o încălcare a acestor termeni și pot duce la suspendarea sau închiderea contului fără preaviz.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We support multiple registration methods: email and password, Google OAuth 2.0, or other authorized identity providers. Each user may have a single active account; creating multiple accounts to avoid restrictions is prohibited.'
              : isEs
                ? 'Soportamos multiples metodos de registro: email y contrasena, Google OAuth 2.0 u otros proveedores autorizados. Cada usuario puede tener una sola cuenta activa; crear varias cuentas para evitar restricciones esta prohibido.'
                : 'Suportăm înregistrarea prin metode multiple: email și parolă, autentificare prin Google OAuth 2.0, sau prin alți furnizori de identitate autorizați. Fiecare utilizator poate deține un singur cont activ, iar crearea de conturi multiple pentru evitarea restricțiilor este strict interzisă.'
          }</ThemedText>
        </View>

        {/* Section 4 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '4. Platform Use and Listings' : isEs ? '4. Uso de la plataforma y anuncios' : '4. Utilizarea platformei și anunțuri'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Posting Listings' : isEs ? 'Publicacion de anuncios' : 'Publicarea anunțurilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users may post listings to sell new or second-hand items, offer services, rent goods, or conduct other lawful commercial transactions. Each listing must include an accurate and complete description, genuine unaltered photos, and a clear transparent price.'
              : isEs
                ? 'Los usuarios pueden publicar anuncios para vender productos nuevos o de segunda mano, ofrecer servicios, alquilar bienes u otras transacciones legales. Cada anuncio debe incluir una descripcion precisa y completa, fotos reales sin modificar y un precio claro y transparente.'
                : 'Utilizatorii pot publica anunțuri pentru vânzarea de produse noi sau second-hand, prestarea de servicii, închirierea de bunuri sau alte tranzacții comerciale legale. Fiecare anunț trebuie să conțină o descriere exactă și completă a produsului sau serviciului, fotografii reale și nemodificate și un preț corect și transparent.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Posting listings for counterfeit or pirated goods, illegal substances, weapons and ammunition, protected or illegally obtained animals, illegal or immoral services, adult content, or materials infringing copyright is strictly prohibited. We actively monitor content using automated algorithms and human moderation.'
              : isEs
                ? 'Esta estrictamente prohibido publicar anuncios de productos falsificados o piratas, sustancias ilegales, armas y municiones, animales protegidos u obtenidos ilegalmente, servicios ilegales o inmorales, contenido para adultos o materiales que infrinjan derechos de autor. Supervisamos el contenido con algoritmos automáticos y moderacion humana.'
                : 'Este strict interzisă publicarea de anunțuri pentru: produse contrafăcute sau piratate, substanțe interzise prin lege, arme și muniții, animale protejate sau obținute ilegal, servicii ilegale sau imorale, conținut pentru adulți sau materiale ce încalcă drepturile de autor. Monitorizăm activ conținutul prin algoritmi automatizați și moderare umană.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'User Responsibilities' : isEs ? 'Responsabilidades del usuario' : 'Responsabilitățile utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users are fully responsible for the content they post, the accuracy of information provided, and compliance with applicable laws. We reserve the right to remove any content that violates these Terms or applicable law without obligation to provide detailed explanations.'
              : isEs
                ? 'Los usuarios son totalmente responsables del contenido que publican, la exactitud de la informacion y el cumplimiento de las leyes aplicables. Nos reservamos el derecho de eliminar cualquier contenido que viole estos Terminos o la ley sin obligacion de dar explicaciones detalladas.'
                : 'Utilizatorii sunt integral responsabili pentru conținutul publicat, exactitatea informațiilor furnizate și respectarea tuturor legilor aplicabile. Ne rezervăm dreptul de a elimina orice conținut care încalcă acești termeni sau legislația în vigoare, fără obligația de a oferi explicații detaliate.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Communication between users must be respectful and professional. Harassment, threats, vulgar or discriminatory language, spam, and attempts at fraud will be sanctioned with temporary or permanent account restrictions.'
              : isEs
                ? 'La comunicacion entre usuarios debe ser respetuosa y profesional. El acoso, amenazas, lenguaje vulgar o discriminatorio, spam e intentos de fraude seran sancionados con restricciones temporales o permanentes de la cuenta.'
                : 'Comunicarea între utilizatori trebuie să se desfășoare într-un mod respectuos și profesional. Hărțuirea, amenințările, limbajul vulgar sau discriminatoriu, spam-ul și tentativele de fraudă vor fi sancționate prin restricții temporare sau permanente ale contului.'
          }</ThemedText>
        </View>

        {/* Section 5 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '5. User Interactions and Transactions' : isEs ? '5. Interacciones y transacciones' : '5. Interacțiuni utilizatori și tranzacții'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Platform Role' : isEs ? 'Rol de la plataforma' : 'Rolul platformei'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Hobbiz is a free platform that facilitates connections between users. I act as a technical intermediary and am not a party to any transactions or agreements between users. This is a community service provided without charge - no fees, commissions, or payment processing occurs through the platform.'
              : isEs
                ? 'Hobbiz es una plataforma gratuita que facilita conexiones entre usuarios. Actuo como intermediario tecnico y no soy parte de transacciones o acuerdos entre usuarios. Es un servicio comunitario sin costo: no hay tasas, comisiones ni procesamiento de pagos en la plataforma.'
                : 'Hobbiz este o platformă gratuită care facilitează conexiuni între utilizatori. Acționez ca intermediar tehnologic și nu sunt parte în nicio tranzacție sau acord între utilizatori. Acesta este un serviciu comunitar oferit fără cost - nu se percep taxe, comisioane sau procesare de plăți prin platformă.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor, fontStyle: 'italic' }]}>{
            isEn
              ? 'Disclaimer: I do not guarantee the quality, authenticity, legality, or safety of items/services listed by users. All transactions and arrangements between users are entirely their own responsibility. Use this platform at your own risk and exercise appropriate caution when dealing with other users.'
              : isEs
                ? 'Aviso: No garantizo la calidad, autenticidad, legalidad ni seguridad de los productos/servicios listados por usuarios. Todas las transacciones y acuerdos entre usuarios son su responsabilidad. Usa esta plataforma bajo tu propio riesgo y con la debida precaucion.'
                : 'Disclaimer: Nu garantez calitatea, autenticitatea, legalitatea sau siguranța articolelor/serviciilor listate de utilizatori. Toate tranzacțiile și aranjamentele între utilizatori sunt integral responsabilitatea lor. Folosiți această platformă pe propriul risc și exercitați prudență adecvată când interacționați cu alți utilizatori.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Disputes and Resolution' : isEs ? 'Disputas y resolucion' : 'Dispute și rezolvarea conflictelor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users are solely responsible for resolving any disputes arising from their interactions. I provide a basic reporting system for serious violations of these Terms, but I am not obligated to mediate, arbitrate, or resolve conflicts between users. For legal disputes, users should seek appropriate legal counsel and resolution through proper legal channels.'
              : isEs
                ? 'Los usuarios son los unicos responsables de resolver disputas que surjan de sus interacciones. Ofrezco un sistema basico de reportes para violaciones graves, pero no estoy obligado a mediar, arbitrar ni resolver conflictos entre usuarios. Para disputas legales, los usuarios deben buscar asesoria juridica adecuada.'
                : 'Utilizatorii sunt singurii responsabili pentru rezolvarea oricăror dispute ce decurg din interacțiunile lor. Ofer un sistem de bază de raportare pentru încălcări grave ale acestor Termeni, dar nu sunt obligat să mediez, să arbitrez sau să rezolv conflictele între utilizatori. Pentru dispute legale, utilizatorii ar trebui să apeleze la consiliere juridică adecvată și rezolvare prin canale legale corespunzătoare.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'I may suspend or terminate accounts involved in repeated violations, harassment, fraud attempts, or other serious misconduct, but this is at my sole discretion and does not create any legal obligations or liability on my part.'
              : isEs
                ? 'Puedo suspender o cerrar cuentas involucradas en violaciones repetidas, acoso, intentos de fraude u otras conductas graves, pero esto queda a mi exclusiva discrecion y no crea obligaciones legales de mi parte.'
                : 'Pot suspenda sau închide conturi implicate în încălcări repetate, hărțuire, tentative de fraudă sau alte comportamente grave neadecvate, dar aceasta este la discreția mea exclusivă și nu creează nicio obligație legală sau răspundere din partea mea.'
          }</ThemedText>
        </View>

        {/* Section 6 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '6. Intellectual Property' : isEs ? '6. Propiedad intelectual' : '6. Proprietate intelectuală'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Platform Rights' : isEs ? 'Derechos de la plataforma' : 'Drepturile platformei'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'The source code, design, logo, trademarks and all technical elements of the Hobbiz platform are protected by copyright and intellectual property rights. Unauthorized use of these elements, including copying code or replicating design, constitutes an infringement of our rights and may be subject to legal action.'
              : isEs
                ? 'El codigo fuente, diseno, logo, marcas y todos los elementos tecnicos de la plataforma Hobbiz estan protegidos por derechos de autor y propiedad intelectual. El uso no autorizado, incluido copiar codigo o replicar el diseno, infringe nuestros derechos y puede dar lugar a acciones legales.'
                : 'Codul sursă, designul, logo-ul, mărcile comerciale și toate elementele tehnice ale platformei Hobbiz sunt protejate prin drepturi de autor și proprietate intelectuală. Utilizarea neautorizată a acestor elemente, inclusiv copierea codului sau replicarea designului, constituie o încălcare a drepturilor noastre și poate fi urmărită legal.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Open-source technologies used (React.js, Node.js, MongoDB) are subject to their respective licenses, but our specific implementation and system architecture are proprietary. Reverse engineering or attempts to replicate functionality are prohibited.'
              : isEs
                ? 'Las tecnologias open-source usadas (React.js, Node.js, MongoDB) estan sujetas a sus licencias, pero nuestra implementacion y arquitectura son propietarias. Se prohibe la ingenieria inversa o intentos de replicar funcionalidades.'
                : 'Tehnologiile folosite (React.js, Node.js, MongoDB) sunt open-source și utilizate conform licențelor respective, însă implementarea specifică și arhitectura sistemului nostru sunt proprietate exclusivă. Interzicerea reverse engineering-ului sau tentativelor de replicare a funcționalităților este strict aplicată.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'User Content' : isEs ? 'Contenido del usuario' : 'Conținutul utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users retain ownership of the content they publish (photos, descriptions, reviews), but grant Hobbiz a non-exclusive, transferable, sublicensable license to display, modify and distribute that content for the purpose of providing the Platform services.'
              : isEs
                ? 'Los usuarios conservan la propiedad del contenido que publican (fotos, descripciones, reseñas), pero conceden a Hobbiz una licencia no exclusiva, transferible y sublicenciable para mostrar, modificar y distribuir ese contenido con el fin de prestar los servicios de la Plataforma.'
                : 'Utilizatorii rămân proprietarii conținutului pe care îl publică (fotografii, descrieri, recenzii), dar acordă Hobbiz o licență neexclusivă, transferabilă și sub-licențiabilă pentru a afișa, modifica și distribui acest conținut în scopul furnizării serviciilor platformei.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users are responsible for ensuring they hold all necessary rights to the content they publish and do not infringe third party copyrights. For valid DMCA notices we will promptly remove infringing content and take action against repeat infringers.'
              : isEs
                ? 'Los usuarios son responsables de asegurar que poseen los derechos necesarios sobre el contenido publicado y que no infringen derechos de terceros. Ante avisos DMCA validos, eliminaremos el contenido infractor y tomaremos medidas contra infractores recurrentes.'
                : 'Este responsabilitatea utilizatorilor să se asigure că dețin toate drepturile necesare pentru conținutul publicat și că nu încalcă drepturile de autor ale terților. În cazul reclamațiilor DMCA valide, vom elimina prompt conținutul problematic și vom lua măsurile necesare împotriva conturilor care încalcă în mod repetat drepturile de autor.'
          }</ThemedText>
        </View>

        {/* Section 7 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '7. Security and Data Protection' : isEs ? '7. Seguridad y proteccion de datos' : '7. Securitate și protecția datelor'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Technical Security Measures' : isEs ? 'Medidas de seguridad tecnicas' : 'Măsuri de securitate tehnice'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We implement advanced security measures: SSL/TLS encryption for all communications, secure password hashing (bcrypt), protections against CSRF and XSS attacks, configured firewalls and continuous monitoring for suspicious activity. We regularly update components to address vulnerabilities.'
              : isEs
                ? 'Implementamos medidas avanzadas de seguridad: cifrado SSL/TLS para todas las comunicaciones, hashing seguro de contrasenas (bcrypt), proteccion contra ataques CSRF y XSS, firewalls configurados y monitoreo continuo de actividad sospechosa. Actualizamos regularmente los componentes para corregir vulnerabilidades.'
                : 'Implementăm măsuri avansate de securitate informatică: criptarea SSL/TLS pentru toate comunicațiile, hashing-ul securizat al parolelor cu algoritmi bcrypt, protecție împotriva atacurilor CSRF și XSS, firewall-uri configurate și monitorizare constantă pentru activități suspecte. Actualizăm regulat toate componentele software pentru a corecta vulnerabilitățile de securitate.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We use Firebase (Firebase Cloud Messaging - FCM) for push notifications and Google Analytics (Firebase Analytics) for usage analytics. These providers may process certain data on our behalf (for example: push tokens and aggregated analytics). Please review their privacy policies for details. You can opt out of analytics via the app settings or by contacting team.hobbiz@gmail.com.'
              : isEs
                ? 'Usamos Firebase (Firebase Cloud Messaging - FCM) para notificaciones push y Google Analytics (Firebase Analytics) para analiticas de uso. Estos proveedores pueden procesar ciertos datos en nuestro nombre (por ejemplo: tokens push y analiticas agregadas). Revisa sus politicas de privacidad. Puedes desactivar analiticas en la app o contactando a team.hobbiz@gmail.com.'
                : 'Folosim Firebase (Firebase Cloud Messaging - FCM) pentru notificări push și Google Analytics (Firebase Analytics) pentru analizele de utilizare. Acești furnizori pot procesa anumite date în numele nostru (de exemplu: token-uri push și analize agregate). Vă rugăm să consultați politicile lor de confidențialitate pentru detalii. Puteți renunța la analize din setările aplicației sau contactând team.hobbiz@gmail.com.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Data is stored in SOC 2 Type II certified data centers with daily backups and geographic redundancy. Access to production systems is tightly controlled with multi-factor authentication and full administrative activity logging.'
              : isEs
                ? 'Los datos se almacenan en centros certificados SOC 2 Tipo II con backups diarios y redundancia geografica. El acceso a sistemas de produccion se controla con autenticacion multifactor y registro completo de actividad administrativa.'
                : 'Datele sunt stocate în centre de date certificate SOC 2 Type II, cu backup-uri automate zilnice și sisteme de redundanță geografică. Accesul la sistemele de producție este strict controlat prin autentificare cu doi factori și jurnalizarea completă a activităților administrative.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'User Responsibilities' : isEs ? 'Responsabilidades del usuario' : 'Responsabilitățile utilizatorilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users must keep credentials confidential, use strong unique passwords, and notify us immediately if account compromise is suspected. We are not responsible for losses due to user negligence in account security.'
              : isEs
                ? 'Los usuarios deben mantener sus credenciales confidenciales, usar contrasenas fuertes y notificar de inmediato si sospechan un compromiso de la cuenta. No somos responsables por perdidas debidas a negligencia del usuario.'
                : 'Utilizatorii trebuie să păstreze confidențialitatea credențialelor de acces, să folosească parole complexe și unice și să ne notifice imediat în cazul suspiciunii că contul a fost compromis. Nu suntem responsabili pentru pierderi rezultate din neglijența utilizatorilor în păstraerea securității conturilor.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Enabling two-factor authentication is strongly recommended, especially for accounts handling frequent financial transactions. We offer multiple options: SMS, TOTP apps (Google Authenticator, Authy), and FIDO2 hardware keys.'
              : isEs
                ? 'Se recomienda activar autenticacion de dos factores, especialmente en cuentas con transacciones frecuentes. Ofrecemos opciones: SMS, apps TOTP (Google Authenticator, Authy) y llaves FIDO2.'
                : 'Activarea autentificării cu doi factori este puternic recomandată pentru toate conturile, în special pentru cele care gestionează tranzacții financiare frecvente. Oferim opțiuni multiple: SMS, aplicații TOTP (Google Authenticator, Authy) și chei hardware compatibile FIDO2.'
          }</ThemedText>
        </View>

        {/* Section 8 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '8. Limitation of Liability and Disclaimers' : isEs ? '8. Limitacion de responsabilidad y exenciones' : '8. Limitări de răspundere și excluderi'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'AS-IS Service' : isEs ? 'Servicio "tal cual"' : 'Serviciu "În forma actuală"'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor, fontWeight: '600' }]}>{
            isEn
              ? 'THIS PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. AS AN INDIVIDUAL OPERATOR WITH LIMITED RESOURCES, I MAKE NO WARRANTIES REGARDING: accuracy, reliability, or completeness of content; uninterrupted or error-free operation; fitness for any particular purpose; or absence of viruses or harmful components.'
              : isEs
                ? 'ESTA PLATAFORMA SE OFRECE "TAL CUAL" Y "SEGUN DISPONIBILIDAD" SIN GARANTIAS DE NINGUN TIPO, EXPRESAS O IMPLICITAS. COMO OPERADOR INDIVIDUAL CON RECURSOS LIMITADOS, NO OFREZCO GARANTIAS SOBRE: exactitud, fiabilidad o integridad del contenido; funcionamiento ininterrumpido o sin errores; adecuacion a un proposito particular; o ausencia de virus o componentes dañinos.'
                : 'ACEASTĂ PLATFORMĂ ESTE OFERITĂ "ÎN FORMA ACTUALĂ" ȘI "DISPONIBILĂ AȘA CUM ESTE" FĂRĂ GARANȚII DE NICIUN FEL, EXPLICITE SAU IMPLICITE. CA OPERATOR INDIVIDUAL CU RESURSE LIMITATE, NU OFER GARANȚII PRIVIND: acuratețea, fiabilitatea sau completitudinea conținutului; funcționarea neîntreruptă sau fără erori; potrivirea pentru un anumit scop; sau absența virușilor sau componentelor dăunătoare.'
          }</ThemedText>
          
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'No Liability for User Content and Actions' : isEs ? 'Sin responsabilidad por contenido y acciones de usuarios' : 'Lipsă răspundere pentru conținut și acțiuni utilizatori'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'I am NOT responsible for: content posted by users (listings, messages, reviews, images); accuracy of user-provided information; transactions, agreements, or disputes between users; damages from fraudulent or illegal user activities; loss of data, revenue, or business opportunities; any direct, indirect, incidental, or consequential damages arising from platform use.'
              : isEs
                ? 'NO soy responsable por: contenido publicado por usuarios (anuncios, mensajes, resenas, imagenes); exactitud de la informacion proporcionada por usuarios; transacciones, acuerdos o disputas entre usuarios; danos por actividades fraudulentas o ilegales; perdida de datos, ingresos u oportunidades comerciales; danos directos, indirectos, incidentales o consecuentes derivados del uso de la plataforma.'
                : 'NU sunt responsabil pentru: conținutul postat de utilizatori (anunțuri, mesaje, recenzii, imagini); acuratețea informațiilor furnizate de utilizatori; tranzacții, acorduri sau dispute între utilizatori; daune cauzate de activități frauduloase sau ilegale ale utilizatorilor; pierderi de date, venituri sau oportunități de afaceri; orice daune directe, indirecte, accidentale sau consecutive ce rezultă din utilizarea platformei.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'This is a free community platform. Users acknowledge that I provide this service voluntarily without compensation and accept full responsibility for their own actions and interactions on the platform.'
              : isEs
                ? 'Esta es una plataforma comunitaria gratuita. Los usuarios reconocen que ofrezco este servicio de forma voluntaria sin compensacion y aceptan plena responsabilidad por sus acciones e interacciones en la plataforma.'
                : 'Aceasta este o platformă comunitară gratuită. Utilizatorii recunosc că ofer acest serviciu benevol fără compensație și acceptă răspunderea totală pentru propriile acțiuni și interacțiuni pe platformă.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Maximum Liability' : isEs ? 'Responsabilidad maxima' : 'Răspundere maximă'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'IN NO EVENT WILL MY TOTAL LIABILITY TO YOU EXCEED ZERO (0) EUR. Since this is a completely free service with no fees charged, users acknowledge there is no financial basis for claims against the platform administrator.'
              : isEs
                ? 'EN NINGUN CASO MI RESPONSABILIDAD TOTAL HACIA USTED SUPERARA CERO (0) EUR. Dado que es un servicio totalmente gratuito sin tarifas, los usuarios reconocen que no existe base financiera para reclamos contra el administrador de la plataforma.'
                : 'ÎN NICIUN CAZ RĂSPUNDEREA MEA TOTALĂ FAȚĂ DE DUMNEAVOASTRĂ NU VA DEPĂȘI ZERO (0) EUR. Fiind un serviciu complet gratuit fără taxe percepute, utilizatorii recunosc că nu există bază financiară pentru reclamații împotriva administratorului platformei.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Force Majeure' : isEs ? 'Fuerza mayor' : 'Forță majoră'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'I am not liable for delays or inability to perform due to events beyond reasonable control: natural disasters, wars, cyber attacks, government regulations, internet service provider failures, hosting provider outages, or other unforeseen circumstances. As an individual operator, I will make reasonable efforts to restore services when possible.'
              : isEs
                ? 'No soy responsable por retrasos o imposibilidad de cumplimiento debido a eventos fuera de control razonable: desastres naturales, guerras, ciberataques, regulaciones gubernamentales, fallas de proveedores de internet, interrupciones de hosting u otras circunstancias imprevistas. Como operador individual, realizare esfuerzos razonables para restablecer servicios cuando sea posible.'
                : 'Nu sunt responsabil pentru întârzieri sau imposibilitatea de a îndeplini obligațiile din cauza evenimentelor în afara controlului rezonabil: dezastre naturale, războaie, atacuri cibernetice, reglementări guvernamentale, defecțiuni ale furnizorilor de internet, întreruperi ale furnizorilor de găzduire sau alte circumstanțe neprevăzute. Ca operator individual, voi depune eforturi rezonabile pentru a restabili serviciile când este posibil.'
          }</ThemedText>
        </View>

        {/* Section 9 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '9. Changes and Termination of Services' : isEs ? '9. Cambios y terminacion de servicios' : '9. Modificări și încetarea serviciilor'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Changes to the Terms' : isEs ? 'Cambios en los terminos' : 'Modificări ale termenilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We reserve the right to modify these Terms to reflect changes in services, legal requirements, or business practices. Users will be notified at least 30 days before the effective date of material changes by email and in-platform notifications.'
              : isEs
                ? 'Nos reservamos el derecho de modificar estos Terminos para reflejar cambios en los servicios, requisitos legales o practicas comerciales. Los usuarios seran notificados al menos 30 dias antes de la entrada en vigor de cambios relevantes por email y notificaciones en la plataforma.'
                : 'Ne rezervăm dreptul de a modifica acești termeni și condiții pentru a reflecta schimbările în serviciile oferite, cerințele legale sau practicile comerciale. Utilizatorii vor fi notificați cu minimum 30 de zile înainte de intrarea în vigoare a modificărilor majore prin email și notificări în platformă.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Continued use of the services after changes become effective constitutes acceptance of the new Terms. Users who disagree may close their accounts and stop using the Platform without additional penalties.'
              : isEs
                ? 'El uso continuado de los servicios despues de la entrada en vigor de los cambios constituye aceptacion de los nuevos Terminos. Los usuarios que no esten de acuerdo pueden cerrar su cuenta y dejar de usar la plataforma sin penalidades adicionales.'
                : 'Continuarea utilizării serviciilor după intrarea în vigoare a modificărilor constituie acceptarea noilor termeni. Utilizatorii care nu sunt de acord cu modificările pot închide conturile și înceta utilizarea platformei fără penalități suplimentare.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Suspension and Account Closure' : isEs ? 'Suspension y cierre de cuentas' : 'Suspendarea și închiderea conturilor'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'We may suspend or close accounts that violate these Terms, engage in fraudulent activities, negatively affect other users, or present security risks. Depending on severity, we may issue warnings, temporary restrictions, or permanent closure.'
              : isEs
                ? 'Podemos suspender o cerrar cuentas que violen estos terminos, participen en actividades fraudulentas, afecten negativamente a otros usuarios o presenten riesgos de seguridad. Segun la gravedad, podemos emitir advertencias, restricciones temporales o cierre permanente.'
                : 'Putem suspenda sau închide conturile care încalcă acești termeni, participă la activități frauduloase, afectează negativ experiența altor utilizatori sau prezintă riscuri de securitate pentru platformă. În funcție de gravitatea încălcării, putem aplica avertismente, restricții temporare sau închiderea definitivă.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'Users may voluntarily close their accounts at any time via platform settings. Upon account closure, personal data will be anonymized or deleted in accordance with our privacy policy, and active listings will be removed.'
              : isEs
                ? 'Los usuarios pueden cerrar voluntariamente sus cuentas en cualquier momento desde la configuracion. Al cerrar la cuenta, los datos personales se anonimizan o eliminan conforme a nuestra politica de privacidad, y los anuncios activos se eliminan.'
                : 'Utilizatorii pot închide voluntar conturile oricând prin setările platformei. La închiderea contului, datele personale vor fi anonimizate sau șterse conform politicii noastre de confidențialitate, iar anunțurile active vor fi eliminate automat.'
          }</ThemedText>
        </View>

        {/* Section 10 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '10. Governing Law and Jurisdiction' : isEs ? '10. Ley aplicable y jurisdiccion' : '10. Legea aplicabilă și jurisdicția'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Legal Framework' : isEs ? 'Marco legal' : 'Cadrul legal'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'These Terms are governed by Romanian law and interpreted accordingly. Disputes arising from Platform use will be resolved by the competent courts in Romania, and users waive any objection to territorial jurisdiction.'
              : isEs
                ? 'Estos Terminos se rigen por la ley rumana y se interpretan en consecuencia. Las disputas derivadas del uso de la plataforma se resolveran por los tribunales competentes en Rumania, y los usuarios renuncian a cualquier objecion de jurisdiccion territorial.'
                : 'Acești termeni și condiții sunt guvernați de legea română și se interpretează conform acesteia. Toate disputele rezultate din utilizarea platformei vor fi soluționate de instanțele competente din România, utilizatorii renunțând la orice pretenție de incompetență teritorială.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'For users in the European Union, we comply with the Digital Services Act (DSA) and relevant consumer rights directives. Consumers may benefit from alternative dispute resolution procedures under applicable EU rules.'
              : isEs
                ? 'Para usuarios en la Union Europea, cumplimos con el Digital Services Act (DSA) y directivas de derechos del consumidor. Los consumidores pueden beneficiarse de procedimientos alternativos de resolucion de disputas conforme a las normas de la UE aplicables.'
                : 'Pentru utilizatorii din Uniunea Europeană, respectăm prevederile Regulamentului Digital Services Act (DSA) și ale Directivei privind Drepturile Consumatorilor. Consumatorii pot beneficia de proceduri alternative de soluționare a disputelor conform reglementărilor UE aplicabile.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Regulatory Compliance' : isEs ? 'Cumplimiento normativo' : 'Conformitate cu reglementările'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'The Platform complies with GDPR for data protection, PSD2 requirements for payment services, e-commerce regulations and other applicable Romanian and EU laws. We cooperate with regulators and promptly implement legal requirements.'
              : isEs
                ? 'La plataforma cumple con el GDPR para proteccion de datos, requisitos PSD2 para servicios de pago, regulaciones de comercio electronico y otras leyes aplicables en Rumania y la UE. Cooperamos con las autoridades y aplicamos oportunamente nuevos requisitos legales.'
                : 'Platforma respectă prevederile GDPR pentru protecția datelor, reglementările PSD2 pentru serviciile de plată, cerințele de e-commerce conform OUG 34/2014 și alte acte normative relevante din România și UE. Cooperăm cu autoritățile de reglementare și aplicăm prompt orice cerințe legale noi.'
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'For consumer protection issues, users may contact the Romanian National Authority for Consumer Protection (ANPC) or use the EU Online Dispute Resolution (ODR) platform.'
              : isEs
                ? 'Para asuntos de proteccion al consumidor, los usuarios pueden contactar a la Autoridad Nacional para la Proteccion del Consumidor (ANPC) o usar la plataforma ODR de la UE para resolver disputas en linea.'
                : 'Pentru problemele specifice protecției consumatorilor, utilizatorii se pot adresa ANPC (Autoritatea Națională pentru Protecția Consumatorilor) sau pot folosi platforma europeană ODR pentru soluționarea online a disputelor comerciale.'
          }</ThemedText>
        </View>

        {/* Section 11 */}
        <View style={[styles.sectionCard, { backgroundColor: surface }]}>          
          <ThemedText style={[styles.h2, { color: headingColor }]}>{isEn ? '11. Contact and Support' : isEs ? '11. Contacto y soporte' : '11. Contact și asistență'}</ThemedText>
          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Contact Information' : isEs ? 'Informacion de contacto' : 'Informații de contact'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? <>For questions about these Terms, concerns or support requests, please contact: <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. This platform is operated by an individual, and I will respond to inquiries as time permits, typically within 2-5 business days.</>
              : isEs
                ? <>Para preguntas sobre estos Terminos, inquietudes o solicitudes de soporte, contacta: <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. Esta plataforma es operada por una persona, y respondere segun disponibilidad, normalmente en 2-5 dias habiles.</>
                : <>Pentru întrebări despre acești termeni și condiții, nelămuriri sau solicitări de asistență, vă rog contactați: <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. Această platformă este administrată de o persoană fizică, și voi răspunde la solicitări în măsura timpului disponibil, de obicei în 2-5 zile lucrătoare.</>
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor, fontStyle: 'italic' }]}>{
            isEn
              ? 'Please note: As a free community platform operated by an individual with limited resources, response times may vary and I cannot guarantee immediate support. For urgent security issues, I will prioritize responses when possible.'
              : isEs
                ? 'Nota: Como plataforma comunitaria gratuita operada por una persona con recursos limitados, los tiempos de respuesta pueden variar y no puedo garantizar soporte inmediato. Para problemas urgentes de seguridad, priorizare respuestas cuando sea posible.'
                : 'Notă: Ca platformă comunitară gratuită administrată de o persoană fizică cu resurse limitate, timpii de răspuns pot varia și nu pot garanta suport imediat. Pentru probleme urgente de securitate, voi prioritiza răspunsurile când este posibil.'
          }</ThemedText>

          <ThemedText style={[styles.h3, { color: subHeadingColor }]}>{isEn ? 'Complaint Procedure' : isEs ? 'Procedimiento de reclamaciones' : 'Procedura de reclamații'}</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? <>Complaints can be submitted via email to <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. I will review complaints as time allows, but cannot guarantee resolution timelines or outcomes. Users are encouraged to resolve disputes directly with other users when possible.</>
              : isEs
                ? <>Las reclamaciones pueden enviarse por email a <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. Revisare las reclamaciones segun disponibilidad, pero no puedo garantizar plazos ni resultados. Se anima a los usuarios a resolver disputas directamente cuando sea posible.</>
                : <>Reclamațiile pot fi trimise prin email la <ThemedText style={styles.strong}>team.hobbiz@gmail.com</ThemedText>. Voi revizui reclamațiile în măsura timpului disponibil, dar nu pot garanta termene sau rezultate specifice. Utilizatorii sunt încurajați să rezolve disputele direct cu alți utilizatori când este posibil.</>
          }</ThemedText>
          <ThemedText style={[styles.paragraph, { color: bodyColor }]}>{
            isEn
              ? 'For consumer protection issues, Romanian users may contact the National Authority for Consumer Protection (ANPC) or use the EU Online Dispute Resolution (ODR) platform.'
              : isEs
                ? 'Para asuntos de proteccion al consumidor, los usuarios rumanos pueden contactar a la Autoridad Nacional para la Proteccion del Consumidor (ANPC) o usar la plataforma ODR de la UE para resolver disputas en linea.'
                : 'Pentru probleme de protecție a consumatorilor, utilizatorii din România pot contacta Autoritatea Națională pentru Protecția Consumatorilor (ANPC) sau pot folosi platforma europeană ODR pentru soluționarea online a disputelor.'
          }</ThemedText>
        </View>

        {/* Footer notice */}
        <View style={[styles.footerNotice, { backgroundColor: footerBg, borderLeftColor: WEB_PRIMARY }]}>          
          <ThemedText style={[styles.footerParagraph, { color: isDarkMode ? '#888' : '#64748b' }]}>{
            isEn
              ? 'This document was updated on December 13, 2025 and is effective immediately for all Hobbiz users. For prior versions of these Terms please contact us at team.hobbiz@gmail.com.'
              : isEs
                ? 'Este documento fue actualizado el 13 de diciembre de 2025 y entra en vigor de inmediato para todos los usuarios de Hobbiz. Para versiones anteriores de estos terminos, contactanos en team.hobbiz@gmail.com.'
                : 'Documentul a fost actualizat la data de 13 decembrie 2025 și intră în vigoare imediat pentru toți utilizatorii platformei Hobbiz. Pentru versiunile anterioare ale acestor termeni, vă rugăm să ne contactați la adresa team.hobbiz@gmail.com.'
          }</ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 80, gap: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700' },

  desktopHeader: {
    marginTop: 40,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  headerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  headerIcon: { fontSize: 28, zIndex: 2 },
  headerH1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#ffffff',
    zIndex: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginTop: 4,
  },
  radialOverlay: { position: 'absolute', top: -120, right: -120, width: 360, height: 360, backgroundColor: 'rgba(252,194,46,0.17)', borderRadius: 360, transform: [{ rotate: '30deg' }] },

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
