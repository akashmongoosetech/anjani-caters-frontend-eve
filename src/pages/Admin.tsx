import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import ProtectedRoute from '../components/admin/ProtectedRoute';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { connectSocket, disconnectSocket } from '../lib/socket';
import Dashboard from './admin/Dashboard';
import Bookings from './admin/Bookings';
import Orders from './admin/Orders';
import Contacts from './admin/Contacts';
import Users from './admin/Users';
import Blogs from './admin/Blogs';
import Comments from './admin/Comments';
import Menu from './admin/Menu';
import Services from './admin/Services';
import CategoryManagement from './admin/CategoryManagement';
import SubCategoryManagement from './admin/SubCategoryManagement';
import Packages from './admin/Packages';
import Newsletter from './admin/Newsletter';
import Gallery from './admin/Gallery';
import Testimonials from './admin/Testimonials';
import Settings from './admin/Settings';
import AIChatbotInquiries from './admin/AIChatbotInquiries';
import Notifications from './admin/Notifications';
import Locations from './admin/Locations';
import SEO from '../components/SEO';

function AdminSocketHandler() {
  const { fetchNotifications } = useNotifications();
  const { toast } = useToast();
  const { currentUser } = useAdminAuth();
  const role = currentUser?.role || 'Admin';

  // Refs keep the subscription effect stable: context values/functions get new
  // identities on unrelated renders, which must NOT reconnect the socket.
  const fetchRef = useRef(fetchNotifications);
  fetchRef.current = fetchNotifications;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    const socket = connectSocket(role);

    const onNew = (notification: any) => {
      fetchRef.current();
      toastRef.current.info(notification.message, notification.title);
    };
    socket.off('notification:new', onNew);
    socket.on('notification:new', onNew);

    return () => {
      // Detach this handler but keep the shared connection alive for the shell.
      socket.off('notification:new', onNew);
    };
  }, [role]);

  // Disconnect only when the whole admin shell unmounts (e.g. logout/leave /admin).
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return null;
}

export default function Admin() {
  return (
    <NotificationProvider>
      <AdminSocketHandler />
      <SEO 
        title="Admin Control Panel - Anjani Catering & Events" 
        description="Manage website content, bookings, orders, blogs, menu items, packages, subscribers, and gallery."
        urlPath="/admin"
        robots="noindex, nofollow"
      />
      <Routes>
        {/* Outer security wrapper ensuring valid authentication token for all admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Employee']} />}>
          <Route element={<AdminLayout />}>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* General Staff Access Modules */}
            <Route path="dashboard" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Employee']}><Dashboard /></ProtectedRoute>} />
            <Route path="contacts" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Employee']}><Contacts /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Employee']}><Orders /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Notifications /></ProtectedRoute>} />
            <Route path="locations" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Employee']}><Locations /></ProtectedRoute>} />

            {/* Operations & Management Modules */}
            <Route path="bookings" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Bookings /></ProtectedRoute>} />
            <Route path="menu" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Menu /></ProtectedRoute>} />
            <Route path="services/categories" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><CategoryManagement /></ProtectedRoute>} />
            <Route path="services/subcategories" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><SubCategoryManagement /></ProtectedRoute>} />
            <Route path="services" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Services /></ProtectedRoute>} />
            <Route path="packages" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Packages /></ProtectedRoute>} />
            <Route path="ai-bookings" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><AIChatbotInquiries /></ProtectedRoute>} />

            {/* Content & Marketing Management Modules */}
            <Route path="blogs" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Blogs /></ProtectedRoute>} />
            <Route path="comments" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Comments /></ProtectedRoute>} />
            <Route path="newsletter" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Newsletter /></ProtectedRoute>} />
            <Route path="gallery" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Gallery /></ProtectedRoute>} />
            <Route path="testimonials" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}><Testimonials /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Settings /></ProtectedRoute>} />

            {/* Super Admin Restricted Security Module */}
            <Route path="users" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']}><Users /></ProtectedRoute>} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </NotificationProvider>
  );
}
