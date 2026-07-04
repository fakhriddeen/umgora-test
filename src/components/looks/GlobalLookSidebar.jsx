import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../LanguageContext';
import { useUIState } from '../UIStateContext';
import { useLookReferral } from '../LookReferralContext';

export default function GlobalLookSidebar() {
  const { t, getLocalizedField } = useLanguage();
  const { lookSidebarOpen, selectedLook, closeLookSidebar } = useUIState();
  const { referral } = useLookReferral();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sizeSelector, setSizeSelector] = useState(null); // { productId, variants, product }
  const [notification, setNotification] = useState(null);

  // Fetch blogger info if this look has a referral
  const { data: blogger } = useQuery({
    queryKey: ['sidebar-blogger', selectedLook?.blogger_id],
    queryFn: async () => {
      if (!selectedLook?.blogger_id) return null;
      const bloggers = await base44.entities.Blogger.filter({ id: selectedLook.blogger_id });
      return bloggers[0] || null;
    },
    enabled: !!selectedLook?.blogger_id && lookSidebarOpen
  });

  const { data: products = [] } = useQuery({
    queryKey: ['sidebar-look-products', selectedLook?.product_ids],
    queryFn: async () => {
      if (!selectedLook?.product_ids?.length) return [];
      const allProducts = await base44.entities.Product.list();
      return allProducts.filter(p => selectedLook.product_ids.includes(p.id));
    },
    enabled: !!selectedLook?.product_ids?.length && lookSidebarOpen
  });

  const addToBagMutation = useMutation({
    mutationFn: async ({ productId, size, color }) => {
      const user = await base44.auth.me();
      const cart = user.cart || [];
      
      const bloggerId = selectedLook?.blogger_id || referral?.bloggerId;
      const isFromLook = !!selectedLook && selectedLook.product_ids?.includes(productId) && !!bloggerId;
      
      const existingIdx = cart.findIndex(
        item => item.product_id === productId && 
                item.size === size && 
                item.color === color
      );

      let newCart;
      if (existingIdx >= 0) {
        newCart = [...cart];
        newCart[existingIdx].quantity += 1;
        if (isFromLook) {
          newCart[existingIdx].is_look_source = true;
          newCart[existingIdx].look_id = selectedLook.id;
          newCart[existingIdx].blogger_id = bloggerId;
        }
      } else {
        const cartItem = {
          product_id: productId,
          size: size,
          color: color,
          quantity: 1
        };
        
        if (isFromLook) {
          cartItem.is_look_source = true;
          cartItem.look_id = selectedLook.id;
          cartItem.blogger_id = bloggerId;
        }
        
        newCart = [...cart, cartItem];
      }

      await base44.auth.updateMe({ cart: newCart });
      return newCart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSizeSelector(null);
      setNotification('Product added to bag');
      setTimeout(() => setNotification(null), 5000);
    }
  });

  const handleAddToBag = (product) => {
    const variants = product.variants || [];
    
    // Always check for size variants first
    if (variants.length > 0) {
      const availableVariants = variants.filter(v => (v.stock || 0) > 0);
      
      if (availableVariants.length > 0) {
        // Has variants with stock - show size selector
        setSizeSelector({ productId: product.id, variants: availableVariants, product });
      } else {
        // Has variants but no stock - show all variants anyway (in case stock data is incorrect)
        setSizeSelector({ productId: product.id, variants: variants, product });
      }
    } else {
      // No variants defined - add as one size
      addToBagMutation.mutate({ 
        productId: product.id, 
        size: 'One Size', 
        color: 'Default' 
      });
    }
  };

  const handleSizeSelect = (size) => {
    const variant = sizeSelector.variants.find(v => v.size === size);
    addToBagMutation.mutate({ 
      productId: sizeSelector.productId, 
      size, 
      color: variant?.color || 'Default' 
    });
  };

  const handleViewProduct = useCallback((productId) => {
    closeLookSidebar();
    navigate(createPageUrl('ProductDetail') + '?id=' + productId);
  }, [closeLookSidebar, navigate]);

  const handleClose = useCallback(() => {
    closeLookSidebar();
    setSizeSelector(null);
  }, [closeLookSidebar]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      closeLookSidebar();
      setSizeSelector(null);
    }
  }, [closeLookSidebar]);

  // Ensure body scroll is restored when closing
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  if (!lookSidebarOpen || !selectedLook) {
    return null;
  }

  const lookProducts = products;
  const totalPrice = lookProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div 
      className="fixed inset-0 z-[9999]"
      onClick={handleOverlayClick}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[10000] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-light text-gray-900 dark:text-white">
              {selectedLook.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedLook.product_ids?.length || 0} {t('items')}
            </p>
            {blogger && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Curated by {blogger.name}
                </Badge>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {lookProducts.map((product) => {
            const title = getLocalizedField(product, 'title') || product.title_en;
            const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200';
            const isSelectingSize = sizeSelector?.productId === product.id;
            
            return (
              <div
                key={product.id}
                className="flex items-start gap-3 p-3 rounded-lg border dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
              >
                <div 
                  className="w-16 h-20 md:w-20 md:h-24 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleViewProduct(product.id)}
                >
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                    onClick={() => handleViewProduct(product.id)}
                  >
                    {title}
                  </h3>
                  {product.sku && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      {t('sku')}: {product.sku}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    €{product.price?.toFixed(2)}
                  </p>
                  
                  {/* Size Selector or Add to Bag */}
                  {isSelectingSize ? (
                    <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Size:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sizeSelector.variants
                        .sort((a, b) => {
                          // Sort sizes: numeric first (36-45), then clothing (XS-XXL)
                          const numA = parseInt(a.size);
                          const numB = parseInt(b.size);
                          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                          return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
                        })
                        .map((variant) => (
                        <button
                          key={variant.size}
                          onClick={() => handleSizeSelect(variant.size)}
                          disabled={addToBagMutation.isPending}
                          className="px-3 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {variant.size}
                        </button>
                      ))}
                    </div>
                      <button
                        onClick={() => setSizeSelector(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddToBag(product)}
                      className="mt-2 w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
                      disabled={addToBagMutation.isPending}
                    >
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      {addToBagMutation.isPending ? 'Adding...' : t('addToBag')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('total')}</span>
            <span className="text-xl font-medium text-gray-900 dark:text-white">
              €{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}