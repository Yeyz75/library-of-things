<template>
  <BaseModal
    :is-open="isOpen"
    title="Request to Borrow"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Item Summary -->
      <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
        <div
          class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden"
        >
          <img
            v-if="item.imageUrls?.[0]"
            :src="item.imageUrls[0]"
            :alt="item.title"
            class="w-full h-full object-cover"
          />
          <PhotoIcon v-else class="w-full h-full text-gray-400 p-2" />
        </div>
        <div class="flex-1">
          <h3 class="font-medium text-gray-900">{{ item.title }}</h3>
          <p class="text-sm text-gray-600">Owned by {{ item.ownerName }}</p>
          <p class="text-sm text-gray-500">{{ item.location }}</p>
        </div>
      </div>

      <!-- Reservation Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="startDate"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date <span class="text-error-500">*</span>
            </label>
            <input
              id="startDate"
              v-model="form.startDate"
              type="date"
              :min="minDate"
              required
              class="input"
              :class="{ 'border-error-500': errors.startDate }"
            />
            <p v-if="errors.startDate" class="mt-1 text-sm text-error-600">
              {{ errors.startDate }}
            </p>
          </div>

          <div>
            <label
              for="endDate"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date <span class="text-error-500">*</span>
            </label>
            <input
              id="endDate"
              v-model="form.endDate"
              type="date"
              :min="form.startDate || minDate"
              required
              class="input"
              :class="{ 'border-error-500': errors.endDate }"
            />
            <p v-if="errors.endDate" class="mt-1 text-sm text-error-600">
              {{ errors.endDate }}
            </p>
          </div>
        </div>

        <div>
          <label
            for="message"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Message to Owner (Optional)
          </label>
          <textarea
            id="message"
            v-model="form.message"
            rows="3"
            class="input resize-none"
            placeholder="Tell the owner why you need this item and any relevant details..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Be polite and specific about your needs to increase your chances of
            approval
          </p>
        </div>

        <div
          v-if="submitError"
          class="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md"
        >
          <p class="text-sm">{{ submitError }}</p>
        </div>
      </form>
    </div>

    <template #footer>
      <button @click="$emit('close')" class="btn-secondary">Cancel</button>
      <button
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="btn-primary flex items-center"
      >
        <BaseLoader v-if="isSubmitting" size="sm" class="mr-2" />
        {{ isSubmitting ? 'Sending Request...' : 'Send Request' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { PhotoIcon } from '@heroicons/vue/24/outline';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useReservationsStore } from '@/store/reservations.store';
import type { Reservation } from '@/types';
import type { ReserveModalPropsModel, ReserveModalEmitsModel } from '@/types';
import { storeToRefs } from 'pinia';

interface Props extends ReserveModalPropsModel {}

interface Emits extends ReserveModalEmitsModel {}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const reservationsStore = useReservationsStore();

const { currentUser, userId } = storeToRefs(authStore);

const isSubmitting = ref(false);
const submitError = ref('');

const form = reactive({
  startDate: '',
  endDate: '',
  message: '',
});

const errors = reactive({
  startDate: '',
  endDate: '',
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  errors.startDate = '';
  errors.endDate = '';

  // Validate start date
  if (!form.startDate) {
    errors.startDate = 'Start date is required';
    isValid = false;
  } else {
    const startDate = new Date(form.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.startDate = 'Start date cannot be in the past';
      isValid = false;
    }
  }

  // Validate end date
  if (!form.endDate) {
    errors.endDate = 'End date is required';
    isValid = false;
  } else if (form.startDate && form.endDate) {
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (endDate <= startDate) {
      errors.endDate = 'End date must be after start date';
      isValid = false;
    }

    // Check if the duration is reasonable (not more than 30 days)
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      errors.endDate = 'Reservation cannot be longer than 30 days';
      isValid = false;
    }
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm() || !currentUser.value || !userId.value) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = '';

  try {
    const reservationData: Omit<
      Reservation,
      'id' | '$id' | 'createdAt' | '$createdAt' | 'updatedAt' | '$updatedAt'
    > = {
      itemId: props.item.$id,
      itemTitle: props.item.title,
      itemImageUrl: props.item.imageUrls?.[0] || undefined,
      borrowerId: userId.value,
      borrowerName:
        currentUser.value.name || currentUser.value.email || 'Unknown',
      borrowerEmail: currentUser.value.email || '',
      ownerId: props.item.ownerId,
      ownerName: props.item.ownerName,
      status: 'pending',
      startDate: form.startDate,
      endDate: form.endDate,
      message: form.message.trim() || undefined,
    };

    await reservationsStore.createReservation(reservationData);

    emit('reserved');
  } catch (error) {
    submitError.value =
      error instanceof Error ? error.message : 'Failed to create reservation';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
