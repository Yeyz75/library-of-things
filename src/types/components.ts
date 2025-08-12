/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared TypeScript types for base UI components
 * These types establish consistent interfaces across all base components
 */

import type { VNode } from 'vue';

// Base component props that all components should extend
export interface BaseComponentProps {
  class?: string;
  style?: string | Record<string, any>;
  testId?: string;
}

// Common size variants used across components
export type ComponentSize = 'sm' | 'md' | 'lg';

// Common variant types for styling
export type ComponentVariant = 'default' | 'primary' | 'secondary';

// Badge configuration for rich content display
export interface BadgeConfig {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

// User data interface for UserInfo component
export interface UserData {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  joinDate?: Date;
}

// DescriptionList component types
export interface DescriptionListProps extends BaseComponentProps {
  items: DescriptionItem[];
  orientation?: 'horizontal' | 'vertical';
  size?: ComponentSize;
  divider?: boolean;
  dividerStyle?: 'line' | 'space' | 'dot';
}

export interface DescriptionItem {
  key: string;
  label: string;
  value: string | number | VNode;
  icon?: string;
  valueIcon?: string;
  badge?: BadgeConfig;
}

// ImageGallery component types
export interface ImageGalleryProps extends BaseComponentProps {
  images: GalleryImage[];
  aspectRatio?: 'square' | '4:3' | '16:9';
  showThumbnails?: boolean;
  allowZoom?: boolean;
  placeholder?: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

// StatusBadge component types
export interface StatusBadgeProps extends BaseComponentProps {
  status: StatusType;
  size?: ComponentSize;
  variant?: 'solid' | 'outline' | 'soft';
  showIcon?: boolean;
  showDot?: boolean;
}

export type StatusType =
  | 'available'
  | 'borrowed'
  | 'reserved'
  | 'maintenance'
  | 'inactive';

// UserInfo component types
export interface UserInfoProps extends BaseComponentProps {
  user: UserData;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showRating?: boolean;
  showBadges?: boolean;
  clickable?: boolean;
}

// ActionCard component types
export interface ActionCardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: ActionButton[];
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export interface ActionButton {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

// AdvancedFilters component types
export interface AdvancedFiltersProps extends BaseComponentProps {
  filters: FilterGroup[];
  values?: FilterValues;
  showActiveCount?: boolean;
  collapsible?: boolean;
}

export interface FilterGroup {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export type FilterValues = Record<string, any>;

// ActivityTimeline component types
export interface ActivityTimelineProps extends BaseComponentProps {
  activities: TimelineActivity[];
  showDates?: boolean;
  groupByDate?: boolean;
  variant?: 'default' | 'compact';
}

export interface TimelineActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  actor?: UserData;
  metadata?: Record<string, any>;
}

export type ActivityType =
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'item_borrowed'
  | 'item_returned'
  | 'review_added'
  | 'user_joined'
  | 'item_added'
  | 'maintenance_scheduled';

// StatsCard component types
export interface StatsCardProps extends BaseComponentProps {
  value: number | string;
  label: string;
  icon?: string;
  trend?: TrendData;
  format?: 'number' | 'currency' | 'percentage';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  period?: string;
}

// Event types for component interactions
export interface ComponentEvents {
  // Common events
  click: [event: MouseEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];

  // Specific component events
  'user-click': [user: UserData];
  'image-change': [index: number];
  'filter-change': [filters: FilterValues];
  'action-click': [action: string, data?: any];
}

// Utility types for component composition
export type ComponentSlots = Record<string, any>;
export type ComponentEmits = Record<string, any[]>;

// Theme and styling types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}
