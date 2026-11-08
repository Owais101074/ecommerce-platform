export interface ReviewAuthor {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author: ReviewAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
}

export interface ProductReviewsData {
  reviews: Review[];
  summary: ReviewSummary;
}
