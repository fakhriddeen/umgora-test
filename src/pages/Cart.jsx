import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ShoppingBag, Tag, Sparkles } from 'lucide-react';

export default function Cart() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [cartItems, setCartItems] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['cart-products', user?.cart],
    queryFn: async () => {
      if (!user?.cart || user.cart.length === 0) return [];
      
      const productIds = [...new Set(user.cart.map(item => item.product_id))];
      const allProducts = await base44.entities.Product.list();
      return allProducts.filter(p => productIds.includes(p.id));
    },
    enabled: !!user
  });

  // Fetch campaigns for promo codes in cart
  const { data: campaigns = [] } = useQuery({
    queryKey: ['cart-campaigns', user?.cart],
    queryFn: async () => {
      if (!user?.cart || user.cart.length === 0) return [];
      
      const promoCodes = [...new Set(user.cart.filter(item => item.promo_code).map(item => item.promo_code))];
      if (promoCodes.length === 0) return [];
      
      const allCampaigns = await base44.entities.DiscountCampaign.list();
      return allCampaigns.filter(c => promoCodes.includes(c.slug));
    },
    enabled: !!user
  });

  useEffect(() => {
    if (user && products.length > 0) {
      const items = user.cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.product_id);
        if (!product) return null;
        
        const variant = product.variants?.find(
          v => v.size === cartItem.size && v.color === cartItem.color
        );

        // Find campaign for this cart item's promo code
        let campaign = null;
        let finalPrice = product.price;
        let discount = 0;
        
        if (cartItem.promo_code) {
          campaign = campaigns.find(c => c.slug === cartItem.promo_code);
          if (campaign && campaign.is_active && 
              new Date(campaign.start_date) <= new Date() && 
              new Date(campaign.end_date) >= new Date() &&
              campaign.product_ids?.includes(product.id)) {
            if (campaign.discount_type === 'percentage') {
              discount = product.price * (campaign.discount_value / 100);
            } else {
              discount = campaign.discount_value;
            }
            finalPrice = Math.max(0, product.price - discount);
          }
        }

        return {
          ...cartItem,
          product,
          variant,
          price: product.price,
          finalPrice,
          discount,
          campaign,
          is_look_source: cartItem.is_look_source || false,
          look_id: cartItem.look_id || null,
          blogger_id: cartItem.blogger_id || null
        };
      }).filter(Boolean);
      
      setCartItems(items);
    }
  }, [user, products, campaigns]);

  const updateCartMutation = useMutation({
    mutationFn: async (newCart) => {
      await base44.auth.updateMe({ cart: newCart });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const updateQuantity = (productId, size, color, promoCode, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId, size, color, promoCode);
      return;
    }

    // Check stock before updating
    const cartItem = cartItems.find(
      item => item.product_id === productId && item.size === size && item.color === color && item.promo_code === promoCode
    );
    
    if (cartItem?.variant && newQuantity > cartItem.variant.stock) {
      alert(`Only ${cartItem.variant.stock} items available in stock`);
      return;
    }

    const newCart = user.cart.map(item => {
      if (item.product_id === productId && item.size === size && item.color === color && item.promo_code === promoCode) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    updateCartMutation.mutate(newCart);
  };

  const removeItem = (productId, size, color, promoCode) => {
    // Optimistically update local state first for smooth UX
    const newItems = cartItems.filter(
      item => !(item.product_id === productId && item.size === size && item.color === color && item.promo_code === promoCode)
    );
    setCartItems(newItems);
    
    // Then update backend
    const newCart = user.cart.filter(
      item => !(item.product_id === productId && item.size === size && item.color === color && item.promo_code === promoCode)
    );
    updateCartMutation.mutate(newCart);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const discountedSubtotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const shipping = discountedSubtotal > 100 ? 0 : 10;
  const total = discountedSubtotal + shipping;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Please login to view your bag
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {t('emptyBag')}
          </p>
          <Link to={createPageUrl('ProductList')}>
            <Button>{t('continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-6 lg:mb-8">
          {t('shoppingBag')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 sm:gap-4 bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-lg">
                <Link 
                  to={createPageUrl('ProductDetail') + '?id=' + item.product.id}
                  className="flex-shrink-0"
                >
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200'}
                    alt={item.product.title_en}
                    className="w-20 h-20 sm:w-24 sm:h-32 object-cover rounded-md"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={createPageUrl('ProductDetail') + '?id=' + item.product.id + (item.promo_code ? `&promo=${item.promo_code}` : '')}>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.product.title_en}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.size} | {item.color}
                  </p>
                  
                  {/* Price with discount */}
                  {item.discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        ${item.finalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.promo_code && item.campaign && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {item.promo_code}
                      </Badge>
                    )}
                    {item.is_look_source && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        Look
                      </Badge>
                    )}
                  </div>

                  {item.variant && item.variant.stock < item.quantity && (
                    <p className="text-xs text-red-600 mt-2">
                      Only {item.variant.stock} left
                    </p>
                  )}

                  {/* Mobile Quantity Controls */}
                  <div className="flex items-center justify-between mt-3 sm:hidden">
                    <div className="flex items-center gap-1 border dark:border-gray-700 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => updateQuantity(item.product_id, item.size, item.color, item.promo_code, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-base font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => updateQuantity(item.product_id, item.size, item.color, item.promo_code, item.quantity + 1)}
                        disabled={item.variant && item.quantity >= item.variant.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product_id, item.size, item.color, item.promo_code)}
                      className="h-10 w-10 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Desktop Quantity Controls */}
                <div className="hidden sm:flex flex-col items-end justify-between">
                  <div className="flex items-center gap-2 border dark:border-gray-700 rounded">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.promo_code, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.promo_code, item.quantity + 1)}
                      disabled={item.variant && item.quantity >= item.variant.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product_id, item.size, item.color, item.promo_code)}
                    className="h-10 w-10 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}</span>
                  <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promo Discount</span>
                    <span className="text-green-600">-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('shipping')}</span>
                  <span className="text-gray-900 dark:text-white">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {discountedSubtotal < 100 && (
                  <p className="text-xs text-gray-500">
                    Free shipping on orders over $100
                  </p>
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between font-medium text-lg">
                  <span className="text-gray-900 dark:text-white">{t('total')}</span>
                  <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link to={createPageUrl('Checkout')}>
                <Button size="lg" className="w-full h-14 text-base font-medium">
                  {t('checkout')}
                </Button>
              </Link>

              <Link to={createPageUrl('ProductList')} className="block mt-4">
                <Button variant="outline" className="w-full h-12 font-light">
                  {t('continueShopping')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t dark:border-gray-800 p-4 lg:hidden z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('total')} ({cartItems.length} items)</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
        </div>
        <Link to={createPageUrl('Checkout')}>
          <Button size="lg" className="w-full h-14 text-base font-medium">
            {t('checkout')}
          </Button>
        </Link>
      </div>
    </div>
  );
}