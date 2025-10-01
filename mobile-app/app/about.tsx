import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface FAQ { question: string; answer: string; }

const FAQS: FAQ[] = [
  { question: 'Este gratuit să folosesc Hobbiz?', answer: 'Da, înregistrarea și utilizarea de bază a platformei Hobbiz sunt complet gratuite. Poți publica și răspunde la anunțuri și comunica cu alți utilizatori fără costuri.' },
  { question: 'Cum îmi protejez datele personale?', answer: 'Luăm în serios protecția datelor tale. Folosim criptare avansată și nu împărtășim informațiile tale personale cu terți fără consimțământ explicit.' },
  { question: 'Pot vinde atât produse cât și servicii?', answer: 'Absolut! Poți promova servicii, produse handmade, obiecte, vechituri, alimente și multe altele.' },
  { question: 'Cum funcționează sistemul de mesagerie?', answer: 'Mesageria integrată îți permite discuții directe, negociere și coordonare în siguranță.' },
];

export default function AboutScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (idx: number) => setOpen(open === idx ? null : idx);

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Despre noi</ThemedText>
        </View>

        {/* Hero */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <View style={styles.badge}>            
            <ThemedText style={[styles.badgeText, { color: tokens.colors.text }]}>✨ Platforma pasionaților</ThemedText>
          </View>
          <ThemedText style={[styles.heroTitle, { color: tokens.colors.text }]}>Transformă-ți <ThemedText style={{ color: tokens.colors.primary, fontWeight:'700' }}>pasiunea</ThemedText> în oportunitate</ThemedText>
        </View>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <View style={styles.missionHeader}>            
            <View style={[styles.missionIcon, { backgroundColor: tokens.colors.elev }]}>              
              <ThemedText style={{ fontSize:22 }}>🎯</ThemedText>
            </View>
            <View style={{ flex:1 }}>
              <ThemedText style={[styles.missionTitle, { color: tokens.colors.text }]}>Misiunea noastră</ThemedText>
              <ThemedText style={[styles.missionSubtitle, { color: tokens.colors.muted }]}>Construim punți între talente și oportunități</ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.paragraph, { color: tokens.colors.text }]}>Hobbiz este o comunitate care celebrează autenticitatea și creativitatea. Credem că fiecare talent merită să fie văzut și apreciat.</ThemedText>
          <View style={styles.pillars}>            
            {[
              { icon:'🌟', title:'Autenticitate', text:'Promovăm produse și servicii unice, create cu pasiune' },
              { icon:'🤝', title:'Comunitate', text:'Legăm pasionați și clienți în mod direct și cald' },
              { icon:'🚀', title:'Creștere', text:'Oferim instrumente pentru dezvoltarea afacerilor creative' },
            ].map(p => (
              <View key={p.title} style={[styles.pillarItem, { borderColor: tokens.colors.border }]}>                
                <View style={styles.pillarIcon}><ThemedText>{p.icon}</ThemedText></View>
                <View style={{ flex:1 }}>
                  <ThemedText style={[styles.pillarTitle, { color: tokens.colors.text }]}>{p.title}</ThemedText>
                  <ThemedText style={[styles.pillarText, { color: tokens.colors.muted }]}>{p.text}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Ce poți face pe Hobbiz?</ThemedText>
          {[
            'Descoperi o nouă sursă de venit',
            'Publici anunțuri pentru servicii sau produse',
            'Află oferte locale și naționale',
            'Salvezi și contactezi anunțuri preferate',
            'Colaborezi cu alți pasionați',
            'Gestionezi contul intuitiv',
          ].map(line => (
            <ThemedText key={line} style={[styles.listItem, { color: tokens.colors.muted }]}>• {line}</ThemedText>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>De ce să alegi Hobbiz?</ThemedText>
          {[
            'Platformă modernă și rapidă',
            'Comunitate prietenoasă și suport',
            'Promovare gratuită',
            'Experiență optimă mobil + desktop',
            'Siguranță și confidențialitate',
            'Conectare directă creatori - clienți',
          ].map(line => (
            <ThemedText key={line} style={[styles.listItem, { color: tokens.colors.muted }]}>• {line}</ThemedText>
          ))}
        </View>

        {/* How it works */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Cum funcționează?</ThemedText>
          {[
            { n:1, t:'Înregistrează-te', d:'Creează un cont gratuit' },
            { n:2, t:'Publică sau caută', d:'Adaugă anunțuri sau găsește ce îți trebuie' },
            { n:3, t:'Conectează-te', d:'Discuții directe prin mesagerie' },
            { n:4, t:'Colaborează', d:'Tranzacții sigure și colaborări' },
          ].map(step => (
            <View key={step.n} style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>
                <ThemedText style={[styles.stepNumber, { color: tokens.colors.text }]}>{step.n}</ThemedText>
              </View>
              <View style={{ flex:1 }}>
                <ThemedText style={[styles.stepTitle, { color: tokens.colors.text }]}>{step.t}</ThemedText>
                <ThemedText style={[styles.stepDesc, { color: tokens.colors.muted }]}>{step.d}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Values */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Valorile noastre</ThemedText>
          <View style={styles.valuesGrid}>
            {[
              { icon:'🛡️', title:'Securitate', text:'Protejăm datele și interacțiunile tale.' },
              { icon:'🤝', title:'Comunitate', text:'Spațiu prietenos și colaborativ.' },
              { icon:'⚡', title:'Inovație', text:'Îmbunătățim constant experiența.' },
            ].map(v => (
              <View key={v.title} style={[styles.valueCard, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>
                <ThemedText style={styles.valueIcon}>{v.icon}</ThemedText>
                <ThemedText style={[styles.valueTitle, { color: tokens.colors.text }]}>{v.title}</ThemedText>
                <ThemedText style={[styles.valueText, { color: tokens.colors.muted }]}>{v.text}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <ThemedText style={[styles.sectionHeader, { color: tokens.colors.text }]}>Întrebări frecvente</ThemedText>
          {FAQS.map((f, idx) => (
            <View key={f.question}>
              <TouchableOpacity
                onPress={() => toggle(idx)}
                activeOpacity={0.7}
                style={[styles.faqQuestion, { borderColor: tokens.colors.border }]}
              >
                <ThemedText style={[styles.faqQuestionText, { color: tokens.colors.text }]}>{f.question}</ThemedText>
                <Ionicons name={open === idx ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.colors.muted} />
              </TouchableOpacity>
              {open === idx && (
                <View style={styles.faqAnswer}>                  
                  <ThemedText style={{ color: tokens.colors.muted, lineHeight:20 }}>{f.answer}</ThemedText>
                </View>
              )}
            </View>
          ))}
          <ThemedText style={[styles.updateText, { color: tokens.colors.muted }]}>Ultima actualizare: 19 iulie 2025</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1 },
  scroll:{ padding:16, paddingBottom:120, gap:20 },
  headerRow:{ flexDirection:'row', alignItems:'center', gap:12 },
  backButton:{ width:44, height:44, borderRadius:999, alignItems:'center', justifyContent:'center', borderWidth:1 },
  title:{ fontSize:24, fontWeight:'600' },
  card:{ borderRadius:16, padding:20, gap:18, borderWidth:1 },
  badge:{ alignSelf:'flex-start', backgroundColor:'rgba(53,80,112,0.09)', paddingHorizontal:12, paddingVertical:6, borderRadius:30 },
  badgeText:{ fontSize:12, fontWeight:'600' },
  heroTitle:{ fontSize:22, fontWeight:'600', lineHeight:30 },
  missionHeader:{ flexDirection:'row', alignItems:'center', gap:14 },
  missionIcon:{ width:50, height:50, borderRadius:14, alignItems:'center', justifyContent:'center' },
  missionTitle:{ fontSize:18, fontWeight:'700' },
  missionSubtitle:{ fontSize:13, fontWeight:'500' },
  paragraph:{ fontSize:14, lineHeight:20 },
  pillars:{ gap:14 },
  pillarItem:{ flexDirection:'row', gap:14, padding:14, borderWidth:1, borderRadius:14 },
  pillarIcon:{ width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.04)' },
  pillarTitle:{ fontSize:15, fontWeight:'600', marginBottom:2 },
  pillarText:{ fontSize:13, lineHeight:18 },
  sectionHeader:{ fontSize:18, fontWeight:'700', marginBottom:4 },
  listItem:{ fontSize:14, lineHeight:20 },
  stepRow:{ flexDirection:'row', gap:14, alignItems:'flex-start', marginBottom:10 },
  stepCircle:{ width:38, height:38, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center' },
  stepNumber:{ fontSize:16, fontWeight:'600' },
  stepTitle:{ fontSize:15, fontWeight:'600' },
  stepDesc:{ fontSize:13, lineHeight:18 },
  valuesGrid:{ flexDirection:'row', flexWrap:'wrap', gap:14 },
  valueCard:{ flexBasis:'48%', padding:14, borderRadius:14, borderWidth:1, gap:6 },
  valueIcon:{ fontSize:24 },
  valueTitle:{ fontSize:15, fontWeight:'600' },
  valueText:{ fontSize:12, lineHeight:16 },
  faqQuestion:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:14, borderBottomWidth:1 },
  faqQuestionText:{ fontSize:15, fontWeight:'600', flex:1, paddingRight:8 },
  faqAnswer:{ paddingVertical:12 },
  updateText:{ fontSize:11, marginTop:12, textAlign:'center' },
});
