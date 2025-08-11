<template>
  <div class="create-review-form">
    <h3 class="form-title">Escribir Reseña</h3>

    <form @submit.prevent="submitReview">
      <!-- Overall Rating -->
      <div class="form-group">
        <label class="form-label">Calificación General *</label>
        <StarRating
          v-model:rating="formData.overallRating"
          :interactive="true"
          :show-text="true"
          size="large"
        />
        <p v-if="errors.overallRating" class="error-text">
          {{ errors.overallRating }}
        </p>
      </div>

      <!-- Aspect Ratings -->
      <div class="form-group">
        <label class="form-label">Calificaciones por Aspecto *</label>

        <div class="aspect-ratings-form">
          <!-- Communication (always shown) -->
          <div class="aspect-group">
            <label class="aspect-label">Comunicación</label>
            <StarRating
              v-model:rating="formData.aspectRatings.communication"
              :interactive="true"
              :show-text="false"
              size="medium"
            />
          </div>

          <!-- Punctuality (always shown) -->
          <div class="aspect-group">
            <label class="aspect-label">Puntualidad</label>
            <StarRating
              v-model:rating="formData.aspectRatings.punctuality"
              :interactive="true"
              :show-text="false"
              size="medium"
            />
          </div>

          <!-- Item Condition (only for borrower reviews) -->
          <div v-if="reviewType === 'borrower_to_owner'" class="aspect-group">
            <label class="aspect-label">Estado del Artículo</label>
            <StarRating
              v-model:rating="formData.aspectRatings.itemCondition"
              :interactive="true"
              :show-text="false"
              size="medium"
            />
          </div>

          <!-- Reliability (only for owner reviews) -->
          <div v-if="reviewType === 'owner_to_borrower'" class="aspect-group">
            <label class="aspect-label">Confiabilidad</label>
            <StarRating
              v-model:rating="formData.aspectRatings.reliability"
              :interactive="true"
              :show-text="false"
              size="medium"
            />
          </div>
        </div>
      </div>

      <!-- Comment -->
      <div class="form-group">
        <label for="comment" class="form-label">Comentario *</label>
        <textarea
          id="comment"
          v-model="formData.comment"
          class="form-textarea"
          :class="{ error: errors.comment }"
          rows="4"
          placeholder="Comparte tu experiencia con este préstamo..."
          maxlength="500"
        ></textarea>
        <div class="textarea-footer">
          <p v-if="errors.comment" class="error-text">{{ errors.comment }}</p>
          <span class="character-count">{{ formData.comment.length }}/500</span>
        </div>
      </div>

      <!-- Photo Upload -->
      <div class="form-group">
        <label class="form-label">Fotos (Opcional)</label>
        <div class="photo-upload-area">
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            @change="handleFileSelect"
            class="hidden-input"
          />

          <div
            v-if="selectedPhotos.length === 0"
            class="upload-placeholder"
            @click="triggerFileInput"
          >
            <svg
              class="upload-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            <p>Haz clic para agregar fotos</p>
            <p class="upload-hint">Máximo 3 fotos, 5MB cada una</p>
          </div>

          <div v-else class="photo-preview-grid">
            <div
              v-for="(photo, index) in selectedPhotos"
              :key="index"
              class="photo-preview"
            >
              <img :src="photo.preview" :alt="`Preview ${index + 1}`" />
              <button
                type="button"
                @click="removePhoto(index)"
                class="remove-photo-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div
              v-if="selectedPhotos.length < 3"
              class="add-more-photos"
              @click="triggerFileInput"
            >
              <svg
                class="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </div>
          </div>
        </div>
        <p v-if="errors.photos" class="error-text">{{ errors.photos }}</p>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn-secondary">
          Cancelar
        </button>
        <button type="submit" :disabled="isSubmitting" class="btn-primary">
          <span v-if="isSubmitting">Enviando...</span>
          <span v-else>Enviar Reseña</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { CreateReviewData } from '../../types';
import type {
  CreateReviewFormPhotoPreviewModel,
  CreateReviewFormPropsModel,
  CreateReviewFormEmitsModel,
} from '@/types';
import StarRating from './StarRating.vue';

interface Props extends CreateReviewFormPropsModel {}

const props = defineProps<Props>();

const emit = defineEmits<CreateReviewFormEmitsModel>();

