import type { ApiSuccess } from '@/types/api';
import type {
  AdminCustomer,
  AdminCustomerDetail,
  AdminCustomerList,
  AdminStats,
} from '@/types/admin';
import { http } from './http';

export interface AdminCustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await http.get<ApiSuccess<{ stats: AdminStats }>>('/admin/stats');
  return data.data.stats;
}

export async function fetchAdminCustomers(
  filters: AdminCustomerFilters,
): Promise<AdminCustomerList> {
  const { data } = await http.get<ApiSuccess<{ customers: AdminCustomer[] }>>('/admin/customers', {
    params: filters,
  });
  const customers = data.data.customers;

  return {
    customers,
    meta: data.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? customers.length,
      total: customers.length,
      totalPages: 1,
    },
  };
}

export async function fetchAdminCustomer(id: string): Promise<AdminCustomerDetail> {
  const { data } = await http.get<ApiSuccess<{ customer: AdminCustomerDetail }>>(
    `/admin/customers/${id}`,
  );
  return data.data.customer;
}

export async function updateAdminCustomerStatus(
  id: string,
  isActive: boolean,
): Promise<AdminCustomer> {
  const { data } = await http.patch<ApiSuccess<{ customer: AdminCustomer }>>(
    `/admin/customers/${id}/status`,
    { isActive },
  );
  return data.data.customer;
}

export async function uploadProductImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append('image', file);

  const { data } = await http.post<ApiSuccess<{ image: UploadedImage }>>(
    '/admin/uploads/product-image',
    form,
  );

  return data.data.image;
}
