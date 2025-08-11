// Global types and interfaces
// Re-exporting all models from models.ts with and without the Model suffix for backward compatibility

export type { TimerId } from './models';

// Exporting interfaces with Model suffix
export type {
  // Props and Emits interfaces
  BaseLoaderPropsModel,
  BaseModalPropsModel,
  BaseModalEmitsModel,
  BasePaginationPropsModel,
  BasePaginationEmitsModel,
  EmptyStatePropsModel,
  EmptyStateEmitsModel,
  FilterPanelCategoryModel,
  FilterPanelTagModel,
  FilterPanelPropsModel,
  FilterPanelEmitsModel,
  ItemCardPropsModel,
  ItemCardEmitsModel,
  SearchBarSearchFiltersModel,
  SearchBarPropsModel,
  ReserveModalPropsModel,
  ReserveModalEmitsModel,
  HeroSectionCommunityStatsModel,
  HowItWorksStepModel,
  CreateReviewFormPhotoPreviewModel,
  CreateReviewFormPropsModel,
  CreateReviewFormEmitsModel,
  ReviewCardPropsModel,
  StarRatingPropsModel,
  UseAppwriteAppwriteStateModel,
  UseAppwriteCreateUserDataModel,
  UseAppwriteCreateItemDataModel,
  UseAppwriteCreateReservationDataModel,
  ClickOutsideElementModel,
  ToastModel,

  // Data model interfaces
  AnyValue,
  UserModel,
  ItemModel,
  ReservationModel,
  LoadingStateModel,
  ApiResponseModel,
  ItemCategoryModel,
  ReservationStatusModel,
  ReviewModel,
  UserStatsModel,
  ReviewSummaryModel,
  FilterOptionsModel,
  ReviewTypeModel,
  TrustLevelModel,
  CreateReviewDataModel,
} from './models';

// Exporting interfaces without Model suffix for backward compatibility
export type {
  UserModel as User,
  ItemModel as Item,
  ReservationModel as Reservation,
  LoadingStateModel as LoadingState,
  ApiResponseModel as ApiResponse,
  ItemCategoryModel as ItemCategory,
  ReservationStatusModel as ReservationStatus,
  ReviewModel as Review,
  UserStatsModel as UserStats,
  ReviewSummaryModel as ReviewSummary,
  FilterOptionsModel as FilterOptions,
  ReviewTypeModel as ReviewType,
  TrustLevelModel as TrustLevel,
  CreateReviewDataModel as CreateReviewData,
} from './models';
