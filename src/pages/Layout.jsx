
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { UIStateProvider, useUIState } from './components/UIStateContext';
import { LookReferralProvider } from './components/LookReferralContext';
import GlobalLookSidebar from './components/looks/GlobalLookSidebar';
import MegaMenu from './components/navigation/MegaMenu';
import MobileMenu from './components/navigation/MobileMenu';
import { 
  Search, ShoppingBag, Heart, User, Menu, X, 
  Sun, Moon, Globe, LogOut, LayoutDashboard, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function LayoutContent({ children, currentPageName }) {
  const { language, changeLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { closeAll } = useUIState();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close all overlays on route change
  useEffect(() => {
    closeAll();
    window.scrollTo(0, 0);
  }, [location.pathname, location.search, closeAll]);

  useEffect(() => {
    loadUser();
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      
      // Check if user is a seller (by matching email case-insensitively)
      if (userData) {
        const allSellers = await base44.entities.Seller.list();
        const seller = allSellers.find(s => 
          s.email?.toLowerCase() === userData.email.toLowerCase()
        );

        if (seller && seller.status === 'active') {
          // Seller exists and is active
          userData._sellerAccess = true;
          userData._sellerId = seller.id;
        }

        // Check if user is a blogger
        const allBloggers = await base44.entities.Blogger.list();
        const blogger = allBloggers.find(b => 
          b.email?.toLowerCase() === userData.email.toLowerCase()
        );

        if (blogger && blogger.status === 'active') {
          userData._bloggerAccess = true;
          userData._bloggerId = blogger.id;
        }
      }
      
      setUser(userData);
      setCartCount(userData?.cart?.length || 0);
    } catch (err) {
      setUser(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <style>{`
        :root {
          --color-primary: #C9A96E;
          --color-secondary: #8B7355;
          --color-background: #FFFFFF;
          --color-dark: #0A0A0A;
          --color-success: #2D5F3F;
          --color-warning: #D4AF37;
          --color-error: #8B0000;
          --border-radius: 8px;
          --font-heading: 'Inter', sans-serif;
          --font-body: 'Inter', sans-serif;
          --spacing-section: 60px;
          --spacing-card: 16px;
          --spacing-grid: 24px;
          --primary: 0 0% 9%;
          --primary-foreground: 0 0% 98%;
          --background: 0 0% 100%;
          --foreground: 0 0% 9%;
        }

        .dark {
          --primary: 0 0% 98%;
          --primary-foreground: 0 0% 9%;
          --background: 0 0% 4%;
          --foreground: 0 0% 98%;
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          font-family: var(--font-body);
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading);
          letter-spacing: 0.5px;
        }

        /* Elysian Card Animations */
        .elysian-card {
          animation: elysianFadeUp 0.6s ease-out forwards;
          opacity: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .elysian-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }

        @keyframes elysianFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hero Animations */
        .elysian-hero-fade {
          animation: heroFadeIn 0.8s ease-out forwards;
        }

        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Button Animations */
        .elysian-btn {
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .elysian-btn:hover {
          transform: scale(1.02);
        }

        .elysian-btn:active {
          transform: scale(0.98);
        }

        /* Badge Pulse */
        .elysian-badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Link Underline Effect */
        .elysian-link {
          position: relative;
        }

        .elysian-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 1px;
          background: var(--color-primary);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .elysian-link:hover::after {
          width: 100%;
        }

        /* Nav Shrink on Scroll */
        .nav-shrink {
          transition: all 0.3s ease;
        }

        .nav-shrink.scrolled {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }

        /* Toast Animation */
        .elysian-toast {
          animation: toastSlide 0.4s ease-out;
        }

        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Skeleton Shimmer */
        .elysian-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Countdown Timer Flip */
        .elysian-countdown-digit {
          animation: countFlip 0.3s ease-out;
        }

        @keyframes countFlip {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* Icon Hover Rotate */
        .elysian-icon-hover {
          transition: transform 0.2s ease;
        }

        .elysian-icon-hover:hover {
          transform: rotate(5deg);
        }

        /* Glass Morphism */
        .elysian-glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .dark .elysian-glass {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Live Badge Pulse */
        .elysian-live-badge {
          animation: livePulse 1.5s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(201, 169, 110, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(201, 169, 110, 0);
          }
        }

        /* Cart Slide In */
        .elysian-slide-in {
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Add to Cart Bounce */
        .elysian-bounce {
          animation: cartBounce 0.5s ease;
        }

        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        /* Progress Bar */
        .elysian-progress {
          background: linear-gradient(90deg, var(--color-primary), var(--color-warning));
        }

        /* Spinner */
        .elysian-spinner {
          border: 2px solid transparent;
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 nav-shrink ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg shadow-sm scrolled' 
          : 'bg-white dark:bg-gray-950'
      }`}>
        <style>{`
          /* Mobile-first responsive fixes */
          @media (max-width: 640px) {
            .mobile-nav-item {
              min-height: 48px;
              min-width: 44px;
            }
          }
        `}</style>
        {/* Top bar with logo and actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex-shrink-0">
              <h1 className="text-2xl font-bold tracking-wider text-[var(--color-dark)] dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="text-[var(--color-primary)]">U</span>MGORA
              </h1>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('de')}>
                    Deutsch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('ru')}>
                    Русский
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:flex">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              {/* Search */}
              <Link to={createPageUrl('Search')}>
                <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-10 sm:w-10">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {/* Wishlist - Hidden on very small screens */}
              <Link to={createPageUrl('Wishlist')} className="hidden sm:block">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Link to={createPageUrl('Cart')} className="relative">
                <Button variant="ghost" size="icon" className="h-10 w-10 elysian-icon-hover">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Account Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Profile')} className="cursor-pointer">
                          {t('account')}
                        </Link>
                      </DropdownMenuItem>
                      {(!user._sellerAccess || user.role === 'admin') && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Orders')} className="cursor-pointer">
                            {t('orders')}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('AdminDashboard')} className="cursor-pointer">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            {t('admin')}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {user._sellerAccess && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('SellerDashboard')} className="cursor-pointer">
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Seller Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {user._bloggerAccess && (
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('BloggerDashboard')} className="cursor-pointer">
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Blogger Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => base44.auth.redirectToLogin()}>
                  <User className="h-5 w-5" />
                </Button>
              )}


            </div>
          </div>
        </div>

        {/* Navigation - Always Visible */}
        <div className="border-t dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MegaMenu />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="pt-24 sm:pt-28 lg:pt-28">
        {children}
      </main>

      {/* Global Look Sidebar */}
      <GlobalLookSidebar />

      {/* Footer */}
      <footer className="bg-[var(--color-dark)] text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold tracking-wider mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="text-[var(--color-primary)]">U</span>MGORA
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Premium fashion marketplace curating the finest collections for the modern lifestyle.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--color-primary)]">{t('shop')}</h4>
              <ul className="space-y-3">
                <li><Link to={createPageUrl('ProductList') + '?gender=women'} className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('ladies')}</Link></li>
                <li><Link to={createPageUrl('ProductList') + '?gender=men'} className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('gentlemen')}</Link></li>
                <li><Link to={createPageUrl('ProductList') + '?gender=kids'} className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('children')}</Link></li>
                <li><Link to={createPageUrl('Looks')} className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('looks')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--color-primary)]">{t('help')}</h4>
              <ul className="space-y-3">
                <li><a href="#" className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('contact')}</a></li>
                <li><a href="#" className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('shipping')}</a></li>
                <li><a href="#" className="elysian-link text-sm text-white/70 hover:text-white transition-colors">{t('returns')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--color-primary)]">{t('newsletter')}</h4>
              <p className="text-sm text-white/60 mb-4">
                {t('subscribeExclusive')}
              </p>
              <div className="flex">
                <Input 
                  type="email" 
                  placeholder="Email" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-r-none focus:ring-[var(--color-primary)]"
                  style={{ borderRadius: 'var(--border-radius) 0 0 var(--border-radius)' }}
                />
                <Button 
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 rounded-l-none"
                  style={{ borderRadius: '0 var(--border-radius) var(--border-radius) 0' }}
                >
                  →
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              © 2024 UMGORA. {t('allRightsReserved')}.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/50 hover:text-[var(--color-primary)] transition-colors text-sm">Privacy</a>
              <a href="#" className="text-white/50 hover:text-[var(--color-primary)] transition-colors text-sm">Terms</a>
              <a href="#" className="text-white/50 hover:text-[var(--color-primary)] transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UIStateProvider>
          <LookReferralProvider>
            <LayoutContent children={children} currentPageName={currentPageName} />
          </LookReferralProvider>
        </UIStateProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
