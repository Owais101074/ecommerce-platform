import { useQuery } from '@tanstack/react-query';
import { fetchAdminPing } from '@/api/catalog.api';
import { useAuth } from '@/features/auth/useAuth';

export function useAdminPing() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin', 'ping'],
    queryFn: fetchAdminPing,
    enabled: isAdmin,
  });
}
