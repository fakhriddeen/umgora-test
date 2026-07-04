import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '../LanguageContext';
import {
  LayoutDashboard, Package, ShoppingCart, Zap, Ticket,
  Users, Store, Settings, ChevronLeft, ChevronRight, ArrowRightLeft, Sparkles, Wallet, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSidebar({ collapsed, onToggle, isSeller = false, isAdmin = false, hasBothAccess = false, mobileOpen = false, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const ownerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
    { id: 'products', label: 'Products', icon: Package, page: 'AdminProducts' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, page: 'AdminOrders' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, page: 'AdminPayouts' },
    { id: 'campaigns', label: 'Campaigns', icon: Zap, page: 'AdminCampaigns' },
    { id: 'promos', label: 'Promo Codes', icon: Ticket, page: 'AdminPromoCodes' },
    { id: 'users', label: 'Customers', icon: Users, page: 'AdminUsers' },
    { id: 'sellers', label: 'Sellers', icon: Store, page: 'AdminSellers' },
    { id: 'bloggers', label: 'Bloggers', icon: Sparkles, page: 'AdminBloggers' },
    { id: 'looks', label: 'Looks', icon: Zap, page: 'AdminLooks' },
    { id: 'settings', label: 'Settings', icon: Settings, page: 'AdminSettings' },
  ];

  const sellerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'SellerDashboard' },
  ];

  const menuItems = isSeller ? sellerMenuItems : ownerMenuItems;
  
  const handleSwitchView = () => {
    if (isSeller) {
      navigate(createPageUrl('AdminDashboard'));
    } else {
      navigate(createPageUrl('SellerDashboard'));
    }
  };

  const isActive = (page) => {
    return location.pathname.includes(page);
  };

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen bg-gray-900 text-white z-50 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
            {!collapsed && (
              <Link to={createPageUrl('Home')} className="text-xl font-light tracking-wider">
                Umgora
              </Link>
            )}
            {/* Desktop collapse toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden md:flex text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800 h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Role Badge & Switch */}
          {!collapsed && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isSeller ? 'bg-amber-600' : 'bg-purple-600'
                }`}>
                  {isSeller ? 'SELLER PORTAL' : 'ADMIN PANEL'}
                </span>
                {hasBothAccess && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchView}
                    className="text-gray-400 hover:text-white h-7 px-2"
                    title={isSeller ? 'Switch to Admin' : 'Switch to Seller'}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.page);
                return (
                  <li key={item.id}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-base md:text-sm font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-gray-800">
              <Link
                to={createPageUrl('Home')}
                onClick={handleNavClick}
                className="flex items-center text-sm text-gray-500 hover:text-gray-300 py-2"
              >
                ← Back to Store
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}