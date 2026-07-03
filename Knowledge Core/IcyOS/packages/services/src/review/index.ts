import { UUID } from '@icyos/shared';
import { ReviewRepository } from '@icyos/database';
export class ReviewService {
  private reviewRepo: ReviewRepository;
  constructor(reviewRepo?: ReviewRepository) {
    this.reviewRepo = reviewRepo || new ReviewRepository();
  }
  async recordReview(sessionId: UUID, score: number): Promise<boolean> {
    return this.reviewRepo.recordReview(sessionId, score);
  }
}
