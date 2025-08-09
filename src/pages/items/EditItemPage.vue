<template>
  <AppLayout>
    <div class="container py-8">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Edit Item
          </h1>
          <p class="text-gray-600 mt-2 dark:text-gray-300">
            Update your item details
          </p>
        </div>

        <div v-if="loading" class="flex justify-center py-12">
          <BaseLoader size="lg" />
        </div>

        <div
          v-else-if="error"
          class="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md"
        >
          <p class="text-sm">{{ error }}</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div class="card">
            <!-- Item Images -->
            <div class="mb-6">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Photos (Optional)
              </label>

              <!-- Existing Images -->
              <div v-if="existingImages.length > 0" class="mb-4">
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Current images:
                </p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    v-for="(imageUrl, index) in existingImages"
                    :key="`existing-${index}`"
                    class="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <img
                      :src="imageUrl"
                      :alt="`Current image ${index + 1}`"
                      class="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      @click="removeExistingImage(index)"
                      class="absolute top-2 right-2 bg-error-600 text-white dark:bg-error-700 dark:text-error-300 rounded-full p-1 hover:bg-error-700 transition-colors"
                    >
                      <XMarkIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload New Images -->
              <div class="mt-2">
                <div
                  class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <PhotoIcon class="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span class="font-medium text-primary-600"
                      >Click to upload</span
                    >
                    or drag and drop
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB each
                  </p>
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

              <!-- Preview New Images -->
              <div v-if="selectedFiles.length > 0" class="mt-4">
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  New images to add:
                </p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="`new-${index}`"
                    class="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <img
                      :src="getFilePreview(file)"
                      :alt="`Preview ${index + 1}`"
                      class="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      @click="removeFile(index)"
                      class="absolute top-2 right-2 bg-error-600 text-white dark:bg-error-700 dark:text-error-300 rounded-full p-1 hover:bg-error-700 transition-colors"
                    >
                      <XMarkIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Item Details -->
            <div class="space-y-4">
              <div>
                <label
                  for="title"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
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
                <p v-if="errors.title" class="mt-1 text-sm text-error-600">
                  {{ errors.title }}
                </p>
              </div>

              <div>
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
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
                <p
                  v-if="errors.description"
                  class="mt-1 text-sm text-error-600"
                >
                  {{ errors.description }}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="category"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
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
                  <p v-if="errors.category" class="mt-1 text-sm text-error-600">
                    {{ errors.category }}
                  </p>
                </div>

                <div>
                  <label
                    for="condition"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <p
                    v-if="errors.condition"
                    class="mt-1 text-sm text-error-600"
                  >
                    {{ errors.condition }}
                  </p>
                </div>
              </div>

              <div>
                <label
                  for="location"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <p v-if="errors.location" class="mt-1 text-sm text-error-600">
                  {{ errors.location }}
                </p>
              </div>

              <div>
                <label
                  for="tags"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tags (Optional)
                </label>
                <input
                  id="tags"
                  v-model="tagsInput"
                  type="text"
                  class="input"
                  placeholder="Separate tags with commas (e.g., power tools, construction, DIY)"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add relevant tags to help others find your item
                </p>
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    v-model="form.isAvailable"
                    type="checkbox"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Item is available for borrowing
                  </span>
                </label>
              </div>
            </div>

            <!-- Error Display -->
            <div
              v-if="submitError"
              class="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md"
            >
              <p class="text-sm">{{ submitError }}</p>
            </div>

            <!-- Submit Buttons -->
            <div
              class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
            >
              <button
                type="submit"
                :disabled="isSubmitting"
                class="btn-primary flex items-center justify-center"
              >
                <BaseLoader v-if="isSubmitting" size="sm" class="mr-2" />
                {{ isSubmitting ? 'Updating Item...' : 'Update Item' }}
              </button>
              <router-link :to="`/items/${itemId}`" class="btn-secondary">
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import type { Item, ItemCategory } from '@/types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const itemsStore = useItemsStore();

const itemId = route.params.id as string;

const fileInput = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);
const existingImages = ref<string[]>([]);
const loading = ref(true);
const isSubmitting = ref(false);
const error = ref('');
const submitError = ref('');
const tagsInput = ref('');

const form = reactive({
  title: '',
  description: '',
  category: '' as ItemCategory | '',
  condition: '' as Item['condition'] | '',
  location: '',
  isAvailable: true,
});

const errors = reactive({
  title: '',
  description: '',
  category: '',
  condition: '',
  location: '',
});

onMounted(async () => {
  await loadItem();
});

async function loadItem() {
  try {
    loading.value = true;
    error.value = '';

    const item = await itemsStore.getItemById(itemId);

    if (!item) {
      error.value = 'Item not found';
      return;
    }

    // Check if user owns this item
    if (item.ownerId !== authStore.userId) {
      error.value = 'You can only edit your own items';
      return;
    }

    // Populate form with existing data
    form.title = item.title;
    form.description = item.description;
    form.category = item.category;
    form.condition = item.condition;
    form.location = item.location;
    form.isAvailable = item.isAvailable;

    existingImages.value = [...item.imageUrls];
    tagsInput.value = item.tags.join(', ');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load item';
  } finally {
    loading.value = false;
  }
}

function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  Object.keys(errors).forEach((key) => {
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
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  const validFiles = imageFiles.filter((file) => file.size <= 10 * 1024 * 1024); // 10MB limit

  const totalImages =
    existingImages.value.length +
    selectedFiles.value.length +
    validFiles.length;
  const maxImages = 8;

  if (totalImages > maxImages) {
    const allowedFiles =
      maxImages - existingImages.value.length - selectedFiles.value.length;
    selectedFiles.value = [
      ...selectedFiles.value,
      ...validFiles.slice(0, allowedFiles),
    ];
  } else {
    selectedFiles.value = [...selectedFiles.value, ...validFiles];
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function removeExistingImage(index: number) {
  existingImages.value.splice(index, 1);
}

function getFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = '';

  try {
    // Prepare tags
    const tags = tagsInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Upload new images if any
    let newImageUrls: string[] = [];
    if (selectedFiles.value.length > 0) {
      newImageUrls = await itemsStore.uploadItemImages(
        itemId,
        selectedFiles.value
      );
    }

    // Combine existing and new image URLs
    const allImageUrls = [...existingImages.value, ...newImageUrls];

    // Prepare update data
    const updateData: Partial<Item> = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as ItemCategory,
      condition: form.condition as Item['condition'],
      location: form.location.trim(),
      isAvailable: form.isAvailable,
      imageUrls: allImageUrls,
      tags,
    };

    // Update the item
    await itemsStore.updateItem(itemId, updateData);

    // Redirect to the item detail page
    router.push(`/items/${itemId}`);
  } catch (err) {
    submitError.value =
      err instanceof Error ? err.message : 'Failed to update item';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
