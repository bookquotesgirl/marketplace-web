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
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/components-demo" element={<ComponentsDemo />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Standalone auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Vendor dashboard — sidebar shell, role-gated */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute role="vendor">
            <VendorShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="subscription" element={<VendorSubscription />} />
        <Route path="settings" element={<VendorSettings />} />
      </Route>

      {/* Admin console — sidebar shell, role-gated */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  ); 
}
