import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useResponsive } from '../../src/theme/responsive';
import MobileHeader from '@/components/MobileHeader';
import LegalFooter from '@/components/LegalFooter';
import { useRouter } from 'expo-router';

const categories = [
  { description: 'Fotografie', color: '#FF6B6B', image: require('../../assets/images/camera.png') },
  { description: 'Prajituri', color: '#4ECDC4', image: require('../../assets/images/bake.png') },
  { description: 'Muzica', color: '#45B7D1', image: require('../../assets/images/guitar.png') },
  { description: 'Reparații', color: '#96CEB4', image: require('../../assets/images/pipe.png') },
  { description: 'Dans', color: '#FFEAA7', image: require('../../assets/images/dancing.jpg') },
  { description: 'Curățenie', color: '#DDA0DD', image: require('../../assets/images/cleaning.png') },
  { description: 'Gradinarit', color: '#98D8C8', image: require('../../assets/images/gardening-logo.jpg') },
  { description: 'Sport', color: '#F7DC6F', image: require('../../assets/images/tennis.png') },
  { description: 'Arta', color: '#BB8FCE', image: require('../../assets/images/arta.png') },
  { description: 'Tehnologie', color: '#85C1E9', image: require('../../assets/images/laptop.png') },
  { description: 'Auto', color: '#F8C471', image: require('../../assets/images/car.png') },
  { description: 'Meditații', color: '#82E0AA', image: require('../../assets/images/carte.png') },
];

export default function HomeScreen() {
  const { tokens } = useAppTheme();
  const { columnsForCategories } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
  <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}> 
      <MobileHeader 
        notificationCount={0}
        onSearchFocus={() => console.log('Search focused')}
        onNotificationClick={() => router.push('/notifications')}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContent, { backgroundColor: tokens.colors.surface }]}>
          <ThemedText style={[styles.mainText, { color: tokens.colors.text }]}>
            Găsește-ți hobbyul perfect și conectează-te cu pasionați din toată țara!
          </ThemedText>
          <View style={[styles.mainImagePlaceholder, { backgroundColor: tokens.colors.border }]} />
          <View style={[styles.callToAction, { backgroundColor: tokens.colors.surface }]}>
            <ThemedText style={[styles.ctaText, { color: tokens.colors.text }]}>
              Descoperă talente locale pentru pasiunile tale
            </ThemedText>
          </View>
        </View>

        <View style={[styles.categoriesSection, { backgroundColor: tokens.colors.surface }]}>
          <ThemedText style={[styles.categoriesTitle, { color: tokens.colors.text }]}>
            Explorează categorii
          </ThemedText>
          <View style={[styles.categoriesGrid, { gap: 12 }]}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    width: `${100 / columnsForCategories - 2}%`,
                  },
                ]}
              >
                <View style={[styles.imageContainer, { backgroundColor: `${category.color}20` }]}>
                  <Image 
                    source={category.image} 
                    style={styles.categoryImage}
                    resizeMode="contain"
                  />
                </View>
                <ThemedText style={[styles.categoryLabel, { color: tokens.colors.muted }]}>
                  {category.description}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legal Footer */}
        <LegalFooter />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  mainContent: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  mainImagePlaceholder: {
    width: '100%',
    maxWidth: 280,
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
  },
  callToAction: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 17,
    textAlign: 'center',
  },
  categoriesSection: {
    padding: 16,
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
  },
  imageContainer: {
    height: 60,
    width: 60,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  categoryImage: {
    width: 50,
    height: 50,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
