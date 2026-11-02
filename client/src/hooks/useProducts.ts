import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/api/catalog.api';
import type { ProductQuery } from '@/types/catalog';

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
  });
}
