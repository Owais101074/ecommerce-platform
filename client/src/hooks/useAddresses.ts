import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAddressRequest,
  fetchAddresses,
  removeAddressRequest,
  setDefaultAddressRequest,
  updateAddressRequest,
} from '@/api/address.api';
import { getErrorMessage } from '@/api/errors';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/useAuth';
import type { Address, AddressInput, AddressUpdateInput } from '@/types/address';

export const addressQueryKey = ['addresses'] as const;

export function useAddresses() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: addressQueryKey,
    queryFn: fetchAddresses,
    enabled: isAuthenticated,
  });
}

function useAddressCache() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  function storeAddresses(addresses: Address[]): void {
    queryClient.setQueryData(addressQueryKey, addresses);
  }

  function reportError(error: unknown): void {
    showToast(getErrorMessage(error), 'error');
  }

  return { storeAddresses, reportError };
}

export function useCreateAddress() {
  const { storeAddresses, reportError } = useAddressCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: AddressInput) => createAddressRequest(input),
    onSuccess: (addresses) => {
      storeAddresses(addresses);
      showToast('Address added');
    },
    onError: reportError,
  });
}

export function useUpdateAddress() {
  const { storeAddresses, reportError } = useAddressCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressUpdateInput }) =>
      updateAddressRequest(id, input),
    onSuccess: (addresses) => {
      storeAddresses(addresses);
      showToast('Address updated');
    },
    onError: reportError,
  });
}

export function useRemoveAddress() {
  const { storeAddresses, reportError } = useAddressCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => removeAddressRequest(id),
    onSuccess: (addresses) => {
      storeAddresses(addresses);
      showToast('Address removed');
    },
    onError: reportError,
  });
}

export function useSetDefaultAddress() {
  const { storeAddresses, reportError } = useAddressCache();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => setDefaultAddressRequest(id),
    onSuccess: (addresses) => {
      storeAddresses(addresses);
      showToast('Default address updated');
    },
    onError: reportError,
  });
}
