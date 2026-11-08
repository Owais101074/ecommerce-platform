import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/errors';
import {
  abandonPaymentRequest,
  mockCompletePaymentRequest,
  startPaymentRequest,
  verifyPaymentRequest,
} from '@/api/payment.api';
import { useToast } from '@/components/ui/toast-context';
import { orderQueryKeys } from '@/hooks/useOrders';

export function useStartPayment() {
  return useMutation({ mutationFn: startPaymentRequest });
}

export function useVerifyPayment(orderId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: verifyPaymentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists });
      showToast('Payment received');
    },
  });
}

export function useAbandonPayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => abandonPaymentRequest(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) });
    },
  });
}

export function useMockCompletePayment(orderId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (outcome: 'success' | 'failure') => mockCompletePaymentRequest(orderId, outcome),
    onSuccess: (result) => {
      if (!result.credentials) {
        void queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) });
        showToast('Simulated payment failure recorded', 'error');
      }
    },
    onError: (error) => {
      showToast(getErrorMessage(error), 'error');
    },
  });
}