const fileInput = ref<HTMLInputElement>();
const isSubmitting = ref(false);

interface PhotoPreview extends CreateReviewFormPhotoPreviewModel {}

const selectedPhotos = ref<PhotoPreview[]>([]);

const formData = reactive<{
  overallRating: number;
  aspectRatings: {
    communication: number;
    punctuality: number;
    itemCondition?: number;
    reliability?: number;
  };
  comment: string;
}>({
  overallRating: 0,
  aspectRatings: {
    communication: 0,
    punctuality: 0,
    ...(props.reviewType === 'borrower_to_owner' && { itemCondition: 0 }),
    ...(props.reviewType === 'owner_to_borrower' && { reliability: 0 }),
  },
  comment: '',
});

const errors = reactive({
  overallRating: '',
  aspectRatings: '',
  comment: '',
  photos: '',
});

const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = '';
  });

  let isValid = true;

  // Validate overall rating
  if (formData.overallRating === 0) {
    errors.overallRating = 'La calificación general es requerida';
    isValid = false;
  }

  // Validate aspect ratings
  if (
    formData.aspectRatings.communication === 0 ||
    formData.aspectRatings.punctuality === 0
  ) {
    errors.aspectRatings =
      'Todas las calificaciones por aspecto son requeridas';
    isValid = false;
  }

  if (
    props.reviewType === 'borrower_to_owner' &&
    formData.aspectRatings.itemCondition === 0
  ) {
    errors.aspectRatings =
      'La calificación del estado del artículo es requerida';
    isValid = false;
  }

  if (
    props.reviewType === 'owner_to_borrower' &&
    formData.aspectRatings.reliability === 0
  ) {
    errors.aspectRatings = 'La calificación de confiabilidad es requerida';
    isValid = false;
  }

  // Validate comment
  if (!formData.comment.trim()) {
    errors.comment = 'El comentario es requerido';
    isValid = false;
  } else if (formData.comment.length < 10) {
    errors.comment = 'El comentario debe tener al menos 10 caracteres';
    isValid = false;
  }

  return isValid;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files) return;

  const remainingSlots = 3 - selectedPhotos.value.length;
  const filesToProcess = Array.from(files).slice(0, remainingSlots);

  filesToProcess.forEach((file) => {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      errors.photos = 'Cada foto debe ser menor a 5MB';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      errors.photos = 'Solo se permiten archivos de imagen';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedPhotos.value.push({
        file,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  });

  // Clear the input
  target.value = '';
  errors.photos = '';
};

const removePhoto = (index: number) => {
  selectedPhotos.value.splice(index, 1);
};

const submitReview = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const reviewData: CreateReviewData = {
      reservationId: props.reservationId,
      itemId: props.itemId,
      reviewerId: props.reviewerId,
      reviewedUserId: props.reviewedUserId,
      reviewType: props.reviewType,
      overallRating: formData.overallRating,
      aspectRatings: { ...formData.aspectRatings },
      comment: formData.comment.trim(),
      photos: selectedPhotos.value.map((p) => p.file),
    };

    emit('submit', reviewData);
  } catch (error) {
    console.error('Error submitting review:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-review-form {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.aspect-ratings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.aspect-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.aspect-label {
  font-size: 0.875rem;
  color: #374151;
  min-width: 120px;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea.error {
  border-color: #ef4444;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.character-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin: 0;
}

.photo-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
}

.hidden-input {
  display: none;
}

.upload-placeholder {
  text-align: center;
  padding: 2rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.upload-placeholder:hover {
  background-color: #f9fafb;
}

.upload-icon {
  width: 2rem;
  height: 2rem;
  color: #6b7280;
  margin: 0 auto 0.5rem;
}

.upload-placeholder p {
  margin: 0.25rem 0;
  color: #374151;
}

.upload-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.photo-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  max-width: 400px;
}

.photo-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.375rem;
  overflow: hidden;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-photo-btn svg {
  width: 0.75rem;
  height: 0.75rem;
}

.add-more-photos {
  aspect-ratio: 1;
  border: 2px dashed #d1d5db;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-more-photos:hover {
  background-color: #f9fafb;
}

.add-more-photos .upload-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .create-review-form {
    padding: 1rem;
  }

  .aspect-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .aspect-label {
    min-width: auto;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
