import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '../LanguageContext';
import { Sun, Moon, X, Sparkles, ShoppingBag, Users, Baby, Eye, ChevronRight } from 'lucide-react';

export default function MobileMenu({ onClose, toggleTheme, theme }) {
  const { t } = useLanguage();
  const location = useLocation();
  const firstLinkRef = useRef(null);

  const handleNavigation = (e) => {
    if (e) {
      e.preventDefault();
    }
    onClose();
  };

  // Handle Esc key and focus trap
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleNavigation();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Set focus to first menu item
    setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const menuItems = [
    { id: 'campaigns', label: t('allCampaigns'), link: createPageUrl('ProductList') + '?sale=true', icon: Sparkles, highlight: true },
    { id: 'ladies', label: t('ladies'), link: createPageUrl('ProductList') + '?gender=women', icon: ShoppingBag },
    { id: 'gentlemen', label: t('gentlemen'), link: createPageUrl('ProductList') + '?gender=men', icon: Users },
    { id: 'children', label: t('children'), link: createPageUrl('ProductList') + '?gender=kids', icon: Baby },
    { id: 'looks', label: t('looks'), link: createPageUrl('Looks'), icon: Eye },
  ];

  const isActive = (link) => location.pathname + location.search === link;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[10000] lg:hidden"
        onClick={handleNavigation}
        style={{ 
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Menu Panel */}
      <div 
        className="fixed left-0 right-0 z-[10001] bg-white dark:bg-gray-950 overflow-y-auto lg:hidden" 
        style={{ 
          position: 'fixed',
          top: '56px', 
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: 'calc(100vh - 56px)',
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-[var(--color-dark)] dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>Menu</span>
          <button onClick={handleNavigation} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

      <div className="px-4 py-4">
        {menuItems.map((item, index) => (
          <Link
            key={item.id}
            to={item.link}
            ref={index === 0 ? firstLinkRef : null}
            className={`flex items-center justify-between py-4 px-3 mb-2 rounded-xl transition-all ${
              isActive(item.link)
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : item.highlight
                ? 'bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 text-[var(--color-dark)] dark:text-white'
                : 'text-[var(--color-dark)] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={handleNavigation}
            style={{ 
              animationDelay: `${index * 0.05}s`,
              borderRadius: 'var(--border-radius)'
            }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.highlight ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`} style={{ borderRadius: 'var(--border-radius)' }}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold tracking-wide">{item.label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}

        {/* Divider */}
        <div className="my-6 border-t border-gray-100 dark:border-gray-800" />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full py-4 px-3 rounded-xl text-[var(--color-dark)] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ borderRadius: 'var(--border-radius)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{ borderRadius: 'var(--border-radius)' }}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <span className="text-base font-semibold">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
          </div>
        </button>
      </div>
      </div>
    </>
  );
}