import { Badge } from '@/components/ui/Badge';

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge tone="danger" dot>
        Out of stock
      </Badge>
    );
  }

  if (stock <= 10) {
    return (
      <Badge tone="warning" dot>
        Only {stock} left
      </Badge>
    );
  }

  return (
    <Badge tone="success" dot>
      In stock
    </Badge>
  );
}
