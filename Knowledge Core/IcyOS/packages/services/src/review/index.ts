import { UUID } from '@icyos/shared';
import { ReviewRepository } from '@icyos/database';
export class ReviewService {
  constructor(private reviewRepo: ReviewRepository) {}
  async recordReview(sessionId: UUID, score: number): Promise<boolean> {
    return this.reviewRepo.recordReview(sessionId, score);
  }
}
