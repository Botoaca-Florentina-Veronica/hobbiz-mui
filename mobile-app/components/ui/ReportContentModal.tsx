import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { ThemedTextInput } from '../themed-text-input';
import { useAppTheme } from '../../src/context/ThemeContext';

export interface ReportReasonOption {
  value: string;
  label: string;
}

interface ReportContentModalProps {
  visible: boolean;
  title: string;
  description?: string;
  reasonLabel: string;
  reasons: ReportReasonOption[];
  detailsLabel: string;
  detailsPlaceholder: string;
  submitText: string;
  cancelText: string;
  submitting?: boolean;
  onSubmit: (reason: string, details: string) => void;
  onCancel: () => void;
}

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  visible,
  title,
  description,
  reasonLabel,
  reasons,
  detailsLabel,
  detailsPlaceholder,
  submitText,
  cancelText,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const { tokens, isDark } = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.92)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [selectedReason, setSelectedReason] = React.useState(reasons[0]?.value ?? '');
  const [details, setDetails] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      setSelectedReason(reasons[0]?.value ?? '');
      setDetails('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dangerColor = isDark ? '#f44336' : '#d32f2f';
  const dangerBadgeBg = isDark ? 'rgba(244, 67, 54, 0.18)' : 'rgba(211, 47, 47, 0.1)';
  const dangerSelectedBg = isDark ? 'rgba(244, 67, 54, 0.14)' : 'rgba(211, 47, 47, 0.08)';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const subtleBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.035)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedColor = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.55)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.28)', opacity: fadeAnim },
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 35 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod="dimezisBlurView"
        />
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={submitting ? undefined : onCancel}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor,
                transform: [{ scale: scaleAnim }],
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.55 : 0.2, shadowRadius: 24 },
                  android: { elevation: 14 },
                  web: { boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.6)' : '0 12px 36px rgba(0,0,0,0.18)' },
                }),
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.iconBadge, { backgroundColor: dangerBadgeBg }]}>
              <Ionicons name="flag-outline" size={26} color={dangerColor} />
            </View>

            <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
            {!!description && (
              <ThemedText style={[styles.description, { color: mutedColor }]}>{description}</ThemedText>
            )}

            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>{reasonLabel}</ThemedText>
              <View style={styles.reasonsList}>
                {reasons.map((reason) => {
                  const selected = reason.value === selectedReason;
                  return (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonRow,
                        {
                          backgroundColor: selected ? dangerSelectedBg : subtleBg,
                          borderColor: selected ? dangerColor : 'transparent',
                        },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedReason(reason.value)}
                      disabled={submitting}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: selected ? dangerColor : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)') },
                        ]}
                      >
                        {selected && <View style={[styles.radioInner, { backgroundColor: dangerColor }]} />}
                      </View>
                      <ThemedText
                        style={[styles.reasonLabel, { color: selected ? textColor : mutedColor, fontWeight: selected ? '600' : '400' }]}
                      >
                        {reason.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ThemedText style={[styles.sectionLabel, { color: mutedColor, marginTop: 18 }]}>{detailsLabel}</ThemedText>
              <ThemedTextInput
                value={details}
                onChangeText={setDetails}
                placeholder={detailsPlaceholder}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                multiline
                numberOfLines={3}
                editable={!submitting}
                style={[
                  styles.detailsInput,
                  {
                    backgroundColor: subtleBg,
                    borderColor,
                    color: textColor,
                  },
                ]}
              />
            </ScrollView>

            <View style={styles.buttonsColumn}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, { backgroundColor: dangerColor, opacity: submitting ? 0.75 : 1 }]}
                onPress={() => onSubmit(selectedReason, details.trim())}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText
                    style={[styles.buttonText, styles.submitButtonText]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {submitText}
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: subtleBg, borderColor }]}
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={submitting}
              >
                <ThemedText
                  style={[styles.buttonText, { color: textColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {cancelText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayTouchable: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  description: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  scrollArea: {
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reasonsList: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabel: {
    fontSize: 14.5,
    fontFamily: 'Poppins-Regular',
    flexShrink: 1,
  },
  detailsInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  buttonsColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
});
