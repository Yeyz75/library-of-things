// Global types and interfaces

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  imageUrls: string[];
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  location: string;
  isAvailable: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl?: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved' | 'active' | 'returned' | 'cancelled';
  startDate: Date;
  endDate: Date;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export type ItemCategory = 
  | 'tools'
  | 'electronics'
  | 'books'
  | 'sports'
  | 'home'
  | 'garden'
  | 'clothing'
  | 'games'
  | 'other';

export type ReservationStatus = Reservation['status'];