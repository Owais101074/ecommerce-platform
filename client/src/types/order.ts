export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPricing {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface CheckoutQuote extends OrderPricing {
  itemCount: number;
  priceChanged: boolean;
  couponCode: string | null;
}

export interface OrderList {
  orders: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
