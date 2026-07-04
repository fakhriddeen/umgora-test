import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { useLookReferral } from '../components/LookReferralContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, X, Check, AlertTriangle, Lock, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SYXBA2ZoQUfdpkmkzom02IHiHBCmZCLLjHpNPlaUdMUrsD3RwEPMnFXJCR7p5NS9FjQhtvebkGorDXK9ucaqzi000AiNPJQXK';

export default function Checkout() {
  const { t } = useLanguage();
  const { referral, clearReferral } = useLookReferral();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: '',
    phone: ''
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['cart-products', user?.cart],
    queryFn: async () => {
      if (!user?.cart || user.cart.length === 0) return [];
      const productIds = [...new Set(user.cart.map(item => item.product_id))];
      const allProducts = await base44.entities.Product.list();
      return allProducts.filter(p => productIds.includes(p.id));
    },
    enabled: !!user
  });

  const { data: settings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const list = await base44.entities.PlatformSettings.list();
      return list[0] || null;
    },
  });

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    
    setPromoLoading(true);
    setPromoError('');
    
    try {
      const promoCodes = await base44.entities.PromoCode.filter({ 
        code: promoCodeInput.trim().toUpperCase() 
      });
      
      if (promoCodes.length === 0) {
        setPromoError('Invalid promo code');
        setPromoLoading(false);
        return;
      }
      
      const promo = promoCodes[0];
      
      if (!promo.is_active) {
        setPromoError('This promo code is no longer active');
        setPromoLoading(false);
        return;
      }
      
      if (promo.expiration_date && new Date(promo.expiration_date) < new Date()) {
        setPromoError('This promo code has expired');
        setPromoLoading(false);
        return;
      }
      
      const cartProductIds = user?.cart?.map(item => item.product_id) || [];
      if (!promo.applies_to_all && promo.product_ids?.length > 0) {
        const hasApplicableProducts = cartProductIds.some(id => promo.product_ids.includes(id));
        if (!hasApplicableProducts) {
          setPromoError('This promo code is not applicable to items in your cart');
          setPromoLoading(false);
          return;
        }
      }
      
      setAppliedPromo(promo);
      setPromoCodeInput('');
    } catch (err) {
      setPromoError('Error applying promo code');
    }
    
    setPromoLoading(false);
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  // Calculate cart items with discounts
  const cartItems = user?.cart?.map(cartItem => {
    const product = products.find(p => p.id === cartItem.product_id);
    if (!product) return null;
    
    let finalPrice = product.price;
    let discount = 0;
    let isPromoApplicable = false;
    
    if (appliedPromo) {
      const applies = appliedPromo.applies_to_all || 
                      (appliedPromo.product_ids?.includes(product.id));
      
      if (applies) {
        isPromoApplicable = true;
        if (appliedPromo.discount_type === 'percentage') {
          discount = product.price * (appliedPromo.discount_value / 100);
        } else {
          discount = Math.min(appliedPromo.discount_value, product.price);
        }
        finalPrice = Math.max(0, product.price - discount);
      }
    }
    
    return {
      ...cartItem,
      product,
      price: product.price,
      finalPrice,
      discount,
      isPromoApplicable
    };
  }).filter(Boolean) || [];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const discountedSubtotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const shipping = discountedSubtotal > 100 ? 0 : 10;
  const total = discountedSubtotal + shipping;

  // Get currency symbol
  const getCurrencySymbol = () => {
    const currency = settings?.stripe_currency || 'EUR';
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol();
  const isTestMode = settings?.stripe_test_mode ?? true;

  // Validate shipping form
  const validateForm = () => {
    const errors = {};
    
    if (!shippingAddress.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    if (!shippingAddress.address_line1.trim()) {
      errors.address_line1 = 'Address is required';
    }
    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingAddress.postal_code.trim()) {
      errors.postal_code = 'Postal code is required';
    }
    if (!shippingAddress.country.trim()) {
      errors.country = 'Country is required';
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Stripe Checkout redirect
  const handleStripeCheckout = async () => {
    setPaymentError('');
    
    // Step 1: Validate form
    if (!validateForm()) {
      setPaymentError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      const orderNumber = 'ELYS-' + Date.now().toString().slice(-8);
      
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_title: item.product.title_en,
        product_image: item.product.images?.[0],
        seller_id: item.product.seller_id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.finalPrice,
        discount: item.discount,
        promo_code: appliedPromo?.code || null,
        sku_used: item.product.sku || null,
        is_look_source: item.is_look_source || false,
        look_id: item.look_id || null,
        blogger_id: item.blogger_id || null
      }));

      // Step 2: Save order to database with "pending" status
      const pendingOrder = await base44.entities.Order.create({
        order_number: orderNumber,
        user_id: user.id,
        items: orderItems,
        subtotal,
        discount_amount: totalDiscount,
        shipping_cost: shipping,
        total,
        promo_code: appliedPromo?.code || null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'card',
        shipping_address: shippingAddress,
        is_test_order: isTestMode
      });

      // Step 3: Call backend to create Stripe Checkout Session
      const baseUrl = window.location.origin;
      const currency = (settings?.stripe_currency || 'EUR').toLowerCase();
      const amountInCents = Math.round(total * 100);

      const response = await base44.functions.invoke('createCheckoutSession', {
        orderId: pendingOrder.id,
        amount: amountInCents,
        currency: currency,
        customerEmail: user.email,
        successUrl: `${baseUrl}/OrderSuccess?order_id=${pendingOrder.id}`,
        cancelUrl: `${baseUrl}/Checkout`,
        orderNumber: orderNumber,
        itemCount: orderItems.length
      });

      if (response.data?.url) {
        // Update order with session ID
        await base44.entities.Order.update(pendingOrder.id, {
          stripe_session_id: response.data.sessionId
        });
        // Clear referral after successful order creation
        clearReferral();
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        await base44.entities.Order.delete(pendingOrder.id);
        setPaymentError(response.data?.error || 'Failed to create checkout session.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentError(err?.message || 'Payment system error. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setShippingAddress({ ...shippingAddress, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
    }
  };

  if (!user || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Your cart is empty
          </p>
          <Link to={createPageUrl('ProductList')}>
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-gray-900 dark:text-white mb-6 lg:mb-8">
          {t('checkout')}
        </h1>

        {/* Mobile Order Summary - Collapsible */}
        <details className="lg:hidden border dark:border-gray-800 rounded-lg mb-4 bg-gray-50 dark:bg-gray-900">
          <summary className="flex items-center justify-between p-4 cursor-pointer">
            <span className="font-medium text-gray-900 dark:text-white">Order Summary ({cartItems.length} items)</span>
            <span className="font-bold text-[#C9A96E]">{currencySymbol}{total.toFixed(2)}</span>
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'}
                  alt={item.product.title_en}
                  className="w-14 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {item.product.title_en}
                  </p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium">{currencySymbol}{(item.finalPrice * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </details>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-8">
            {/* Shipping Address */}
            <div className="border dark:border-gray-800 rounded-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white mb-4 lg:mb-6">
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium mb-1.5 block">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    value={shippingAddress.full_name}
                    onChange={(e) => handleFieldChange('full_name', e.target.value)}
                    className={`h-[52px] text-base ${fieldErrors.full_name ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address_line1" className="text-sm font-medium mb-1.5 block">Address *</Label>
                  <Input
                    id="address_line1"
                    type="text"
                    autoComplete="address-line1"
                    value={shippingAddress.address_line1}
                    onChange={(e) => handleFieldChange('address_line1', e.target.value)}
                    className={`h-[52px] text-base ${fieldErrors.address_line1 ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.address_line1 && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.address_line1}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="address_line2" className="text-sm font-medium mb-1.5 block">Apt, Suite (Optional)</Label>
                  <Input
                    id="address_line2"
                    type="text"
                    autoComplete="address-line2"
                    value={shippingAddress.address_line2}
                    onChange={(e) => handleFieldChange('address_line2', e.target.value)}
                    className="h-[52px] text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium mb-1.5 block">City *</Label>
                    <Input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      value={shippingAddress.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className={`h-[52px] text-base ${fieldErrors.city ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.city && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className="text-sm font-medium mb-1.5 block">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={shippingAddress.postal_code}
                      onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                      className={`h-[52px] text-base ${fieldErrors.postal_code ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.postal_code && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.postal_code}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="country" className="text-sm font-medium mb-1.5 block">Country *</Label>
                  <Input
                    id="country"
                    type="text"
                    autoComplete="country-name"
                    value={shippingAddress.country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    className={`h-[52px] text-base ${fieldErrors.country ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.country && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.country}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`h-[52px] text-base ${fieldErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="border dark:border-gray-800 rounded-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white mb-4">
                Promo Code
              </h2>
              
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 lg:p-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {appliedPromo.code}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {appliedPromo.discount_type === 'percentage' 
                          ? `${appliedPromo.discount_value}% off` 
                          : `${currencySymbol}${appliedPromo.discount_value} off`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removePromoCode} className="h-10 w-10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyPromoCode()}
                      className="h-[52px] text-base flex-1"
                    />
                    <Button onClick={applyPromoCode} disabled={promoLoading} className="h-[52px] px-6">
                      {promoLoading ? '...' : 'Apply'}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-red-600 mt-2">{promoError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Test Mode Info */}
            {isTestMode && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                  🧪 Test Mode
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Use card: <span className="font-mono">4242 4242 4242 4242</span>
                </p>
              </div>
            )}
          </div>

          {/* Order Summary - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="border dark:border-gray-800 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'}
                      alt={item.product.title_en}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light text-gray-900 dark:text-white truncate">
                        {item.product.title_en}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.size} | {item.color} | Qty: {item.quantity}
                      </p>
                      {item.discount > 0 ? (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {currencySymbol}{(item.finalPrice * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 line-through">
                            {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </p>
                      )}
                      {item.isPromoApplicable && appliedPromo && (
                        <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {appliedPromo.code}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 mb-4 border-t dark:border-gray-700 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}</span>
                  <span className="text-gray-900 dark:text-white">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promo: {appliedPromo?.code}</span>
                    <span className="text-green-600">-{currencySymbol}{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('shipping')}</span>
                  <span className="text-gray-900 dark:text-white">
                    {shipping === 0 ? 'Free' : `${currencySymbol}${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between font-medium text-xl">
                  <span className="text-gray-900 dark:text-white">TOTAL</span>
                  <span className="text-[#C9A96E]">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
              )}

              {/* Payment Button */}
              <Button 
                size="lg" 
                className="w-full bg-[#C9A96E] hover:bg-[#B8986D] text-white font-medium text-base h-14"
                onClick={handleStripeCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pay {currencySymbol}{total.toFixed(2)}
                  </>
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>Secure payment by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t dark:border-gray-800 p-4 lg:hidden z-40 safe-area-inset-bottom">
        {paymentError && (
          <p className="text-sm text-red-600 mb-2 text-center">{paymentError}</p>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-[#C9A96E]">{currencySymbol}{total.toFixed(2)}</p>
          </div>
          <Button 
            size="lg" 
            className="flex-1 bg-[#C9A96E] hover:bg-[#B8986D] text-white font-medium text-base h-14"
            onClick={handleStripeCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Complete Purchase
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}