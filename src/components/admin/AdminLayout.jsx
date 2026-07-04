import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ children, pageTitle = 'Dashboard' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user'],
    queryFn: () => base44.auth.me(),
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // STRICT ACCESS: Only admin role can see admin panel
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!userLoading && user) {
      // STRICT: Only admin can access admin pages
      if (!isAdmin) {
        navigate(createPageUrl('Home'));
      }
    }
  }, [userLoading, user, isAdmin, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access this area</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Don't render admin layout for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Access denied. Admin only.</p>
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isSeller={false}
        isAdmin={true}
        hasBothAccess={false}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <AdminHeader 
        user={user} 
        collapsed={sidebarCollapsed}
        isSeller={false}
        seller={null}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        pageTitle={pageTitle}
      />
      <main className={`pt-14 md:pt-16 transition-all duration-300 
        ml-0 md:ml-16 ${!sidebarCollapsed ? 'md:ml-64' : ''}
      `}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}