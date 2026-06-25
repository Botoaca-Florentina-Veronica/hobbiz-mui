import React, { useState, useEffect } from 'react';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, Alert, StatusBar, Text, TextInput, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import storage from '../src/services/storage';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import api from '../src/services/api';
import { useLocale } from '../src/context/LocaleContext';
import { Toast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { localitatiPeJudet } from '../assets/comunePeJudet';
import { getProfileTranslations } from '../src/i18n/profile';

interface UserAnnouncement {
  _id: string;
  title: string;
  category: string;
  location: string;
  images?: string[];
  createdAt: string;
  views?: number;
  favoritesCount?: number;
}

interface UserReview {
  _id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerId?: string;
  createdAt: string;
  likes?: any[]; // array of user IDs who liked
  unlikes?: any[]; // array of user IDs who unliked
  likesCount?: number;
  unlikesCount?: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface AvailabilityDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

const SLOT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const AVAILABILITY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const toLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMonthWeeks = (year: number, month: number): (number | null)[][] => {
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Luni=0 ... Duminică=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

export default function ProfileScreen() {
  const { tokens, isDark } = useAppTheme();
  // Page-level accent aligned with theme primary (dark: #f51866)
  const pageAccent = tokens.colors.primary;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // shared border style (unified color for both light and dark modes)
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0, borderColor: tokens.colors.borderNeutral } as const;
  const { user, restore } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { locale } = useLocale();

  const t = getProfileTranslations(locale);
  const [publicProfile, setPublicProfile] = React.useState<any | null>(null);
  const [loadingPublic, setLoadingPublic] = React.useState(false);
  const [currentAvatar, setCurrentAvatar] = React.useState<string | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [userAnnouncements, setUserAnnouncements] = React.useState<UserAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = React.useState(false);
  
  // Reviews state
  const [reviewStats, setReviewStats] = React.useState<ReviewStats | null>(null);
  const [recentReviews, setRecentReviews] = React.useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  // Track like/unlike state for each review
  const [reviewLikeState, setReviewLikeState] = React.useState<Record<string, { liked: boolean; unliked: boolean; locked?: boolean }>>({});
  
  // Edit mode state for contact info
  const [isEditingContact, setIsEditingContact] = React.useState(false);
  const [editFirstName, setEditFirstName] = React.useState('');
  const [editLastName, setEditLastName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Availability schedule edit state (own profile)
  const [availabilityEditMode, setAvailabilityEditMode] = React.useState(false);
  const [availabilitySaving, setAvailabilitySaving] = React.useState(false);
  const [editAvailabilityEnabled, setEditAvailabilityEnabled] = React.useState(false);
  const [editSlotDuration, setEditSlotDuration] = React.useState(60);
  const [editWeeklySchedule, setEditWeeklySchedule] = React.useState<AvailabilityDay[]>([]);
  const [activeTimePicker, setActiveTimePicker] = React.useState<{ dayOfWeek: number; field: 'startTime' | 'endTime' } | null>(null);

  // Booking widget state (public profile)
  const [bookingSlotsByDate, setBookingSlotsByDate] = React.useState<Record<string, BookingSlot[]>>({});
  const [bookingDates, setBookingDates] = React.useState<string[]>([]);
  const [bookingSlotsLoading, setBookingSlotsLoading] = React.useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = React.useState<string | null>(null);
  const [bookingDialogSlot, setBookingDialogSlot] = React.useState<BookingSlot | null>(null);
  const [bookingMessage, setBookingMessage] = React.useState('');
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);

  // Toast state for custom notifications
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('success');

  // Confirmation Dialog states
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState('');
  const [confirmMessage, setConfirmMessage] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null);
  const [confirmIcon, setConfirmIcon] = React.useState('alert-circle-outline');
  const [confirmColor, setConfirmColor] = React.useState<string | undefined>(undefined);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Location picker modal state (for setting own profile location)
  const [locationModalOpen, setLocationModalOpen] = React.useState(false);
  const [countyExpanded, setCountyExpanded] = React.useState<string | null>(null);

  const handleSelectLocation = async (loc: string, county?: string) => {
    const full = county ? `${loc}, ${county}` : loc;
    try {
      // update user profile localitate
      await api.put('/api/users/profile', { localitate: full });

      // refresh auth profile so UI shows new location
      try {
        if (typeof restore === 'function') await restore();
      } catch (e) {
        console.warn('[Profile] restore failed after location update', e);
      }
      showToast(t.locationUpdated, 'success');
    } catch (err) {
      console.error('Error updating location:', err);
      showToast(t.locationUpdateFailed, 'error');
    } finally {
      setLocationModalOpen(false);
      setCountyExpanded(null);
    }
  };

  // If userId present in query, fetch public profile for that user
  React.useEffect(() => {
    const fetchPublic = async () => {
      if (!userId) {
        setPublicProfile(null);
        return;
      }
      try {
        setLoadingPublic(true);
        const res = await api.get(`/api/users/profile/${encodeURIComponent(String(userId))}`);
        setPublicProfile(res.data);
      } catch (e) {
        console.error('Error loading public profile:', e);
        setPublicProfile(null);
      } finally {
        setLoadingPublic(false);
      }
    };
    fetchPublic();
  }, [userId]);

  // Fetch available booking slots when viewing another user's profile with availability enabled
  React.useEffect(() => {
    const fetchSlots = async () => {
      if (!userId || !publicProfile?.availability?.enabled) {
        setBookingSlotsByDate({});
        setBookingDates([]);
        setSelectedBookingDate(null);
        return;
      }
      try {
        setBookingSlotsLoading(true);
        const from = toLocalDateStr(new Date());
        const toDateObj = new Date();
        toDateObj.setDate(toDateObj.getDate() + 13);
        const to = toLocalDateStr(toDateObj);
        const res = await api.get(`/api/bookings/availability/${encodeURIComponent(String(userId))}`, { params: { from, to } });
        const slots: BookingSlot[] = res.data?.slots || [];
        const byDate: Record<string, BookingSlot[]> = {};
        slots.forEach((s) => {
          if (!byDate[s.date]) byDate[s.date] = [];
          byDate[s.date].push(s);
        });
        const dates = Object.keys(byDate).sort();
        setBookingSlotsByDate(byDate);
        setBookingDates(dates);
        setSelectedBookingDate(dates.find((dt) => byDate[dt].some((s) => s.available)) || dates[0] || null);
      } catch (e) {
        console.error('Error loading booking availability:', e);
        setBookingSlotsByDate({});
        setBookingDates([]);
      } finally {
        setBookingSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [userId, publicProfile?.availability?.enabled]);

  // Helper to get correct image URL (moved up so it can be used in useEffect)
  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    return `${base}/uploads/${img}`;
  };

  // keep a local displayed avatar so we can optimistically update after upload
  React.useEffect(() => {
    const active = publicProfile || user;
    // Normalize avatar URL to ensure it works on web
    const avatarUrl = active?.avatar ? (getImageSrc(active.avatar) || active.avatar) : undefined;
    setCurrentAvatar(avatarUrl);
  }, [publicProfile, user]);

  // Fetch user announcements
  React.useEffect(() => {
    const fetchUserAnnouncements = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;
      
      try {
        setAnnouncementsLoading(true);
        // If viewing another user's profile, use public endpoint
        const endpoint = userId 
          ? `/api/users/announcements/${encodeURIComponent(String(userId))}`
          : '/api/users/my-announcements';
        const res = await api.get(endpoint);
        setUserAnnouncements(res.data || []);
      } catch (e) {
        console.error('Error loading user announcements:', e);
        setUserAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    };
    fetchUserAnnouncements();
  }, [userId, user?.id]);

  // Fetch user reviews
  React.useEffect(() => {
    const fetchUserReviews = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;
      
      try {
        setReviewsLoading(true);
        // Fetch reviews for this user - correct endpoint is /api/reviews/:userId
        const res = await api.get(`/api/reviews/${encodeURIComponent(String(targetUserId))}`);
        const reviewsArray = Array.isArray(res.data) ? res.data : [];
        
        console.log('Fetched reviews:', reviewsArray.length, reviewsArray);
        
        // Calculate stats from reviews array
        if (reviewsArray.length > 0) {
          const totalReviews = reviewsArray.length;
          const totalScore = reviewsArray.reduce((sum, r) => sum + (r.score || 0), 0);
          const averageRating = totalScore / totalReviews;
          
          // Calculate distribution
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviewsArray.forEach(r => {
            const score = Math.round(r.score || 0);
            if (score >= 1 && score <= 5) {
              distribution[score as keyof typeof distribution]++;
            }
          });
          
          setReviewStats({
            averageRating,
            totalReviews,
            distribution
          });
          
          // Map reviews to expected format and take 2 most recent
          const mappedReviews = reviewsArray.slice(0, 2).map(r => ({
            _id: String(r._id),
            rating: r.score || 0,
            comment: r.comment || '',
            reviewerName: r.authorName || 'Utilizator',
            reviewerAvatar: r.authorAvatar,
            reviewerId: (
              (r.author && (typeof r.author === 'string' ? r.author : (r.author._id || r.author.id)))
              || r.authorId || r.user || undefined
            ) as any,
            createdAt: r.createdAt,
            likes: r.likes || [],
            unlikes: r.unlikes || [],
            likesCount: (r.likes || []).length,
            unlikesCount: (r.unlikes || []).length
          }));
          
          setRecentReviews(mappedReviews);
          
          // Initialize like/unlike state based on current user
          if (user?.id) {
            const initialState: Record<string, { liked: boolean; unliked: boolean; locked?: boolean }> = {};
            mappedReviews.forEach(r => {
              const userLiked = (r.likes || []).some((uid: any) => String(uid) === String(user.id));
              const userUnliked = (r.unlikes || []).some((uid: any) => String(uid) === String(user.id));
              initialState[r._id] = { liked: userLiked, unliked: userUnliked };
            });
            setReviewLikeState(initialState);
          }
        } else {
          setReviewStats(null);
          setRecentReviews([]);
        }
      } catch (e) {
        console.error('Error loading user reviews:', e);
        setReviewStats(null);
        setRecentReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchUserReviews();
  }, [userId, user?.id]);

  const isViewingOwnProfile = !publicProfile || (user && String(user.id) === String(publicProfile?.id));

  // local asset for empty-location illustration (shown when own profile has no location)
  // Metro will bundle this image because we use require()
  const anaisImg = require('../assets/images/anais.png');

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.permissionTitle, t.permissionGallery);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.8, 
        allowsEditing: true,
        allowsMultipleSelection: false
      });
      
      // expo-image-picker v17+ returns { canceled, assets }
      if (result.canceled) return;
      
      const asset = result.assets && result.assets[0];
      if (!asset || !asset.uri) return;

      // Ask for confirmation before uploading
      Alert.alert(
        t.changeAvatarTitle,
        t.changeAvatarConfirm,
        [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.confirm,
            onPress: async () => {
              // proceed to upload
              const uri = asset.uri;
              const fileName = asset.fileName || uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
              const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
              const ext = extMatch ? extMatch[1] : 'jpg';
              const mimeType = asset.mimeType || (asset.type ? `${asset.type}/${ext}` : `image/${ext}`);
              const form = new FormData();
              // @ts-ignore - FormData in React Native accepts this format
              form.append('avatar', { 
                uri, 
                name: fileName, 
                type: mimeType 
              });
              
              try {
                setAvatarUploading(true);
                const res = await api.post('/api/users/avatar', form as any, { 
                  headers: { 'Content-Type': 'multipart/form-data' } 
                });
                // server should return the updated avatar URL; fall back to local uri
                const rawAvatar = res?.data?.avatar || res?.data?.url || uri;
                // Normalize the avatar URL for web compatibility
                const newAvatar = getImageSrc(rawAvatar) || rawAvatar;
                setCurrentAvatar(newAvatar);
                // If viewing a publicProfile (e.g., viewing another user's profile) update it too
                if (publicProfile) {
                  setPublicProfile((p: any) => ({ ...(p || {}), avatar: rawAvatar }));
                } else {
                  // If this is the logged-in user's own profile, refresh auth profile so UI reflects changes immediately
                  try {
                    if (typeof restore === 'function') await restore();
                  } catch (e) {
                    console.warn('[Profile] failed to restore auth after avatar upload', e);
                  }
                }
                showToast(t.avatarUpdated, 'success');
              } catch (err) {
                console.error('Avatar upload error:', err);
                showToast(t.avatarUploadFailed, 'error');
              } finally {
                setAvatarUploading(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('handlePickAvatar error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea imaginii');
    }
  };

  // Format member since date
  const formatMemberDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const monthsRo = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const months = locale === 'en' ? monthsEn : monthsRo;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Start editing contact info
  const handleStartEdit = () => {
    const profile = profileToShow;
    setEditFirstName(profile?.firstName || '');
    setEditLastName(profile?.lastName || '');
    setEditPhone(profile?.phone || '');
    setIsEditingContact(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingContact(false);
    setEditFirstName('');
    setEditLastName('');
    setEditPhone('');
  };

  // Save contact info changes
  const handleSaveContact = async () => {
    try {
      setIsSaving(true);
      const updateData = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
      };
      
      await api.put('/api/users/profile', updateData);

      // If editing own profile, refresh auth profile so changes appear immediately in the UI
      if (!userId && user) {
        try {
          if (typeof restore === 'function') await restore();
          showToast('Informațiile au fost actualizate', 'success');
        } catch (e) {
          console.warn('[Profile] restore failed after profile update', e);
          showToast('Informațiile au fost actualizate', 'info');
        }
      }

      setIsEditingContact(false);

      // If viewing a public profile (not own), refresh that public profile data
      if (userId) {
        const res = await api.get(`/api/users/profile/${encodeURIComponent(String(userId))}`);
        setPublicProfile(res.data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Nu s-au putut actualiza informațiile. Încearcă din nou', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailabilityDayLabel = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: return t.dayMonday;
      case 2: return t.dayTuesday;
      case 3: return t.dayWednesday;
      case 4: return t.dayThursday;
      case 5: return t.dayFriday;
      case 6: return t.daySaturday;
      default: return t.daySunday;
    }
  };

  const handleStartEditAvailability = () => {
    const avail = profileToShow?.availability;
    setEditAvailabilityEnabled(!!avail?.enabled);
    setEditSlotDuration(avail?.slotDurationMinutes || 60);
    setEditWeeklySchedule(
      Array.isArray(avail?.weeklySchedule)
        ? avail.weeklySchedule.map((d: AvailabilityDay) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }))
        : []
    );
    setAvailabilityEditMode(true);
  };

  const handleCancelEditAvailability = () => {
    setAvailabilityEditMode(false);
    setActiveTimePicker(null);
  };

  const handleToggleAvailabilityDay = (dayOfWeek: number) => {
    setEditWeeklySchedule((prev) => {
      const exists = prev.some((d) => d.dayOfWeek === dayOfWeek);
      if (exists) return prev.filter((d) => d.dayOfWeek !== dayOfWeek);
      return [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00' }];
    });
  };

  const handleDayTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setEditWeeklySchedule((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)));
  };

  const handleTimePickerChange = (event: any, selectedDate?: Date) => {
    const picker = activeTimePicker;
    if (Platform.OS === 'android') {
      setActiveTimePicker(null);
      if (event?.type === 'set' && selectedDate && picker) {
        const hh = String(selectedDate.getHours()).padStart(2, '0');
        const mm = String(selectedDate.getMinutes()).padStart(2, '0');
        handleDayTimeChange(picker.dayOfWeek, picker.field, `${hh}:${mm}`);
      }
      return;
    }
    if (selectedDate && picker) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      handleDayTimeChange(picker.dayOfWeek, picker.field, `${hh}:${mm}`);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setAvailabilitySaving(true);
      await api.put('/api/users/availability', {
        enabled: editAvailabilityEnabled,
        slotDurationMinutes: editSlotDuration,
        weeklySchedule: editWeeklySchedule,
      });
      try {
        if (typeof restore === 'function') await restore();
      } catch (e) {
        console.warn('[Profile] restore failed after availability update', e);
      }
      showToast(t.saveSuccess, 'success');
      setAvailabilityEditMode(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      showToast(t.saveFailed, 'error');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingDialogSlot || !userId) return;
    try {
      setBookingSubmitting(true);
      await api.post('/api/bookings', {
        providerId: String(userId),
        date: bookingDialogSlot.date,
        startTime: bookingDialogSlot.startTime,
        endTime: bookingDialogSlot.endTime,
        message: bookingMessage.trim() || undefined,
      });
      showToast(t.bookingRequestSent, 'success');
      setBookingDialogSlot(null);
      setBookingMessage('');
      // refresh slots since the one just booked is no longer available
      setBookingSlotsByDate((prev) => {
        const next = { ...prev };
        const dateSlots = next[bookingDialogSlot.date];
        if (dateSlots) {
          next[bookingDialogSlot.date] = dateSlots.map((s) =>
            s.startTime === bookingDialogSlot.startTime ? { ...s, available: false } : s
          );
        }
        return next;
      });
    } catch (error: any) {
      console.error('Error creating booking:', error);
      if (error?.response?.status === 409) {
        showToast(t.bookingConflictError, 'error');
        setBookingDialogSlot(null);
      } else {
        showToast(t.bookingRequestError, 'error');
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  const profileToShow = publicProfile || user;

  // Helper to set reaction using unified endpoint with optimistic update
  const setReviewReaction = async (reviewId: string, desired: 'like' | 'unlike' | 'none') => {
    const currentState = reviewLikeState[reviewId] || { liked: false, unliked: false };

    // Snapshot for revert
    const prevState = { ...currentState };
    const prevCounts = recentReviews.find(r => r._id === reviewId) || { likesCount: 0, unlikesCount: 0 } as any;

    // Compute optimistic deltas
    let likesDelta = 0;
    let unlikesDelta = 0;
    if (desired === 'like') {
      likesDelta += currentState.liked ? 0 : 1;
      unlikesDelta += currentState.unliked ? -1 : 0;
    } else if (desired === 'unlike') {
      unlikesDelta += currentState.unliked ? 0 : 1;
      likesDelta += currentState.liked ? -1 : 0;
    } else if (desired === 'none') {
      likesDelta += currentState.liked ? -1 : 0;
      unlikesDelta += currentState.unliked ? -1 : 0;
    }

    // Apply optimistic UI
    setReviewLikeState(prev => ({
      ...prev,
      [reviewId]: {
        liked: desired === 'like',
        unliked: desired === 'unlike',
      },
    }));
    console.log('[Profile] optimistic reaction', { reviewId, desired, likesDelta, unlikesDelta });
    setRecentReviews(prev => prev.map(r => r._id === reviewId ? {
      ...r,
      likesCount: Math.max(0, (r.likesCount || 0) + likesDelta),
      unlikesCount: Math.max(0, (r.unlikesCount || 0) + unlikesDelta),
    } : r));

    try {
      const res = await api.post(`/api/reviews/${reviewId}/react`, { reaction: desired });
      const data = res?.data || {};
      console.log('[Profile] setReaction success', { reviewId, data });

      // Normalize userReaction (new API returns userReaction, legacy returned reaction/liked/unliked)
      const userReaction: 'like' | 'unlike' | 'none' = (data.userReaction as any) || data.reaction || (data.liked ? 'like' : (data.unliked ? 'unlike' : 'none'));

      setReviewLikeState(prev => ({
        ...prev,
        [reviewId]: { liked: userReaction === 'like', unliked: userReaction === 'unlike' },
      }));

      // Prefer authoritative counts from server when provided, otherwise keep the optimistic value
      setRecentReviews(prev => prev.map(r => r._id === reviewId ? {
        ...r,
        likesCount: (typeof data.likesCount !== 'undefined') ? data.likesCount : (r.likesCount ?? 0),
        unlikesCount: (typeof data.unlikesCount !== 'undefined') ? data.unlikesCount : (r.unlikesCount ?? 0),
      } : r));
    } catch (error: any) {
      console.error('Error setting reaction:', error);

      // If endpoint is not found on deployed backend (404), fallback to legacy toggle endpoints
      const status = error?.response?.status;
      if (status === 404) {
        try {
          let legacyRes;
          if (desired === 'like') {
            legacyRes = await api.post(`/api/reviews/${reviewId}/like`);
          } else if (desired === 'unlike') {
            legacyRes = await api.post(`/api/reviews/${reviewId}/unlike`);
          } else if (desired === 'none') {
            // Undo: call the toggle corresponding to previous state
            if (prevState.liked) {
              legacyRes = await api.post(`/api/reviews/${reviewId}/like`);
            } else if (prevState.unliked) {
              legacyRes = await api.post(`/api/reviews/${reviewId}/unlike`);
            }
          }
          const data = legacyRes?.data || {};
          console.log('[Profile] legacy fallback response', { reviewId, data, legacyUrl: legacyRes?.config?.url });
          // Legacy endpoints return { liked } or { unliked } and counts; normalize
          setReviewLikeState(prev => ({
            ...prev,
            [reviewId]: { liked: !!data.liked || data.reaction === 'like', unliked: !!data.unliked || data.reaction === 'unlike' },
          }));
          setRecentReviews(prev => prev.map(r => r._id === reviewId ? {
            ...r,
            likesCount: data.likesCount ?? r.likesCount ?? 0,
            unlikesCount: data.unlikesCount ?? r.unlikesCount ?? 0,
          } : r));
          return;
        } catch (legacyErr) {
          console.error('[Profile] Legacy fallback failed:', legacyErr);
        }
      }
      // Revert on error (either non-404 or fallback failed)
      console.error('[Profile] setReviewReaction error response', { reviewId, status, body: error?.response?.data });
      setReviewLikeState(prev => ({ ...prev, [reviewId]: prevState }));
      setRecentReviews(prev => prev.map(r => r._id === reviewId ? {
        ...r,
        likesCount: prevCounts.likesCount || 0,
        unlikesCount: prevCounts.unlikesCount || 0,
      } : r));
      Alert.alert('Eroare', 'Nu s-a putut salva reacția. Încearcă din nou.');
    }
  };

  // Handle like toggle for a review (uses unified endpoint)
  const handleToggleLike = async (reviewId: string) => {
    if (!user?.id) {
      Alert.alert('Autentificare necesară', 'Trebuie să fii conectat pentru a da like.');
      return;
    }
    const currentState = reviewLikeState[reviewId] || { liked: false, unliked: false };
    const desired: 'like' | 'unlike' | 'none' = currentState.liked ? 'none' : 'like';
    await setReviewReaction(reviewId, desired);
  };

  // Handle unlike toggle for a review (uses unified endpoint)
  const handleToggleUnlike = async (reviewId: string) => {
    if (!user?.id) {
      Alert.alert('Autentificare necesară', 'Trebuie să fii conectat pentru a da unlike.');
      return;
    }
    const currentState = reviewLikeState[reviewId] || { liked: false, unliked: false };
    const desired: 'like' | 'unlike' | 'none' = currentState.unliked ? 'none' : 'unlike';
    await setReviewReaction(reviewId, desired);
  };

  const scrollStyle = Platform.OS === 'web' ? ({ height: '100vh' } as any) : { flex: 1 };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={tokens.colors.overlayLight}
        translucent={true}
      />
      <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
        <ScrollView style={scrollStyle} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button and title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              try {
                // Prefer router.back() from expo-router which works across navigation modes
                router.back();
              } catch (e) {
                // Fallback to pushing to root if no history is available
                try {
                  router.push('/');
                } catch (_) {}
              }
            }}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>

          <View
            style={[styles.titleWrapper, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
            {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
          >
            <ThemedText style={[styles.titleText, { color: tokens.colors.text }]}>{publicProfile ? `${publicProfile.firstName || ''} ${publicProfile.lastName || ''}`.trim() || 'Profil' : 'Profilul meu'}</ThemedText>
          </View>

          {/* settings button removed intentionally */}
        </View>

        {/* Profile Header Card - Avatar + Rating + Name */}
  <View style={[styles.profileHeaderCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={styles.avatarContainer}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                <Ionicons name="person" size={32} color={pageAccent} />
              </View>
            )}

            {isViewingOwnProfile && (
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]} onPress={handlePickAvatar} activeOpacity={0.8}>
                {avatarUploading ? (
                  <ActivityIndicator size="small" color={tokens.colors.primary} />
                ) : (
                  <Ionicons name="camera" size={18} color={tokens.colors.text} />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={tokens.colors.primary} />
              <ThemedText style={[styles.ratingText, { color: tokens.colors.text }]}>
                {reviewStats ? reviewStats.averageRating.toFixed(1) : '—'}
              </ThemedText>
            </View>

            <ThemedText style={[styles.userName, { color: tokens.colors.text }]}>
              {profileToShow?.firstName && profileToShow?.lastName ? `${profileToShow.firstName} ${profileToShow.lastName}` : 'Utilizator'}
              {profileToShow?.isVerified && (
                <View style={{ marginLeft: 6, position: 'relative', top: 2 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                </View>
              )}
            </ThemedText>
            
            <ThemedText style={[styles.registerDate, { color: tokens.colors.muted }]}>
              {t.memberSince} {formatMemberDate(profileToShow?.createdAt)}
            </ThemedText>

            {/* Balance display - only for own profile */}
            {isViewingOwnProfile && (
              <View style={[styles.balanceContainer, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>
                <Ionicons name="wallet-outline" size={20} color={tokens.colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemedText style={[styles.balanceLabel, { color: tokens.colors.muted }]}>{t.balance}</ThemedText>
                  <ThemedText style={[styles.balanceValue, { color: tokens.colors.primary }]}>
                    {(profileToShow?.balance || 0).toFixed(2)} {t.ron}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* My Location Section */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t.myLocation}</ThemedText>
            {isViewingOwnProfile && (
              <TouchableOpacity onPress={() => setLocationModalOpen(true)} activeOpacity={0.7}>
                <ThemedText style={[styles.specifyLink, { color: tokens.colors.muted }]}>{t.changeLocation}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[
            styles.mapContainer,
            { backgroundColor: profileToShow?.localitate ? tokens.colors.surface : (isDark ? '#121212' : '#ffffff'), borderColor: tokens.colors.borderNeutral }
          ]}>
            {profileToShow?.localitate ? (
              (() => {
                const encoded = encodeURIComponent(profileToShow.localitate);
                const key = (Constants?.expoConfig?.extra?.VITE_GOOGLE_MAPS_KEY as string) || (Constants?.manifest?.extra?.VITE_GOOGLE_MAPS_KEY as string) || process.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY || process.env?.VITE_GOOGLE_MAPS_KEY;
                // Use embed API on web only; native uses maps.google.com embed to avoid referrer/API issues
                const mapUrl = Platform.OS === 'web'
                  ? (key ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encoded}` : `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`)
                  : `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;

                if (key && Platform.OS !== 'web') {
                  console.warn('[profile] Google Maps API key is set but will not be used on native WebView to avoid referrer/billing issues.');
                }

                if (Platform.OS === 'web') {
                  return (
                    <View style={styles.mapInnerWrapper}>
                      <iframe title="Locație" src={mapUrl} style={{ border: 0, width: '100%', height: '100%' }} loading="lazy" />
                    </View>
                  );
                }

                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { WebView } = require('react-native-webview');

                  // Create HTML with iframe for Google Maps Embed API
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        html, body { width: 100%; height: 100%; overflow: hidden; }
                        iframe { border: 0; width: 100%; height: 100%; display: block; }
                      </style>
                    </head>
                    <body>
                      <iframe src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </body>
                    </html>
                  `;

                  return (
                    <View style={styles.mapInnerWrapper}>
                      <WebView
                        source={{ html: htmlContent }}
                        style={styles.mapWebview}
                        startInLoadingState
                        javaScriptEnabled
                        domStorageEnabled
                        renderLoading={() => (
                          <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}> 
                            <ActivityIndicator size="small" color={tokens.colors.primary} />
                          </View>
                        )}
                      />
                    </View>
                  );
                } catch (err: any) {
                  // WebView not available or failed
                  // fallback to simple placeholder
                  return (
                    <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>          
                      <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} style={{ marginBottom: 8 }} />
                    </View>
                  );
                }
              })()
            ) : (
              <View style={[styles.mapPlaceholder, { alignItems: 'center', justifyContent: 'center' }]}>                
                {isViewingOwnProfile ? (
                  <Image source={anaisImg} style={styles.anaisImage} resizeMode="contain" />
                ) : (
                  <Ionicons name="map" size={48} color={tokens.colors.muted} />
                )}
                <ThemedText style={[styles.mapText, { color: tokens.colors.muted, marginTop: 8 }]}>
                  {isViewingOwnProfile
                    ? t.noLocationText
                    : (locale === 'en' ? "This user hasn't set their location yet." : 'Acest utilizator nu și-a setat încă locația')
                  }
                </ThemedText>
              </View>
            )}
            {/* map pin removed as requested */}
          </View>
        </View>

        {/* Contact Info Dashboard */}
  <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={styles.dashboardHeader}>
            <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>{t.contactInfo}</ThemedText>
            {isViewingOwnProfile && !isEditingContact && (
              <TouchableOpacity 
                onPress={handleStartEdit}
                style={[styles.editButton, { backgroundColor: 'rgba(0,0,0,0)', borderColor: tokens.colors.primary, borderWidth: 1, marginLeft: 'auto' }]}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.editButtonText, { color: tokens.colors.primary }]}>{t.edit}</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoGrid}>
            {/* Nume */}
            <View style={[styles.infoItem, { borderColor: tokens.colors.borderNeutral }]}> 
              <Ionicons name="person-outline" size={18} color={tokens.colors.primary} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>{t.lastName}</ThemedText>
                {isEditingContact ? (
                  <ThemedTextInput
                    value={editLastName}
                    onChangeText={setEditLastName}
                    style={[styles.editInput, { color: tokens.colors.text, borderColor: tokens.colors.borderNeutral }]}
                    placeholder={t.placeholderLastName}
                    placeholderTextColor={tokens.colors.placeholder}
                  />
                ) : (
                  <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]}>
                    {profileToShow?.lastName || 'N/A'}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Prenume */}
            <View style={[styles.infoItem, { borderColor: tokens.colors.borderNeutral }]}> 
              <Ionicons name="person-outline" size={18} color={tokens.colors.primary} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>{t.firstName}</ThemedText>
                {isEditingContact ? (
                  <ThemedTextInput
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    style={[styles.editInput, { color: tokens.colors.text, borderColor: tokens.colors.borderNeutral }]}
                    placeholder={t.placeholderFirstName}
                    placeholderTextColor={tokens.colors.placeholder}
                  />
                ) : (
                  <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]}>
                    {profileToShow?.firstName || 'N/A'}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Telefon */}
            <View style={[styles.infoItem, { borderColor: tokens.colors.borderNeutral }]}> 
              <Ionicons name="call-outline" size={18} color={tokens.colors.primary} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>{t.phone}</ThemedText>
                {isEditingContact ? (
                  <ThemedTextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    style={[styles.editInput, { color: tokens.colors.text, borderColor: tokens.colors.borderNeutral }]}
                    placeholder={t.placeholderPhone}
                    placeholderTextColor={tokens.colors.placeholder}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]}>
                    {profileToShow?.phone || 'N/A'}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={[styles.infoItem, { borderColor: tokens.colors.borderNeutral }]}> 
              <Ionicons name="mail-outline" size={18} color={tokens.colors.primary} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>Email</ThemedText>
                <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]} numberOfLines={1}>
                  {profileToShow?.email || 'N/A'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Save/Cancel buttons when editing */}
          {isEditingContact && (
            <View style={styles.editActions}>
              <TouchableOpacity 
                onPress={handleCancelEdit}
                style={[styles.actionButton, styles.cancelButton, { borderColor: tokens.colors.borderNeutral }]}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.actionButtonText, { color: tokens.colors.text }]}>{t.cancelBtn}</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSaveContact}
                style={[styles.actionButton, styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>{t.saveBtn}</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Availability Schedule Dashboard - own profile only */}
        {isViewingOwnProfile && (
          <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
            <View style={styles.dashboardHeader}>
              <Ionicons name="calendar-outline" size={18} color={tokens.colors.primary} style={{ marginRight: 8 }} />
              <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>{t.availabilityTitle}</ThemedText>
              {!availabilityEditMode && (
                <TouchableOpacity
                  onPress={handleStartEditAvailability}
                  style={[styles.editButton, { backgroundColor: 'rgba(0,0,0,0)', borderColor: tokens.colors.primary, borderWidth: 1, marginLeft: 'auto' }]}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.editButtonText, { color: tokens.colors.primary }]}>{t.edit}</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {availabilityEditMode ? (
              <>
                <View style={styles.availabilityEnableRow}>
                  <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text, flex: 1 }]}>{t.availabilityEnable}</ThemedText>
                  <Switch
                    trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
                    thumbColor={Platform.OS === 'ios' ? '#fff' : (editAvailabilityEnabled ? '#fff' : '#f4f3f4')}
                    ios_backgroundColor={tokens.colors.border}
                    onValueChange={setEditAvailabilityEnabled}
                    value={editAvailabilityEnabled}
                  />
                </View>

                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted, marginTop: 14, marginBottom: 6 }]}>
                  {t.availabilitySlotDuration}
                </ThemedText>
                <View style={styles.availabilityChipsRow}>
                  {SLOT_DURATION_OPTIONS.map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => setEditSlotDuration(minutes)}
                      activeOpacity={0.8}
                      style={[
                        styles.availabilityChip,
                        { borderColor: tokens.colors.borderNeutral },
                        editSlotDuration === minutes && { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
                      ]}
                    >
                      <ThemedText style={[styles.availabilityChipText, { color: editSlotDuration === minutes ? tokens.colors.primaryContrast : tokens.colors.text }]}>
                        {minutes} {t.availabilityMinutesShort}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ marginTop: 14, gap: 8 }}>
                  {AVAILABILITY_DAY_ORDER.map((dayOfWeek) => {
                    const daySchedule = editWeeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
                    const isActive = !!daySchedule;
                    return (
                      <View
                        key={dayOfWeek}
                        style={[
                          styles.availabilityDayRow,
                          { borderColor: tokens.colors.borderNeutral },
                          isActive ? { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg } : null,
                        ]}
                      >
                        <Switch
                          trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
                          thumbColor={Platform.OS === 'ios' ? '#fff' : (isActive ? '#fff' : '#f4f3f4')}
                          ios_backgroundColor={tokens.colors.border}
                          onValueChange={() => handleToggleAvailabilityDay(dayOfWeek)}
                          value={isActive}
                          style={{ transform: [{ scale: 0.85 }] }}
                        />
                        <ThemedText style={[styles.availabilityDayLabel, { color: tokens.colors.text }]}>
                          {getAvailabilityDayLabel(dayOfWeek)}
                        </ThemedText>
                        {isActive && (
                          <View style={styles.availabilityTimeRow}>
                            <TouchableOpacity
                              onPress={() => setActiveTimePicker({ dayOfWeek, field: 'startTime' })}
                              style={[styles.availabilityTimeChip, { borderColor: tokens.colors.borderNeutral }]}
                              activeOpacity={0.8}
                            >
                              <ThemedText style={[styles.availabilityTimeChipText, { color: tokens.colors.text }]}>
                                {daySchedule?.startTime}
                              </ThemedText>
                            </TouchableOpacity>
                            <ThemedText style={{ color: tokens.colors.muted }}>–</ThemedText>
                            <TouchableOpacity
                              onPress={() => setActiveTimePicker({ dayOfWeek, field: 'endTime' })}
                              style={[styles.availabilityTimeChip, { borderColor: tokens.colors.borderNeutral }]}
                              activeOpacity={0.8}
                            >
                              <ThemedText style={[styles.availabilityTimeChipText, { color: tokens.colors.text }]}>
                                {daySchedule?.endTime}
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {activeTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      const sched = editWeeklySchedule.find((d) => d.dayOfWeek === activeTimePicker.dayOfWeek);
                      const hhmm = (sched ? sched[activeTimePicker.field] : null) || (activeTimePicker.field === 'startTime' ? '09:00' : '17:00');
                      const [h, m] = hhmm.split(':').map(Number);
                      const dt = new Date();
                      dt.setHours(h, m, 0, 0);
                      return dt;
                    })()}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimePickerChange}
                  />
                )}
                {Platform.OS === 'ios' && activeTimePicker && (
                  <TouchableOpacity
                    onPress={() => setActiveTimePicker(null)}
                    style={[styles.actionButton, styles.saveButton, { backgroundColor: tokens.colors.primary, marginTop: 8 }]}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>{t.saveBtn}</ThemedText>
                  </TouchableOpacity>
                )}

                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={handleCancelEditAvailability}
                    style={[styles.actionButton, styles.cancelButton, { borderColor: tokens.colors.borderNeutral }]}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.actionButtonText, { color: tokens.colors.text }]}>{t.cancelBtn}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveAvailability}
                    style={[styles.actionButton, styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                    activeOpacity={0.8}
                    disabled={availabilitySaving}
                  >
                    {availabilitySaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>{t.saveBtn}</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : profileToShow?.availability?.enabled && Array.isArray(profileToShow?.availability?.weeklySchedule) && profileToShow.availability.weeklySchedule.length > 0 ? (
              <View style={styles.availabilitySummaryWrap}>
                {AVAILABILITY_DAY_ORDER.filter((d) => profileToShow.availability.weeklySchedule.some((s: AvailabilityDay) => s.dayOfWeek === d)).map((dayOfWeek) => {
                  const s = profileToShow.availability.weeklySchedule.find((d2: AvailabilityDay) => d2.dayOfWeek === dayOfWeek);
                  return (
                    <View key={dayOfWeek} style={[styles.availabilitySummaryChip, { borderColor: tokens.colors.borderNeutral }]}>
                      <ThemedText style={[styles.availabilitySummaryChipDay, { color: tokens.colors.text }]}>{getAvailabilityDayLabel(dayOfWeek)}</ThemedText>
                      <ThemedText style={[styles.availabilitySummaryChipTime, { color: tokens.colors.muted }]}>{s?.startTime} - {s?.endTime}</ThemedText>
                    </View>
                  );
                })}
              </View>
            ) : (
              <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>
                {profileToShow?.availability?.enabled ? t.availabilityNoDays : t.availabilityDisabled}
              </ThemedText>
            )}
          </View>
        )}

        {/* Availability Calendar - own profile only, shows current month with availability highlighted */}
        {isViewingOwnProfile && (() => {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const weeks = getMonthWeeks(year, month);
          const localeTag = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'ro-RO';
          const monthLabel = today.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' });
          const monday = new Date(2024, 0, 1);
          const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toLocaleDateString(localeTag, { weekday: 'short' });
          });
          const scheduleEnabled = !!profileToShow?.availability?.enabled;
          const weeklySchedule: AvailabilityDay[] = scheduleEnabled && Array.isArray(profileToShow?.availability?.weeklySchedule)
            ? profileToShow.availability.weeklySchedule
            : [];
          const availableDaysOfWeek = new Set(weeklySchedule.map((s) => s.dayOfWeek));

          return (
            <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
              <View style={styles.dashboardHeader}>
                <Ionicons name="calendar-outline" size={18} color={tokens.colors.primary} style={{ marginRight: 8 }} />
                <View>
                  <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>{t.availabilityCalendarTitle}</ThemedText>
                  <ThemedText style={[styles.availabilityCalendarSubtitle, { color: tokens.colors.muted }]}>{monthLabel}</ThemedText>
                </View>
              </View>

              <View style={styles.availabilityCalendarWeekdays}>
                {weekdayLabels.map((w, i) => (
                  <ThemedText key={i} style={[styles.availabilityCalendarWeekdayText, { color: tokens.colors.muted }]}>{w}</ThemedText>
                ))}
              </View>

              {weeks.map((week, wi) => (
                <View key={wi} style={styles.availabilityCalendarRow}>
                  {week.map((day, di) => {
                    if (day == null) {
                      return <View key={di} style={styles.availabilityCalendarCell} />;
                    }
                    const dayOfWeek = new Date(year, month, day).getDay();
                    const isToday = day === today.getDate();
                    const isAvailable = availableDaysOfWeek.has(dayOfWeek);
                    return (
                      <View
                        key={di}
                        style={[
                          styles.availabilityCalendarCell,
                          isAvailable ? { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg } : null,
                        ]}
                      >
                        <View style={[styles.availabilityCalendarDayNum, isToday ? { backgroundColor: tokens.colors.primary } : null]}>
                          <ThemedText style={[styles.availabilityCalendarDayNumText, { color: isToday ? '#fff' : tokens.colors.text }]}>
                            {day}
                          </ThemedText>
                        </View>
                        {isAvailable && <View style={[styles.availabilityCalendarDot, { backgroundColor: tokens.colors.primary }]} />}
                      </View>
                    );
                  })}
                </View>
              ))}

              {scheduleEnabled && availableDaysOfWeek.size > 0 && (
                <View style={styles.availabilityCalendarLegend}>
                  <View style={[styles.availabilityCalendarDot, { backgroundColor: tokens.colors.primary }]} />
                  <ThemedText style={[styles.availabilityCalendarLegendText, { color: tokens.colors.muted }]}>
                    {t.availabilityCalendarLegend}
                  </ThemedText>
                </View>
              )}
            </View>
          );
        })()}

        {/* Booking Widget - viewing someone else's profile with availability enabled */}
        {!isViewingOwnProfile && publicProfile?.availability?.enabled && (
          <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
            <View style={styles.dashboardHeader}>
              <Ionicons name="calendar-outline" size={18} color={tokens.colors.primary} style={{ marginRight: 8 }} />
              <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>{t.bookingTitle}</ThemedText>
            </View>
            <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted, marginBottom: 12 }]}>{t.bookingSubtitle}</ThemedText>

            {bookingSlotsLoading ? (
              <ActivityIndicator size="small" color={tokens.colors.primary} />
            ) : bookingDates.length === 0 ? (
              <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>{t.bookingNoSlots}</ThemedText>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {bookingDates.map((dateStr) => {
                    const d = new Date(`${dateStr}T00:00:00`);
                    const isToday = dateStr === toLocalDateStr(new Date());
                    const localeTag = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'ro-RO';
                    const weekday = d.toLocaleDateString(localeTag, { weekday: 'short' });
                    const dayMonth = `${d.getDate()} ${d.toLocaleDateString(localeTag, { month: 'short' })}`;
                    const selected = selectedBookingDate === dateStr;
                    const hasAvailable = (bookingSlotsByDate[dateStr] || []).some((s) => s.available);
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        onPress={() => setSelectedBookingDate(dateStr)}
                        disabled={!hasAvailable}
                        activeOpacity={0.8}
                        style={[
                          styles.bookingDayChip,
                          { borderColor: tokens.colors.borderNeutral },
                          selected ? { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary } : null,
                          !hasAvailable ? { opacity: 0.35 } : null,
                        ]}
                      >
                        <ThemedText style={[styles.bookingDayChipWeekday, { color: selected ? tokens.colors.primaryContrast : tokens.colors.muted }]}>
                          {isToday ? t.bookingToday : weekday}
                        </ThemedText>
                        <ThemedText style={[styles.bookingDayChipDate, { color: selected ? tokens.colors.primaryContrast : tokens.colors.text }]}>
                          {dayMonth}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.bookingSlotsGrid}>
                  {(bookingSlotsByDate[selectedBookingDate || ''] || []).map((slot) => (
                    <TouchableOpacity
                      key={`${slot.date}-${slot.startTime}`}
                      disabled={!slot.available}
                      onPress={() => {
                        if (!user) {
                          router.push('/login' as any);
                          return;
                        }
                        setBookingDialogSlot(slot);
                        setBookingMessage('');
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.bookingSlotChip,
                        { borderColor: tokens.colors.borderNeutral },
                        !slot.available ? styles.bookingSlotChipUnavailable : null,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.bookingSlotChipText,
                          { color: slot.available ? tokens.colors.text : tokens.colors.muted },
                          !slot.available ? { textDecorationLine: 'line-through' } : null,
                        ]}
                      >
                        {slot.startTime}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Verification Documents Section moved to account tab */}

        {/* Admin Controls - Show when viewing another user's profile */}
        {!isViewingOwnProfile && user?.isAdmin && publicProfile && (
          <View style={[styles.dashboardCard, { backgroundColor: isDark ? '#2C1810' : '#FFF3E0', ...containerBorderStyle, borderColor: '#FF9800', borderWidth: 2 }]}>
            <View style={styles.dashboardHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#FF9800" style={{ marginRight: 8 }} />
              <ThemedText style={[styles.dashboardTitle, { color: '#FF9800' }]}>
                Controale Administrator
              </ThemedText>
            </View>

            <View style={{ padding: 16 }}>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted, marginBottom: 16 }]}>
                Gestionează verificarea și documentele pentru {publicProfile.firstName} {publicProfile.lastName}
              </ThemedText>
              
              {/* Toggle Verification Badge */}
              <TouchableOpacity
                style={[styles.editButton, { 
                  backgroundColor: publicProfile.isVerified ? '#F44336' : '#4CAF50', 
                  borderWidth: 0, 
                  width: '100%' 
                }]}
                onPress={async () => {
                  setConfirmTitle(publicProfile.isVerified ? 'Eliminare Badge' : 'Acordare Badge');
                  setConfirmMessage(`Sigur vrei să ${publicProfile.isVerified ? 'elimini' : 'acorzi'} badge-ul de verificare pentru ${publicProfile.firstName}?`);
                  setConfirmIcon(publicProfile.isVerified ? 'close-circle-outline' : 'checkmark-circle-outline');
                  setConfirmColor(publicProfile.isVerified ? '#F44336' : tokens.colors.primary);
                  setConfirmAction(() => async () => {
                    try {
                      const { toggleUserVerification } = await import('../src/services/verificationService');
                      await toggleUserVerification(String(publicProfile._id), !publicProfile.isVerified);
                      showToast(
                        `Badge ${!publicProfile.isVerified ? 'acordat' : 'eliminat'} cu succes.`,
                        !publicProfile.isVerified ? 'success' : 'info'
                      );
                      // Refresh profile
                      router.replace(`/profile?userId=${publicProfile._id}`);
                    } catch (error) {
                      showToast('Nu s-a putut actualiza badge-ul de verificare.', 'error');
                    } finally {
                      setConfirmVisible(false);
                    }
                  });
                  setConfirmVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name={publicProfile.isVerified ? "close-circle" : "checkmark-circle"} size={18} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText style={[styles.editButtonText, { color: '#fff' }]}>
                  {publicProfile.isVerified ? t.removeVerification : t.grantVerification}
                </ThemedText>
              </TouchableOpacity>

              {/* View User Documents */}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: '#2196F3', borderWidth: 0, width: '100%', marginTop: 12 }]}
                onPress={() => {
                  router.push(`/verification-documents?userId=${publicProfile._id}&adminView=true`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="documents" size={18} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText style={[styles.editButtonText, { color: '#fff' }]}>
                  {t.viewUserDocuments}
                </ThemedText>
              </TouchableOpacity>

              {/* Go to Admin Panel */}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: '#FF9800', borderWidth: 0, width: '100%', marginTop: 12 }]}
                onPress={() => router.push('/admin-verifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={18} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText style={[styles.editButtonText, { color: '#fff' }]}>
                  {t.fullAdminPanel}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reviews Dashboard */}
  <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={styles.dashboardHeader}>
            <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>{t.reviewsTitle}</ThemedText>
          </View>

          {reviewsLoading ? (
            <View style={styles.reviewsLoadingContainer}>
              <ActivityIndicator size="small" color={tokens.colors.primary} />
            </View>
          ) : reviewStats && reviewStats.totalReviews > 0 ? (
            <>
              {/* Rating Summary */}
              <View style={styles.ratingsSummary}>
                <View style={styles.ratingsLeft}>
                  <ThemedText style={[styles.ratingScore, { color: tokens.colors.text }]}>
                    {reviewStats.averageRating.toFixed(1)}
                  </ThemedText>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(reviewStats.averageRating) ? 'star' : 'star-outline'}
                        size={16}
                        color={tokens.colors.rating}
                      />
                    ))}
                  </View>
                  <ThemedText style={[styles.reviewCount, { color: tokens.colors.muted }]}>
                    {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                  </ThemedText>
                </View>

                {/* Rating Distribution Bars */}
                <View style={styles.ratingsRight}>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.distribution[rating as keyof typeof reviewStats.distribution] || 0;
                    const percentage = reviewStats.totalReviews > 0 
                      ? (count / reviewStats.totalReviews) * 100 
                      : 0;
                    
                    return (
                      <View key={rating} style={styles.ratingBar}>
                        <ThemedText style={[styles.ratingLabel, { color: tokens.colors.text }]}>
                          {rating} ★
                        </ThemedText>
                        <View style={[styles.barBackground, { backgroundColor: tokens.colors.borderNeutral }]}>
                          <View 
                            style={[
                              styles.barFill, 
                              { 
                                width: `${percentage}%`,
                                backgroundColor: rating === 5 ? tokens.colors.rating : tokens.colors.borderNeutral 
                              }
                            ]} 
                          />
                        </View>
                        <ThemedText style={[styles.ratingCount, { color: tokens.colors.muted }]}>
                          {count}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Recent Reviews */}
              {recentReviews.length > 0 && (
                <View style={styles.recentReviewsSection}>
                  {recentReviews.map((review) => {
                    const reviewDate = new Date(review.createdAt);
                    const formattedDate = `${reviewDate.getDate().toString().padStart(2, '0')}.${(reviewDate.getMonth() + 1).toString().padStart(2, '0')}.${reviewDate.getFullYear()}`;
                    
                    return (
                      <View key={review._id} style={[styles.reviewCard, { borderColor: tokens.colors.borderNeutral }]}> 
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewerInfo}>
                            {review.reviewerAvatar ? (
                              <Image 
                                source={{ uri: review.reviewerAvatar }} 
                                style={styles.reviewerAvatar} 
                              />
                            ) : (
                              <View style={[styles.reviewerAvatarPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                                <Ionicons name="person" size={20} color={tokens.colors.primary} />
                              </View>
                            )}
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                if (review.reviewerId) {
                                  try { router.push(`/profile?userId=${encodeURIComponent(String(review.reviewerId))}`); } catch (e) { /* ignore */ }
                                }
                              }}
                              style={styles.reviewerDetails}
                            >
                              <ThemedText style={[styles.reviewerName, { color: tokens.colors.text }]}> 
                                {review.reviewerName}
                              </ThemedText>
                              <ThemedText style={[styles.reviewDate, { color: tokens.colors.muted }]}>
                                {formattedDate}
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.reviewRatingBadge, { backgroundColor: tokens.colors.rating }]}>
                            <ThemedText style={[styles.reviewRatingText, { color: tokens.colors.text }]}>
                              {review.rating.toFixed(1)}
                            </ThemedText>
                          </View>
                        </View>
                        
                        <ThemedText style={[styles.reviewComment, { color: tokens.colors.text }]}>
                          {review.comment}
                        </ThemedText>
                        
                        {/* Like/Unlike buttons */}
                        <View style={[styles.reviewFooter, { borderTopColor: tokens.colors.borderNeutral }]}>
                          <View style={styles.reviewActions}>
                            {/* Like button */}
                            <TouchableOpacity
                              style={styles.actionButtonContainer}
                              onPress={() => handleToggleLike(review._id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons 
                                name="thumbs-up" 
                                size={18} 
                                color={
                                  reviewLikeState[review._id]?.liked 
                                    ? tokens.colors.success 
                                    : tokens.colors.muted
                                }
                              />
                              <ThemedText style={[
                                styles.actionCount, 
                                { 
                                  color: reviewLikeState[review._id]?.liked 
                                    ? tokens.colors.success 
                                    : tokens.colors.muted 
                                }
                              ]}>
                                {review.likesCount || 0}
                              </ThemedText>
                            </TouchableOpacity>

                            {/* Unlike button */}
                            <TouchableOpacity
                              style={styles.actionButtonContainer}
                              onPress={() => handleToggleUnlike(review._id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons 
                                name="thumbs-down" 
                                size={18} 
                                color={
                                  reviewLikeState[review._id]?.unliked 
                                    ? tokens.colors.danger 
                                    : tokens.colors.muted
                                }
                              />
                              <ThemedText style={[
                                styles.actionCount, 
                                { 
                                  color: reviewLikeState[review._id]?.unliked 
                                    ? tokens.colors.danger 
                                    : tokens.colors.muted 
                                }
                              ]}>
                                {review.unlikesCount || 0}
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  
                  {/* View All Reviews Button */}
                  {reviewStats.totalReviews > 2 && (
                    <TouchableOpacity 
                      style={[styles.viewAllButton, { borderColor: tokens.colors.primary }]}
                      onPress={() => {
                        router.push({ 
                          pathname: '/all-reviews', 
                          params: { userId: userId || user?.id } 
                        });
                      }}
                    >
                      <ThemedText style={[styles.viewAllText, { color: tokens.colors.primary }]}>
                        TOATE COMENTARIILE
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="star" size={56} color={tokens.colors.muted} style={{ marginBottom: 8 }} />
              <ThemedText style={[styles.noReviewsText, { color: tokens.colors.muted }]}>Nu există încă review-uri</ThemedText>
            </View>
          )}
        </View>

        {/* Announcements Dashboard */}
  <View style={[styles.dashboardCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={styles.dashboardHeader}>
            <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>
              {isViewingOwnProfile
                ? t.myAnnouncementsTitle
                : t.userAnnouncementsTitle.replace(
                    '{name}',
                    ((publicProfile?.firstName || '') + ' ' + (publicProfile?.lastName || '')).trim() || t.userLabel
                  )}
            </ThemedText>
            <TouchableOpacity 
              onPress={() => {
                if (isViewingOwnProfile) {
                  router.push('/my-announcements');
                } else {
                  router.push({
                    pathname: '/user-announcements',
                    params: { userId: userId }
                  });
                }
              }}
              style={{ marginLeft: 'auto', padding: 6 }}
            >
              <Ionicons name="arrow-forward" size={20} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.announcementStats}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tokens.colors.primary }]}>
                {userAnnouncements.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>{t.activeLabel}</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tokens.colors.borderNeutral }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tokens.colors.text }]}>
                {userAnnouncements.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>{t.totalLabel}</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tokens.colors.borderNeutral }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tokens.colors.text }]}>
                {userAnnouncements.reduce((sum, a) => sum + (a.views || 0), 0)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>{t.viewsLabel}</ThemedText>
            </View>
          </View>

          {/* Horizontal Announcements List */}
          {announcementsLoading ? (
            <View style={styles.announcementsLoadingContainer}>
              <ActivityIndicator size="small" color={tokens.colors.primary} />
            </View>
          ) : userAnnouncements.length === 0 ? (
            <View style={styles.emptyAnnouncementsContainer}>
              <Ionicons name="albums-outline" size={40} color={tokens.colors.placeholder} />
              <ThemedText style={[styles.emptyAnnouncementsText, { color: tokens.colors.muted }]}>
                Nu ai încă anunțuri postate
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={styles.announcementsList}
            >
              {userAnnouncements.map((item) => {
                const imageUri = item.images?.[0] ? getImageSrc(item.images[0]) : null;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.announcementCard, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.borderNeutral }]}
                    onPress={() => router.push(`/announcement-details?id=${item._id}`)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: imageUri || 'https://via.placeholder.com/150x150?text=No+Image'
                      }}
                      style={[styles.announcementImage, { backgroundColor: tokens.colors.placeholderBg }]}
                    />
                    <View style={styles.announcementInfo}>
                      <ThemedText
                        numberOfLines={2}
                        style={[styles.announcementTitle, { color: tokens.colors.text }]}
                      >
                        {item.title}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.announcementLocation, { color: tokens.colors.muted }]}
                      >
                        <Ionicons name="location-outline" size={12} color={tokens.colors.muted} />
                        {' '}{item.location || 'Nedefinit'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </ThemedView>
    
    {/* Custom Toast Notification */}
    {locationModalOpen && (
  <View style={[styles.categoryOverlay, { backgroundColor: isDark ? tokens.colors.overlayDark : tokens.colors.overlayLight }]}>
  <View style={[styles.categorySheet, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={[styles.categoryHeader, { borderColor: tokens.colors.borderNeutral }]}>
            {countyExpanded ? (
              <>
                <TouchableOpacity onPress={() => setCountyExpanded(null)} style={[styles.closeBtn, { marginRight: 8 }]}> 
                  <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
                </TouchableOpacity>
                <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>{countyExpanded}</ThemedText>
                <TouchableOpacity onPress={() => { setLocationModalOpen(false); setCountyExpanded(null); }} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={tokens.colors.text} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>Alege localitatea</ThemedText>
                <TouchableOpacity onPress={() => setLocationModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={tokens.colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            {countyExpanded ? (
              (() => {
                const data = (localitatiPeJudet as any)[countyExpanded];
                const orase = data?.orase?.map((o: any) => o.nume) || [];
                const comune = data?.comune || [];
                const localities = [...orase, ...comune];
                return localities.map((loc: string, idx: number) => (
                  <TouchableOpacity
                    key={`${countyExpanded}-${loc}-${idx}`}
                    onPress={() => { handleSelectLocation(loc, countyExpanded); }}
                    activeOpacity={0.65}
                    style={[styles.categoryRow, { borderColor: tokens.colors.borderNeutral }]}
                  >
                    <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{loc}</ThemedText>
                  </TouchableOpacity>
                ));
              })()
            ) : (
              ['Toată țara', ...Object.keys(localitatiPeJudet)].map((loc: string) => (
                <TouchableOpacity
                  key={loc}
                  onPress={() => {
                    if (loc === 'Toată țara') {
                      handleSelectLocation('Toată țara');
                    } else {
                      setCountyExpanded(loc);
                    }
                  }}
                  activeOpacity={0.65}
                  style={[styles.categoryRow, { borderColor: tokens.colors.borderNeutral }]}
                >
                  <ThemedText style={[styles.categoryLabel, { color: tokens.colors.text }]}>{loc}</ThemedText>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    )}

    {bookingDialogSlot && (
      <View style={[styles.categoryOverlay, { backgroundColor: isDark ? tokens.colors.overlayDark : tokens.colors.overlayLight }]}>
        <View style={[styles.categorySheet, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <View style={[styles.categoryHeader, { borderColor: tokens.colors.borderNeutral }]}>
            <ThemedText style={[styles.categoryHeaderTitle, { color: tokens.colors.text }]}>{t.bookingConfirmTitle}</ThemedText>
            <TouchableOpacity onPress={() => setBookingDialogSlot(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={tokens.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 14 }}>
            <View style={[styles.bookingSlotSummary, { borderColor: tokens.colors.borderNeutral, backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg }]}>
              <Ionicons name="time-outline" size={18} color={tokens.colors.primary} />
              <ThemedText style={[styles.bookingSlotSummaryText, { color: tokens.colors.text }]}>
                {new Date(`${bookingDialogSlot.date}T00:00:00`).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}{bookingDialogSlot.startTime} - {bookingDialogSlot.endTime}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted, marginBottom: 6 }]}>{t.bookingMessageLabel}</ThemedText>
              <ThemedTextInput
                value={bookingMessage}
                onChangeText={setBookingMessage}
                placeholder={t.bookingMessagePlaceholder}
                placeholderTextColor={tokens.colors.placeholder}
                style={[styles.bookingMessageInput, { color: tokens.colors.text, borderColor: tokens.colors.borderNeutral }]}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => setBookingDialogSlot(null)}
                style={[styles.actionButton, styles.cancelButton, { borderColor: tokens.colors.borderNeutral }]}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.actionButtonText, { color: tokens.colors.text }]}>{t.cancelBtn}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitBooking}
                style={[styles.actionButton, styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                activeOpacity={0.8}
                disabled={bookingSubmitting}
              >
                {bookingSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>{t.bookingSendRequest}</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )}

    <ConfirmDialog
      visible={confirmVisible}
      title={confirmTitle}
      message={confirmMessage}
      icon={confirmIcon}
      confirmColor={confirmColor}
      onConfirm={() => confirmAction?.()}
      onCancel={() => setConfirmVisible(false)}
    />

    <Toast
      visible={toastVisible}
      message={toastMessage}
      type={toastType}
      duration={5000}
      onHide={() => setToastVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
    pointerEvents: 'none', // allow touches to pass through the centered title so underlying buttons are tappable
    // RN Text does not support pointerEvents on all platforms reliably, so ensure hitSlop on buttons as well
    // leave as-is; semantic comment only
  },

  titleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  
  // Profile Header Card
  profileHeaderCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: { 
    width: 80, 
    height: 80,
    marginRight: 16,
    position: 'relative',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarPlaceholder: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
    overflow: 'hidden',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    // color injected at runtime from tokens
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  registerDate: {
    fontSize: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  // Location Section
  locationSection: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  specifyLink: {
    fontSize: 13,
  },
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: {
    fontSize: 14,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },

  // Dashboard Cards
  dashboardCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  
  // Info Grid
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Availability schedule card
  availabilityEnableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  availabilityChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  availabilityDayLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  availabilityTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityTimeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  availabilityTimeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  availabilitySummaryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilitySummaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '47%',
  },
  availabilitySummaryChipDay: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  availabilitySummaryChipTime: {
    fontSize: 12,
  },

  // Availability calendar (current month)
  availabilityCalendarSubtitle: {
    fontSize: 12,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  availabilityCalendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  availabilityCalendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  availabilityCalendarRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  availabilityCalendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 2,
  },
  availabilityCalendarDayNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityCalendarDayNumText: {
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityCalendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  availabilityCalendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  availabilityCalendarLegendText: {
    fontSize: 12,
  },

  // Booking widget
  bookingDayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 64,
  },
  bookingDayChipWeekday: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  bookingDayChipDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  bookingSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookingSlotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  bookingSlotChipUnavailable: {
    opacity: 0.4,
  },
  bookingSlotChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookingSlotSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookingSlotSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textTransform: 'capitalize',
  },
  bookingMessageInput: {
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Edit Mode Styles
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editInput: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Announcement Stats
  announcementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  // Map wrappers for WebView/iframe
  mapInnerWrapper: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  mapWebview: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  locationMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anaisImage: {
    width: 100,
    height: 100,
    marginBottom: -12,
  },

  // Announcements List Styles
  announcementsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAnnouncementsContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyAnnouncementsText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  announcementsList: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  announcementCard: {
    width: 150,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementImage: {
    width: '100%',
    height: 120,
    // backgroundColor now provided dynamically via tokens.colors.placeholderBg
  },
  announcementInfo: {
    padding: 10,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 16,
  },
  announcementLocation: {
    fontSize: 11,
    lineHeight: 14,
  },

  // Reviews Section Styles
  reviewsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noReviewsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noReviewsImage: {
    width: 210,
    height: 210,
    marginBottom:-40,
  },
  noReviewsText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  ratingsSummary: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  ratingsLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  ratingScore: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  ratingsRight: {
    flex: 1,
    gap: 4,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 11,
    width: 30,
    fontFamily: 'Poppins-Regular',
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 11,
    width: 20,
    textAlign: 'right',
    fontFamily: 'Poppins-Regular',
  },
  recentReviewsSection: {
    gap: 12,
  },
  reviewCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  reviewRatingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    // backgroundColor provided dynamically via tokens.colors.rating
  },
  reviewRatingBadgeDark: {
    // deprecated: replaced by semantic tokens.colors.rating
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    // borderTopColor can be injected dynamically if needed
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  reviewLikes: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  viewAllButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Bold',
  },
  // Location picker modal styles
  categoryOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  categorySheet: { maxHeight: '75%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  categoryHeaderTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Poppins-SemiBold' },
  closeBtn: { padding: 6, borderRadius: 8 },
  categoryList: { },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  categoryLabel: { fontSize: 15, fontWeight: '500', fontFamily: 'Poppins-Medium' },
});