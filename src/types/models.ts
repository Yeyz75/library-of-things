// Global types and interfaces with Model suffix
export interface AnyValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  string?: any;
}
// Props and Emits interfaces
export interface BaseLoaderPropsModel {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  center?: boolean;
}

export interface BaseModalPropsModel {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  closeOnBackdrop?: boolean;
}

export interface BaseModalEmitsModel {
  close: [];
}

export interface BasePaginationPropsModel {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  maxVisiblePages?: number;
}

export interface BasePaginationEmitsModel {
  'page-change': [page: number];
  'page-size-change': [pageSize: number];
}

export interface EmptyStatePropsModel {
  type?:
    | 'default'
    | 'search'
    | 'error'
    | 'empty'
    | 'loading'
    | 'no-results'
    | 'no-items'
    | 'no-favorites'
    | 'no-reservations';
  title?: string;
  description?: string;
  actionText?: string;
  actionIcon?: AnyValue;
  size?: 'sm' | 'md' | 'lg';
  icon?: AnyValue;
}

export interface EmptyStateEmitsModel {
  action: [];
}

export interface FilterPanelCategoryModel {
  key: string;
  name: string;
  count?: number;
}

export interface FilterPanelTagModel {
  name: string;
  count: number;
}

export interface FilterPanelPropsModel {
  filters: FilterOptionsModel;
  categories: FilterPanelCategoryModel[];
  availableTags?: FilterPanelTagModel[];
  showLocationFilter?: boolean;
  showRatingFilter?: boolean;
  showDateFilter?: boolean;
  showTagsFilter?: boolean;
}

export interface FilterPanelEmitsModel {
  'update:filters': [filters: FilterOptionsModel];
  'apply-filters': [filters: FilterOptionsModel];
}

export interface ItemCardPropsModel {
  item: ItemModel;
  clickable?: boolean;
  showFavorite?: boolean;
  showQuickActions?: boolean;
  showDistance?: boolean;
  showRating?: boolean;
  showActions?: boolean;
  loading?: boolean;
  categories?: Array<{ key: string; name: string }>;
  isFavorite?: boolean;
}

export interface ItemCardEmitsModel {
  click: [item: ItemModel];
  reserve: [item: ItemModel];
  share: [item: ItemModel];
  viewDetails: [item: ItemModel];
  toggleFavorite: [item: ItemModel];
}

export interface SearchBarSearchFiltersModel {
  category?: string;
  availability?: string;
  distance?: string;
}

export interface SearchBarPropsModel {
  placeholder?: string;
  categories?: Array<{ key?: string; name?: string }>;
  suggestions?: string[];
  modelValue?: string;
  prominent?: boolean;
}

export interface ReserveModalPropsModel {
  isOpen: boolean;
  item: ItemModel;
}

export interface ReserveModalEmitsModel {
  close: [];
  reserved: [];
}

export interface HeroSectionCommunityStatsModel {
  itemsShared: number;
  co2Saved: number;
  moneySaved: number;
}

export interface HowItWorksStepModel {
  icon: unknown;
  title: string;
  description: string;
}

export interface CreateReviewFormPhotoPreviewModel {
  file: File;
  preview: string;
}

export interface CreateReviewFormPropsModel {
  reservationId: string;
  itemId: string;
  reviewerId: string;
  reviewedUserId: string;
  reviewType: ReviewTypeModel;
}

export interface CreateReviewFormEmitsModel {
  submit: [reviewData: CreateReviewDataModel];
  cancel: [];
}

export interface ReviewCardPropsModel {
  review: ReviewModel;
  showItemInfo?: boolean;
}

