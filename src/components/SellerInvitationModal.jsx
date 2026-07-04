import React, { useEffect } from 'react';
import { Store, Package, ShoppingCart, TrendingUp, DollarSign, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SellerInvitationModal({ isOpen, seller, onAccept, isLoading }) {
  // Prevent ESC key from closing
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !seller) return null;

  const features = [
    { icon: Package, text: 'Add your own products' },
    { icon: Package, text: 'Edit your products' },
    { icon: TrendingUp, text: 'View your sales revenue' },
    { icon: ShoppingCart, text: 'Manage your orders' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={(e) => e.stopPropagation()} // Prevent closing on overlay click
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-center text-white">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <h3 className="text-xl font-semibold">You Are Now an ÉLÉGANT Seller!</h3>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            You have been granted seller access to publish and manage your products on the ÉLÉGANT platform.
          </p>

          {/* Brand Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Brand:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{seller.brand_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Commission:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{seller.commission_rate || 15}% per sale</span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-8">
            <p className="font-semibold text-gray-900 dark:text-white mb-3">What you can do:</p>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button */}
          <Button 
            onClick={onAccept}
            disabled={isLoading}
            className="w-full h-12 text-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            style={{ backgroundColor: '#C9A96E' }}
          >
            {isLoading ? 'Please wait...' : 'Got It, Start Selling'}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            By clicking this button, you agree to our seller terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}