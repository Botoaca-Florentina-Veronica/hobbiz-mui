import api from './api';

export type AdminListStatus = 'open' | 'resolved' | 'all';

export interface ContactFallbackItem {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  ip?: string;
  userAgent?: string;
  mailError?: {
    message?: string;
    code?: string;
    raw?: string;
  };
}

export interface AnnouncementReportItem {
  _id: string;
  reason: 'spam' | 'fake' | 'abusive' | 'wrong_category' | 'other';
  details?: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
  announcement?: {
    _id?: string;
    title?: string;
    category?: string;
    location?: string;
    user?: string;
  } | string;
  reporter?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  announcementOwner?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export const getContactFallbacks = async (
  status: AdminListStatus = 'open'
): Promise<{ items: ContactFallbackItem[] }> => {
  const response = await api.get(`/api/contact/fallbacks?status=${encodeURIComponent(status)}`);
  return response.data;
};

export const resolveContactFallback = async (id: string): Promise<{ success: boolean; item: ContactFallbackItem }> => {
  const response = await api.patch(`/api/contact/fallbacks/${id}/resolve`);
  return response.data;
};

export const deleteContactFallback = async (id: string): Promise<{ success: boolean; id: string }> => {
  const response = await api.delete(`/api/contact/fallbacks/${id}`);
  return response.data;
};

export const getAnnouncementReports = async (
  status: AdminListStatus = 'open'
): Promise<{ items: AnnouncementReportItem[] }> => {
  const response = await api.get(`/api/reports?status=${encodeURIComponent(status)}`);
  return response.data;
};

export const resolveAnnouncementReport = async (
  id: string,
  data: { adminNote?: string } = {}
): Promise<{ success: boolean; item: AnnouncementReportItem }> => {
  const response = await api.patch(`/api/reports/${id}/resolve`, data);
  return response.data;
};

export const deleteAnnouncementReport = async (id: string): Promise<{ success: boolean; id: string }> => {
  const response = await api.delete(`/api/reports/${id}`);
  return response.data;
};
