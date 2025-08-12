import type { TrustLevelModel } from '@/types/models';

export const trustCalculationService = {
  calculateTrustLevel(
    averageRating: number,
    totalReviews: number,
    successfulLoans: number
  ): TrustLevelModel {
    if (averageRating >= 4.8 && totalReviews >= 20 && successfulLoans >= 15)
      return 'Platinum';
    if (averageRating >= 4.5 && totalReviews >= 10 && successfulLoans >= 8)
      return 'Gold';
    if (averageRating >= 4.0 && totalReviews >= 5 && successfulLoans >= 3)
      return 'Silver';
    return 'Bronze';
  },

  calculateTrustScore(
    averageRating: number,
    totalReviews: number,
    successfulLoans: number,
    cancelledLoans: number
  ): number {
    const ratingScore = (averageRating / 5) * 40; // Max 40 points
    const reviewScore = Math.min(totalReviews * 2, 30); // Max 30 points
    const loanScore = Math.min(successfulLoans * 2, 25); // Max 25 points
    const penaltyScore = Math.max(0, 5 - cancelledLoans * 2); // Max 5 points, penalty for cancellations

    return Math.round(ratingScore + reviewScore + loanScore + penaltyScore);
  },
};
