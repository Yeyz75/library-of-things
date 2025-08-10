/* eslint-disable @typescript-eslint/no-explicit-any */
// Global types and interfaces

export interface AnyValue {
  [key: string]: any;
}

export interface User {
  $id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface Item {
  $id: string;
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
  $createdAt: string;
  $updatedAt: string;
  // Optional properties for search/display
  distance?: number;
  rating?: number;
  reviewCount?: number;
}

export interface Reservation {
  $id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl?: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved' | 'active' | 'returned' | 'cancelled';
  startDate: string;
  endDate: string;
  message?: string;
  $createdAt: string;
  $updatedAt: string;
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

export interface FilterOptions {
  categories: string[];
  availableOnly: boolean;
  maxDistance: number;
  minRating: number | null;
  availableFrom: string;
  availableTo: string;
  tags: string[];
  sortBy: string;
}
