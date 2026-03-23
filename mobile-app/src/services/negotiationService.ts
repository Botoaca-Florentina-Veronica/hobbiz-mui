// mobile-app/src/services/negotiationService.ts
import api from './api';

export interface NegotiationOffer {
  offeredBy: string;
  price: number;
  message?: string;
  timestamp: string;
  action: 'offer' | 'counter_offer' | 'accept' | 'reject';
}

export interface Negotiation {
  _id: string;
  announcement: {
    _id: string;
    title: string;
    images?: string[];
  };
  buyer: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  originalPrice?: number;
  currentPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offer' | 'pending_confirmation' | 'confirmed' | 'finalized';
  offerHistory: NegotiationOffer[];
  lastActionBy: string;
  finalizedAt?: string;
  lastActionAt: string;
  createdAt: string;
}

export interface CreateNegotiationData {
  announcementId: string;
  proposedPrice: number;
  message?: string;
}

export interface CounterOfferData {
  counterPrice?: number;
  newPrice?: number;
  message?: string;
}

export interface RejectOfferData {
  message?: string;
}

class NegotiationService {
  // Create a new negotiation (buyer proposes a price)
  async createNegotiation(data: CreateNegotiationData): Promise<{ negotiation: Negotiation }> {
    const response = await api.post('/api/negotiations', data);
    return response.data;
  }

  // Get all negotiations for current user
  async getUserNegotiations(params?: { status?: string; role?: 'buyer' | 'seller' }): Promise<{ negotiations: Negotiation[] }> {
    const response = await api.get('/api/negotiations', { params });
    return response.data;
  }

  // Get negotiations for a specific announcement
  async getAnnouncementNegotiations(announcementId: string): Promise<{ negotiations: Negotiation[] }> {
    const response = await api.get(`/api/negotiations/announcement/${announcementId}`);
    return response.data;
  }

  // Get a single negotiation by ID
  async getNegotiationById(id: string): Promise<{ negotiation: Negotiation }> {
    const response = await api.get(`/api/negotiations/${id}`);
    return response.data;
  }

  // Seller accepts the current offer
  async acceptOffer(id: string): Promise<{ negotiation: Negotiation }> {
    const response = await api.post(`/api/negotiations/${id}/accept`);
    return response.data;
  }

  // Seller rejects the current offer
  async rejectOffer(id: string, data?: RejectOfferData): Promise<{ negotiation: Negotiation }> {
    const response = await api.post(`/api/negotiations/${id}/reject`, data);
    return response.data;
  }

  // Seller sends a counter offer
  async counterOffer(id: string, data: CounterOfferData): Promise<{ negotiation: Negotiation }> {
    const response = await api.post(`/api/negotiations/${id}/counter-offer`, data);
    return response.data;
  }

  // Buyer accepts seller's counter offer
  async acceptCounterOffer(id: string): Promise<{ negotiation: Negotiation }> {
    const response = await api.post(`/api/negotiations/${id}/accept-counter`);
    return response.data;
  }

  // Buyer sends a new offer (responds to counter offer)
  async buyerCounterOffer(id: string, data: CounterOfferData): Promise<{ negotiation: Negotiation }> {
    const response = await api.post(`/api/negotiations/${id}/buyer-counter`, data);
    return response.data;
  }

  // Confirm collaboration (both users need to confirm)
  async confirmCollaboration(id: string): Promise<{ negotiation: Negotiation; collaborationEstablished: boolean; sellerNewBalance?: number }> {
    const response = await api.post(`/api/negotiations/${id}/confirm`);
    return response.data;
  }

  // Finalize negotiation (buyer confirms transaction)
  async finalizeNegotiation(id: string): Promise<{ negotiation: Negotiation; sellerNewBalance: number }> {
    const response = await api.post(`/api/negotiations/${id}/finalize`);
    return response.data;
  }

  // Cancel negotiation
  async cancelNegotiation(id: string): Promise<{ negotiation: Negotiation }> {
    const response = await api.delete(`/api/negotiations/${id}`);
    return response.data;
  }
}

export default new NegotiationService();
