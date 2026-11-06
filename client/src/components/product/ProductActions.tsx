import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useAddCartItem } from '@/hooks/useCart';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import type { Product } from '@/types/catalog';

function useGuestRedirect() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function requireAuth(message: string): boolean {
    if (status === 'authenticated') {
      return true;
    }

    if (status === 'guest') {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}`, message },
      });
    }

    return false;
  }

  return { status, requireAuth };
}

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = 'sm',
  className = '',
}: AddToCartButtonProps) {
  const { status, requireAuth } = useGuestRedirect();
  const addMutation = useAddCartItem();
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stock === 0;

  function handleClick(): void {
    if (!requireAuth('Sign in to add items to your cart.')) {
      return;
    }

    addMutation.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 1800);
        },
      },
    );
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      loading={addMutation.isPending}
      disabled={outOfStock || status === 'loading'}
      className={className}
    >
      {justAdded ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      )}
      {outOfStock ? 'Out of stock' : justAdded ? 'Added' : 'Add to cart'}
    </Button>
  );
}

interface WishlistButtonProps {
  product: Product;
  size?: 'sm' | 'md';
  className?: string;
}

export function WishlistButton({ product, size = 'sm', className = '' }: WishlistButtonProps) {
  const { status, requireAuth } = useGuestRedirect();
  const { data: wishlist } = useWishlist();
  const toggleMutation = useToggleWishlist();
  const saved = wishlist?.some((item) => item.id === product.id) ?? false;
  const buttonSize = size === 'md' ? 'h-11 w-11' : 'h-9 w-9';

  function handleClick(): void {
    if (!requireAuth('Sign in to save items to your wishlist.')) {
      return;
    }

    toggleMutation.mutate({ product, saved });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleMutation.isPending || status === 'loading'}
      aria-label={
        saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
      }
      aria-pressed={saved}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`${buttonSize} inline-flex shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50 ${
        saved
          ? 'border-accent-300 bg-accent-50 text-accent-600'
          : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-300 hover:text-accent-600'
      } ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${saved ? 'fill-accent-500 text-accent-500' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}

export function ProductActions({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AddToCartButton product={product} className="flex-1" />
      <WishlistButton product={product} />
    </div>
  );
}
