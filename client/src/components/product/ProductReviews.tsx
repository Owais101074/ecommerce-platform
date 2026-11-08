import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { useCreateReview, useProductReviews, useUpdateReview } from '@/hooks/useReviews';
import { formatDate, initials } from '@/lib/format';
import type { Product } from '@/types/catalog';
import type { Review } from '@/types/review';

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(value) ? 'fill-accent-500 text-accent-500' : 'text-ink-300'
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function RatingPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (rating: number) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;

        return (
          <button
            key={rating}
            type="button"
            aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
            aria-pressed={value === rating}
            onClick={() => onChange(rating)}
            className="rounded-md p-0.5 transition hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                rating <= value ? 'fill-accent-500 text-accent-500' : 'text-ink-300'
              }`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  isMine,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  review: Review;
  isMine: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (rating: number, comment: string) => void;
  saving: boolean;
}) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);

  return (
    <article className="rounded-2xl border border-ink-200/80 bg-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
            {initials(review.author.name)}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{review.author.name}</p>
            <p className="text-xs text-ink-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stars value={review.rating} />
          {isMine && !editing && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(rating, comment);
          }}
        >
          <RatingPicker value={rating} onChange={setRating} label="Updated rating" />
          <Textarea
            label="Update your review"
            value={comment}
            maxLength={1000}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Save review
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        review.comment && (
          <p className="mt-3 text-sm leading-relaxed text-ink-600">{review.comment}</p>
        )
      )}
    </article>
  );
}

export function ProductReviews({ product }: { product: Product }) {
  const { status, user } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const reviewsQuery = useProductReviews(product.slug, page);
  const createMutation = useCreateReview(product.slug, product.id);
  const updateMutation = useUpdateReview(product.slug);

  const reviews = reviewsQuery.data?.reviews ?? [];
  const summary = reviewsQuery.data?.summary;
  const meta = reviewsQuery.data?.meta;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createMutation.mutate(
      { rating, comment: comment.trim() },
      {
        onSuccess: () => {
          setRating(5);
          setComment('');
        },
      },
    );
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-4 border-t border-ink-200/80 pt-10">
      <SectionHeading
        eyebrow="Customer voices"
        title="Reviews"
        action={
          summary && summary.count > 0 ? (
            <span className="flex items-center gap-2 text-sm text-ink-600">
              <Stars value={summary.average} />
              <span className="font-semibold text-ink-900">{summary.average.toFixed(1)}</span>
              <span>
                ({summary.count} {summary.count === 1 ? 'review' : 'reviews'})
              </span>
            </span>
          ) : undefined
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {reviewsQuery.isPending ? (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : reviewsQuery.isError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              Reviews could not be loaded. Please refresh the page.
            </p>
          ) : reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink-200 px-5 py-10 text-center text-sm text-ink-500">
              No reviews yet. Be the first to share your thoughts.
            </p>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isMine={Boolean(user && review.author.id === user.id)}
                editing={editingId === review.id}
                onEdit={() => setEditingId(review.id)}
                onCancel={() => setEditingId(null)}
                saving={updateMutation.isPending}
                onSave={(nextRating, nextComment) =>
                  updateMutation.mutate(
                    {
                      reviewId: review.id,
                      rating: nextRating,
                      comment: nextComment.trim(),
                    },
                    { onSuccess: () => setEditingId(null) },
                  )
                }
              />
            ))
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-ink-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-ink-200/80 bg-paper p-5">
          <h3 id="reviews-heading" className="text-sm font-semibold text-ink-900">
            {status === 'authenticated' ? 'Write a review' : 'Already own it?'}
          </h3>

          {status === 'authenticated' ? (
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <span className="mb-2 block text-[13px] font-semibold text-ink-700">
                  Your rating
                </span>
                <RatingPicker value={rating} onChange={setRating} label="Your rating" />
              </div>
              <Textarea
                label="Your review"
                hint="Optional. Up to 1000 characters."
                value={comment}
                maxLength={1000}
                placeholder="How is the quality, fit and finish?"
                onChange={(event) => setComment(event.target.value)}
              />
              <Button type="submit" fullWidth loading={createMutation.isPending}>
                Publish review
              </Button>
            </form>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-relaxed text-ink-600">
                Sign in to rate this piece. Your review appears under your account name.
              </p>
              <Link
                to="/login"
                state={{
                  from: `${location.pathname}${location.search}`,
                  message: 'Sign in to write a review.',
                }}
                className="inline-flex text-sm font-semibold text-brand-800 hover:underline"
              >
                Sign in to review
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
