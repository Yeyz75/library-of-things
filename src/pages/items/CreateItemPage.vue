<template>
  <AppLayout>
    <div class="container py-8">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Add New Item</h1>
          <p class="text-gray-600 mt-2">Share something amazing with your community</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="card">
            <!-- Item Images -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              <div class="mt-2">
                <div
                  class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <PhotoIcon class="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </div>

              <!-- Preview Images -->
              <div v-if="selectedFiles.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    :src="getFilePreview(file)"
                    :alt="`Preview ${index + 1}`"
                    class="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    @click="removeFile(index)"
                    class="absolute top-2 right-2 bg-error-600 text-white rounded-full p-1 hover:bg-error-700 transition-colors"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Item Details -->
            <div class="space-y-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Item Title <span class="text-error-500">*</span>
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="input"
                  :class="{ 'border-error-500': errors.title }"
                  placeholder="What are you sharing?"
                />
                <p v-if="errors.title" class="mt-1 text-sm text-error-600">{{ errors.title }}</p>
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                  Description <span class="text-error-500">*</span>
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  required
                  rows="4"
                  class="input resize-none"
                  :class="{ 'border-error-500': errors.description }"
                  placeholder="Describe your item, its condition, and any special instructions..."
                ></textarea>
                <p v-if="errors.description" class="mt-1 text-sm text-error-600">{{ errors.description }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                    Category <span class="text-error-500">*</span>
                  </label>
                  <select
                    id="category"
                    v-model="form.category"
                    required
                    class="input"
                    :class="{ 'border-error-500': errors.category }"
                  >
                    <option value="">Select a category</option>
                    <option value="tools">Tools</option>
                    <option value="electronics">Electronics</option>
                    <option value="books">Books</option>
                    <option value="sports">Sports & Recreation</option>
                    <option value="home">Home & Kitchen</option>
                    <option value="garden">Garden & Outdoor</option>
                    <option value="clothing">Clothing & Accessories</option>
                    <option value="games">Games & Toys</option>
                    <option value="other">Other</option>
                  </select>
                  <p v-if="errors.category" class="mt-1 text-sm text-error-600">{{ errors.category }}</p>
                </div>

                <div>
                  <label for="condition" class="block text-sm font-medium text-gray-700 mb-1">
                    Condition <span class="text-error-500">*</span>
                  </label>
                  <select
                    id="condition"
                    v-model="form.condition"
                    required
                    class="input"
                    :class="{ 'border-error-500': errors.condition }"
                  >
                    <option value="">Select condition</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  <p v-if="errors.condition" class="mt-1 text-sm text-error-600">{{ errors.condition }}</p>
                </div>
              </div>

              <div>
                <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
                  Location <span class="text-error-500">*</span>
                </label>
                <input
                  id="location"
                  v-model="form.location"
                  type="text"
                  required
                  class="input"
                  :class="{ 'border-error-500': errors.location }"
                  placeholder="City, State or general area"
                />
                <p v-if="errors.location" class="mt-1 text-sm text-error-600">{{ errors.location }}</p>
              </div>

              <div>
                <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Optional)
                </label>
                <input
                  id="tags"
                  v-model="tagsInput"
                  type="text"
                  class="input"
                  placeholder="Separate tags with commas (e.g., power tools, construction, DIY)"
                />
                <p class="text-xs text-gray-500 mt-1">Add relevant tags to help others find your item</p>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="submitError" class="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md">
              <p class="text-sm">{{ submitError }}</p>
            </div>

            <!-- Submit Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="btn-primary flex items-center justify-center"
              >
                <BaseLoader v-if="isSubmitting" size="sm" class="mr-2" />
                {{ isSubmitting ? 'Adding Item...' : 'Add Item' }}
              </button>
              <router-link to="/dashboard" class="btn-secondary">
                Cancel
              </router-link>
            </div>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import type { Item, ItemCategory } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const itemsStore = useItemsStore();

const { currentUser, userId } = storeToRefs(authStore);

const fileInput = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);
const isSubmitting = ref(false);
const submitError = ref('');
const tagsInput = ref('');

const form = reactive({
  title: '',
  description: '',
  category: '' as ItemCategory | '',
  condition: '' as Item['condition'] | '',
  location: '',
});

const errors = reactive({
  title: '',
  description: '',
  category: '',
  condition: '',
  location: '',
});

function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  // Validate title
  if (!form.title.trim()) {
    errors.title = 'Item title is required';
    isValid = false;
  } else if (form.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
    isValid = false;
  }

  // Validate description
  if (!form.description.trim()) {
    errors.description = 'Description is required';
    isValid = false;
  } else if (form.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
    isValid = false;
  }

  // Validate category
  if (!form.category) {
    errors.category = 'Please select a category';
    isValid = false;
  }

  // Validate condition
  if (!form.condition) {
    errors.condition = 'Please select item condition';
    isValid = false;
  }

  // Validate location
  if (!form.location.trim()) {
    errors.location = 'Location is required';
    isValid = false;
  }

  return isValid;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
}

function handleDrop(event: DragEvent) {
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

function addFiles(files: File[]) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  const validFiles = imageFiles.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
  
  selectedFiles.value = [...selectedFiles.value, ...validFiles].slice(0, 8); // Max 8 images
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function getFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

async function handleSubmit() {
  if (!validateForm() || !currentUser.value || !userId.value) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = '';

  try {
    // Prepare tags
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Create item data
    const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as ItemCategory,
      condition: form.condition as Item['condition'],
      location: form.location.trim(),
      ownerId: userId.value,
      ownerName: currentUser.value.displayName || currentUser.value.email || 'Unknown',
      ownerEmail: currentUser.value.email || '',
      isAvailable: true,
      imageUrls: [],
      tags,
    };

    // Create the item first
    const itemId = await itemsStore.createItem(itemData);

    // Upload images if any
    if (selectedFiles.value.length > 0) {
      const imageUrls = await itemsStore.uploadItemImages(itemId, selectedFiles.value);
      
      // Update item with image URLs
      await itemsStore.updateItem(itemId, { imageUrls });
    }

    // Redirect to the new item
    router.push(`/items/${itemId}`);
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to create item';
  } finally {
    isSubmitting.value = false;
  }
}
</script>