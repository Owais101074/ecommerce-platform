export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItemDTO {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressDTO {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  items: OrderItemDTO[];
  address: OrderAddressDTO;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPricingDTO {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface CheckoutQuoteDTO extends OrderPricingDTO {
  itemCount: number;
  priceChanged: boolean;
  couponCode: string | null;
}

export interface OrderListResult {
  orders: OrderDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
