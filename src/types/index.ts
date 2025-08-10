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
  // Verification status
  emailVerified?: boolean;
  phoneVerified?: boolean;
  phone?: string;
  // Trust metrics
  averageRating?: number;
  totalReviews?: number;
  successfulLoans?: number;
  totalLoans?: number;
  trustLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
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
  // Rating properties
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
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
  status:
    | 'pending'
    | 'approved'
    | 'active'
    | 'returned'
    | 'cancelled'
    | 'completed';
  startDate: string;
  endDate: string;
  message?: string;
  $createdAt: string;
  $updatedAt: string;
  // Review tracking
  isReviewedByBorrower?: boolean;
  isReviewedByOwner?: boolean;
  reviewDeadline?: string;
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

// Review System Types
export interface Review {
  $id: string;
  reservationId: string;
  itemId: string;
  itemTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewedUserId: string;
  reviewedUserName: string;
  reviewType: 'borrower_to_owner' | 'owner_to_borrower';

  // Ratings
  overallRating: number; // 1-5
  aspectRatings: {
    itemCondition?: number; // For borrower reviews
    communication: number;
    punctuality: number;
    reliability?: number; // For owner reviews
  };

  // Content
  comment: string;
  photos?: string[]; // URLs of uploaded photos

  // Metadata
  isVisible: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface UserStats {
  $id: string; // Same as userId
  userId: string;

  // Loan statistics
  totalLoans: number;
  successfulLoans: number;
  cancelledLoans: number;

  // Review statistics
  averageRating: number;
  totalReviews: number;
  reviewsAsOwner: number;
  reviewsAsBorrower: number;

  // Rating breakdown
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  // Verification badges
  verificationBadges: {
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified?: boolean;
  };

  // Trust metrics
  trustScore: number; // Calculated score 0-100
  trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

  $createdAt: string;
  $updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews: Review[];
}

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

// Review-related types
export type ReviewType = 'borrower_to_owner' | 'owner_to_borrower';
export type TrustLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface CreateReviewData {
  reservationId: string;
  itemId: string;
  reviewerId: string;
  reviewedUserId: string;
  reviewType: ReviewType;
  overallRating: number;
  aspectRatings: {
    itemCondition?: number;
    communication: number;
    punctuality: number;
    reliability?: number;
  };
  comment: string;
  photos?: File[];
}