export interface StarRatingPropsModel {
  rating?: number;
  reviewCount?: number;
  showText?: boolean;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface UseAppwriteAppwriteStateModel {
  users: UserModel[];
  items: ItemModel[];
  reservations: ReservationModel[];
  currentUser: UserModel | null;
}

export interface UseAppwriteCreateUserDataModel {
  email: string;
  password: string;
  name: string;
}

export interface UseAppwriteCreateItemDataModel {
  title: string;
  description: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  imageUrls: string[];
  location: string;
  tags: string[];
}

export interface UseAppwriteCreateReservationDataModel {
  itemId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export interface ClickOutsideElementModel extends HTMLElement {
  _clickOutsideHandler?: (event: MouseEvent) => void;
}

export interface ToastModel {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration: number;
  progress: number;
  timer?: TimerId;
}

export interface UserModel {
  $id: string;
  email?: string;
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

export interface ItemModel {
  $id: string;
  title?: string;
  description?: string;
  category?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  imageUrls?: string[];
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  location?: string;
  isAvailable?: boolean;
  tags?: string[];
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

export interface ReservationModel {
  $id?: string;
  itemId?: string;
  itemTitle?: string;
  itemImageUrl?: string;
  borrowerId?: string;
  borrowerName?: string;
  borrowerEmail?: string;
  ownerId?: string;
  ownerName?: string;
  status?:
    | 'pending'
    | 'approved'
    | 'active'
    | 'returned'
    | 'cancelled'
    | 'completed';
  startDate?: string;
  endDate?: string;
  message?: string;
  $createdAt: string;
  $updatedAt: string;
  // Review tracking
  isReviewedByBorrower?: boolean;
  isReviewedByOwner?: boolean;
  reviewDeadline?: string;
}

export interface LoadingStateModel {
  isLoading?: boolean;
  error?: string | null;
}

export interface ApiResponseModel<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export type ItemCategoryModel =
  | 'tools'
  | 'electronics'
  | 'books'
  | 'sports'
  | 'home'
  | 'garden'
  | 'clothing'
  | 'games'
  | 'other';

export type ReservationStatusModel = ReservationModel['status'];

// Review System Types
export interface ReviewModel {
  $id: string;
  reservationId?: string;
  itemId?: string;
  itemTitle?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedUserId?: string;
  reviewedUserName?: string;
  reviewType?: 'borrower_to_owner' | 'owner_to_borrower';

  // Ratings
  overallRating?: number; // 1-5
  aspectRatings?: {
    itemCondition?: number; // For borrower reviews
    communication?: number;
    punctuality?: number;
    reliability?: number; // For owner reviews
  };

  // Content
  comment?: string;
  photos?: string[]; // URLs of uploaded photos

  // Metadata
  isVisible?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface UserStatsModel {
  $id: string; // Same as userId
  userId?: string;

  // Loan statistics
  totalLoans?: number;
  successfulLoans?: number;
  cancelledLoans?: number;

  // Review statistics
  averageRating?: number;
  totalReviews?: number;
  reviewsAsOwner?: number;
  reviewsAsBorrower?: number;

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
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
  };

  // Trust metrics
  trustScore?: number; // Calculated score 0-100
  trustLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

  $createdAt?: string;
  $updatedAt?: string;
}

export interface ReviewSummaryModel {
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews?: ReviewModel[];
}

export interface FilterOptionsModel {
  categories?: string[];
  availableOnly?: boolean;
  maxDistance?: number;
  minRating?: number | null;
  availableFrom?: string;
  availableTo?: string;
  tags?: string[];
  sortBy?: string;
}

// Review-related types
export type ReviewTypeModel = 'borrower_to_owner' | 'owner_to_borrower';
export type TrustLevelModel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface CreateReviewDataModel {
  reservationId?: string;
  itemId?: string;
  reviewerId?: string;
  reviewedUserId?: string;
  reviewType?: ReviewTypeModel;
  overallRating?: number;
  aspectRatings?: {
    itemCondition?: number;
    communication?: number;
    punctuality?: number;
    reliability?: number;
  };
  comment?: string;
  photos?: File[];
}

// Type alias for TimerId
export type TimerId = ReturnType<typeof setInterval>;
