import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccountPage } from '@/pages/AccountPage';
import { AddressesPage } from '@/pages/AddressesPage';
import { AdminPage } from '@/pages/AdminPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProductPage } from '@/pages/ProductPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { RequireAdmin, RequireAuth } from './guards';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'products/:slug',
        element: <ProductPage />,
      },
      {
        path: 'categories/:slug',
        element: <CategoryPage />,
      },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: 'cart',
        element: (
          <RequireAuth>
            <CartPage />
          </RequireAuth>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <RequireAuth>
            <WishlistPage />
          </RequireAuth>
        ),
      },
      {
        path: 'addresses',
        element: (
          <RequireAuth>
            <AddressesPage />
          </RequireAuth>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <RequireAuth>
            <OrderDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: 'login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: 'register',
    element: <RegisterPage />,
    errorElement: <RouteErrorPage />,
  },
]);
