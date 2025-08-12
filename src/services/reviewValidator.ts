import type { CreateReviewDataModel } from '@/types/models';

export const reviewValidator = {
  validateReviewData(reviewData: CreateReviewDataModel): void {
    const requiredFields = [
      'reviewerId',
      'reviewedUserId',
      'itemId',
      'reservationId',
      'reviewType',
    ];
    const missingFields = requiredFields.filter(
      (field) => !reviewData[field as keyof CreateReviewDataModel]
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Faltan campos obligatorios: ${missingFields.join(', ')}`
      );
    }
  },
};
