import { Routes, Route } from 'react-router-dom';
import { useApplyLanguage } from './hooks/useApplyLanguage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import VendorShell from './components/vendor/VendorShell';
import AdminShell from './components/admin/AdminShell';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Product from './pages/Product';
import Store from './pages/Store';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import AccountLayout from './pages/account/AccountLayout';
import AccountProfile from './pages/account/AccountProfile';
import AccountAddresses from './pages/account/AccountAddresses';
import AccountSecurity from './pages/account/AccountSecurity';
import NotFound from './pages/NotFound';
import ComponentsDemo from './pages/ComponentsDemo';

import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorPayouts from './pages/vendor/VendorPayouts';
import VendorSubscription from './pages/vendor/VendorSubscription';
import VendorSettings from './pages/vendor/VendorSettings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCategories from './pages/admin/AdminCategories';

export default function App() {
  useApplyLanguage();
  return (
    <Routes>
      {/* Buyer storefront — wrapped in header/footer Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/store/:slug" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="buyer">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-confirmation/:id"
          element={
            <ProtectedRoute role="buyer">
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute role="buyer">
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute role="buyer">
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="buyer">
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountProfile />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="security" element={<AccountSecurity />} />
        </Route>
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/components-demo" element={<ComponentsDemo />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Standalone auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Vendor dashboard — shell provides sidebar + outlet */}
      <Route element={<ProtectedRoute role="vendor"><VendorShell /></ProtectedRoute>}>
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/vendor/products" element={<VendorProducts />} />
        <Route path="/vendor/orders" element={<VendorOrders />} />
        <Route path="/vendor/payouts" element={<VendorPayouts />} />
        <Route path="/vendor/subscription" element={<VendorSubscription />} />
        <Route path="/vendor/settings" element={<VendorSettings />} />
      </Route>

      {/* Admin console — shell provides sidebar + outlet */}
      <Route element={<ProtectedRoute role="admin"><AdminShell /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/vendors" element={<AdminVendors />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/payouts" element={<AdminPayouts />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
      </Route>
    </Routes>
  ); 
}
