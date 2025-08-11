<template>
  <div class="star-rating" :class="{ interactive: interactive }">
    <div class="stars-container">
      <div
        v-for="star in 5"
        :key="star"
        class="star"
        :class="{
          filled: star <= Math.floor(rating),
          half: star === Math.ceil(rating) && rating % 1 >= 0.5,
          interactive: interactive,
        }"
        @click="interactive && $emit('update:rating', star)"
        @mouseover="interactive && (hoverRating = star)"
        @mouseleave="interactive && (hoverRating = 0)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            :fill="getStarFill(star)"
            :stroke="getStarStroke()"
            stroke-width="1"
          />
        </svg>
      </div>
    </div>

    <span v-if="showText" class="rating-text">
      {{ formatRating(rating) }}
      <span v-if="reviewCount !== undefined" class="review-count">
        ({{ reviewCount }} {{ reviewCount === 1 ? 'reseña' : 'reseñas' }})
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StarRatingPropsModel } from '@/types';

interface Props extends StarRatingPropsModel {}

const props = withDefaults(defineProps<Props>(), {
  rating: 0,
  showText: true,
  interactive: false,
  size: 'medium',
});

const hoverRating = ref(0);

const displayRating = computed(() => {
  return props.interactive && hoverRating.value > 0
    ? hoverRating.value
    : props.rating;
});

const getStarFill = (starNumber: number): string => {
  const currentRating = displayRating.value;

  if (starNumber <= Math.floor(currentRating)) {
    return '#FCD34D'; // Gold for filled stars
  } else if (
    starNumber === Math.ceil(currentRating) &&
    currentRating % 1 >= 0.5
  ) {
    return 'url(#half-star)'; // Half star
  } else if (props.interactive && starNumber <= hoverRating.value) {
    return '#FCD34D'; // Gold for hovered stars
  }
  return '#E5E7EB'; // Gray for empty stars
};

const getStarStroke = (): string => {
  return '#D1D5DB';
};

const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};
</script>

<style scoped>
.star-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars-container {
  display: flex;
  gap: 0.125rem;
}

.star {
  cursor: default;
  transition: transform 0.1s ease;
}

.star.interactive {
  cursor: pointer;
}

.star.interactive:hover {
  transform: scale(1.1);
}

.rating-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.review-count {
  color: #6b7280;
  font-weight: 400;
}

/* Size variants */
.star-rating.small .star svg {
  width: 12px;
  height: 12px;
}

.star-rating.small .rating-text {
  font-size: 0.75rem;
}

.star-rating.large .star svg {
  width: 20px;
  height: 20px;
}

.star-rating.large .rating-text {
  font-size: 1rem;
}
</style>
