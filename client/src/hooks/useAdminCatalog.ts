import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategoryRequest,
  createProductRequest,
  deleteCategoryRequest,
  deleteProductRequest,
  updateCategoryRequest,
  updateProductRequest,
  type CategoryInput,
  type ProductInput,
} from '@/api/adminCatalog.api';
import { uploadProductImage } from '@/api/admin.api';
import { getErrorMessage } from '@/api/errors';
import { useToast } from '@/components/ui/toast-context';
import { adminStatsKey } from './useAdminDashboard';

function useCatalogInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['product'] });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: adminStatsKey });
  };
}

export function useCreateProduct() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: ProductInput) => createProductRequest(input),
    onSuccess: (product) => {
      invalidate();
      showToast(`${product.name} created`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useUpdateProduct() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      updateProductRequest(id, input),
    onSuccess: (product) => {
      invalidate();
      showToast(`${product.name} updated`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useDeleteProduct() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProductRequest(id),
    onSuccess: () => {
      invalidate();
      showToast('Product removed from the storefront');
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useCreateCategory() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CategoryInput) => createCategoryRequest(input),
    onSuccess: (category) => {
      invalidate();
      showToast(`${category.name} created`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useUpdateCategory() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      updateCategoryRequest(id, input),
    onSuccess: (category) => {
      invalidate();
      showToast(`${category.name} updated`);
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useDeleteCategory() {
  const invalidate = useCatalogInvalidation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryRequest(id),
    onSuccess: () => {
      invalidate();
      showToast('Category removed');
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}

export function useUploadProductImage() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (file: File) => uploadProductImage(file),
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
