export interface ReviewAuthor {
  id: string;
  name: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  author: ReviewAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface ReviewListResult {
  reviews: ReviewDTO[];
  summary: RatingSummary;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
