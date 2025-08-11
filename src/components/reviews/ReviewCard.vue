<template>
  <div class="review-card">
    <!-- Reviewer Info -->
    <div class="reviewer-header">
      <div class="reviewer-info">
        <div class="reviewer-avatar">
          {{
            review.reviewerName
              ? review.reviewerName.charAt(0).toUpperCase()
              : ''
          }}
        </div>
        <div class="reviewer-details">
          <h4 class="reviewer-name">{{ review.reviewerName }}</h4>
          <p class="review-date">
            {{ formatDate(review.$createdAt ? review.$createdAt : '') }}
          </p>
        </div>
      </div>

      <div class="review-type-badge" :class="reviewTypeBadgeClass">
        {{ reviewTypeText }}
      </div>
    </div>

    <!-- Overall Rating -->
    <div class="overall-rating">
      <StarRating
        :rating="review.overallRating"
        :show-text="true"
        size="medium"
      />
    </div>

    <!-- Aspect Ratings -->
    <div v-if="aspectRatings.length > 0" class="aspect-ratings">
      <div
        v-for="aspect in aspectRatings"
        :key="aspect.key"
        class="aspect-rating"
      >
        <span class="aspect-label">{{ aspect.label }}:</span>
        <StarRating :rating="aspect.value" :show-text="false" size="small" />
        <span class="aspect-value">{{ aspect.value }}/5</span>
      </div>
    </div>

    <!-- Review Comment -->
    <div v-if="review.comment" class="review-comment">
      <p>{{ review.comment }}</p>
    </div>

    <!-- Review Photos -->
    <div v-if="review.photos && review.photos.length > 0" class="review-photos">
      <div class="photos-grid">
        <img
          v-for="(photo, index) in review.photos"
          :key="index"
          :src="photo"
          :alt="`Foto de reseña ${index + 1}`"
          class="review-photo"
          @click="openPhotoModal(photo)"
        />
      </div>
    </div>

    <!-- Item Info (if showing in user profile) -->
    <div v-if="showItemInfo" class="item-info">
      <p class="item-title">Artículo: {{ review.itemTitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewCardPropsModel } from '@/types/models';
import StarRating from './StarRating.vue';

interface Props extends ReviewCardPropsModel {}

const props = withDefaults(defineProps<Props>(), {
  showItemInfo: false,
});

const emit = defineEmits<{
  'photo-click': [photoUrl: string];
}>();

const reviewTypeText = computed(() => {
  return props.review.reviewType === 'borrower_to_owner'
    ? 'Como prestamista'
    : 'Como prestatario';
});

const reviewTypeBadgeClass = computed(() => {
  return props.review.reviewType === 'borrower_to_owner'
    ? 'badge-owner'
    : 'badge-borrower';
});

const aspectRatings = computed(() => {
  const aspects = [];
  const ratings = props.review.aspectRatings;

  if (ratings?.itemCondition !== undefined) {
    aspects.push({
      key: 'itemCondition',
      label: 'Estado del artículo',
      value: ratings?.itemCondition,
    });
  }

  if (ratings?.communication !== undefined) {
    aspects.push({
      key: 'communication',
      label: 'Comunicación',
      value: ratings?.communication,
    });
  }

  if (ratings?.punctuality !== undefined) {
    aspects.push({
      key: 'punctuality',
      label: 'Puntualidad',
      value: ratings?.punctuality,
    });
  }

  if (ratings?.reliability !== undefined) {
    aspects.push({
      key: 'reliability',
      label: 'Confiabilidad',
      value: ratings.reliability,
    });
  }

  return aspects;
});

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const openPhotoModal = (photoUrl: string) => {
  emit('photo-click', photoUrl);
};
</script>

<style scoped>
.review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.reviewer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reviewer-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.reviewer-details {
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.review-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.review-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-owner {
  background: #dbeafe;
  color: #1e40af;
}

.badge-borrower {
  background: #d1fae5;
  color: #065f46;
}

.overall-rating {
  margin-bottom: 1rem;
}

.aspect-ratings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.aspect-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.aspect-label {
  font-size: 0.875rem;
  color: #374151;
  min-width: 120px;
}

.aspect-value {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

.review-comment {
  margin-bottom: 1rem;
}

.review-comment p {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.review-photos {
  margin-bottom: 1rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  max-width: 400px;
}

.review-photo {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.review-photo:hover {
  transform: scale(1.05);
}

.item-info {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.item-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 640px) {
  .review-card {
    padding: 1rem;
  }

  .reviewer-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .aspect-ratings {
    padding: 0.75rem;
  }

  .aspect-rating {
    flex-wrap: wrap;
  }

  .aspect-label {
    min-width: auto;
  }
}
</style>
