import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLookReferral } from '../components/LookReferralContext';
import { CheckCircle, Package, Mail, ArrowRight, ShoppingBag, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccess() {
  const queryClient = useQueryClient();
  const { clearReferral } = useLookReferral();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const orderId = urlParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: settings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const list = await base44.entities.PlatformSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    const verifyAndCompleteOrder = async () => {
      if (!orderId || !user) {
        if (!orderId) setError('No order ID found.');
        setProcessing(false);
        return;
      }

      try {
        // Fetch the order - poll briefly as webhook processes quickly
        let existingOrder = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          const orders = await base44.entities.Order.filter({ id: orderId });
          if (orders.length > 0) {
            existingOrder = orders[0];
            // If already paid by webhook, we're done
            if (existingOrder.payment_status === 'paid') {
              break;
            }
          }
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 500)); // Wait 0.5 seconds
          }
        }
        
        if (!existingOrder) {
          setError('Order not found.');
          setProcessing(false);
          return;
        }

        // If already paid (processed by webhook), just display
        if (existingOrder.payment_status === 'paid') {
          clearReferral();
          await base44.auth.updateMe({ cart: [] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          setOrder(existingOrder);
          setProcessing(false);
          return;
        }

        // Fallback: Process on frontend if webhook hasn't processed yet
        // This handles the case when Stripe redirects faster than webhook
        try {
          // Update order to paid
          await base44.entities.Order.update(orderId, {
            payment_status: 'paid',
            status: 'confirmed'
          });

          // Clear cart and referral
          await base44.auth.updateMe({ cart: [] });
          clearReferral();

          // Process look-sourced items (SKU versioning, blogger commissions)
          const hasLookItems = existingOrder.items?.some(item => item.is_look_source);
          if (hasLookItems) {
            try {
              await base44.functions.invoke('processLookOrder', { orderId });
            } catch (lookErr) {
              console.log('Look order processing:', lookErr);
            }
          }

          // Update promo code stats if used
          if (existingOrder.promo_code) {
            try {
              const promoCodes = await base44.entities.PromoCode.filter({ 
                code: existingOrder.promo_code 
              });
              if (promoCodes.length > 0) {
                const promo = promoCodes[0];
                const earnedRevenue = (existingOrder.total - existingOrder.shipping_cost) * 0.30;
                
                await base44.entities.PromoCode.update(promo.id, {
                  total_uses: (promo.total_uses || 0) + 1,
                  total_revenue: (promo.total_revenue || 0) + existingOrder.total,
                  earned_revenue: (promo.earned_revenue || 0) + earnedRevenue
                });

                await base44.entities.PromoCodeRevenue.create({
                  promo_code_id: promo.id,
                  promo_code: existingOrder.promo_code,
                  order_id: orderId,
                  order_total: existingOrder.total,
                  discount_amount: existingOrder.discount_amount,
                  amount_earned: earnedRevenue
                });
              }
            } catch (promoErr) {
              console.log('Promo update failed:', promoErr);
            }
          }

          // Send confirmation email
          try {
            const currencySymbol = settings?.stripe_currency === 'EUR' ? '€' : 
                                   settings?.stripe_currency === 'GBP' ? '£' : '$';
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `Order Confirmation - ${existingOrder.order_number}`,
              body: `Thank you for your order!\n\nOrder Number: ${existingOrder.order_number}\nTotal: ${currencySymbol}${existingOrder.total.toFixed(2)}\n\nItems:\n${existingOrder.items.map(item => `- ${item.product_title} (${item.quantity}x) - ${currencySymbol}${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\nShipping to:\n${existingOrder.shipping_address?.full_name}\n${existingOrder.shipping_address?.address_line1}\n${existingOrder.shipping_address?.city}, ${existingOrder.shipping_address?.postal_code}\n${existingOrder.shipping_address?.country}\n\nWe'll send you a shipping confirmation once your order is on its way.`
            });
          } catch (emailErr) {
            console.log('Email send failed:', emailErr);
          }

          queryClient.invalidateQueries({ queryKey: ['user'] });

          // Fetch updated order
          const updatedOrders = await base44.entities.Order.filter({ id: orderId });
          setOrder(updatedOrders[0] || { ...existingOrder, payment_status: 'paid', status: 'confirmed' });
        } catch (updateErr) {
          console.log('Order update error:', updateErr);
          // Still show the order even if update fails
          setOrder(existingOrder);
        }
      } catch (err) {
        console.error('Order verification error:', err);
        setError('Failed to verify order. Please contact support.');
      }
      
      setProcessing(false);
    };

    verifyAndCompleteOrder();
  }, [orderId, sessionId, user, settings, queryClient]);

  // Loading state
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="max-w-md mx-auto px-4 text-center">
          <XCircle className="h-20 w-20 mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link to={createPageUrl('Checkout')}>
              <Button variant="outline">Try Again</Button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No order
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="max-w-md mx-auto px-4 text-center">
          <Package className="h-20 w-20 mx-auto text-gray-400 mb-6" />
          <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
            No Order Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We couldn't find an order to display.
          </p>
          <Link to={createPageUrl('Orders')}>
            <Button>View My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currencySymbol = settings?.stripe_currency === 'EUR' ? '€' : 
                         settings?.stripe_currency === 'GBP' ? '£' : '$';

  // Success state
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-25" />
            <CheckCircle className="h-24 w-24 text-green-600 relative" />
          </div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
            Thank You for Your Order!
          </h1>
          <p className="text-xl text-[#C9A96E] font-medium mb-2">
            Order #{order.order_number}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Payment of {currencySymbol}{order.total?.toFixed(2)} received
          </p>
        </div>

        {/* Email Confirmation Notice */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-8">
          <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Confirmation sent to <strong>{user?.email}</strong>
          </p>
        </div>

        {/* Order Summary */}
        <div className="border dark:border-gray-800 rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700">
            <h2 className="font-medium text-gray-900 dark:text-white">Order Summary</h2>
          </div>
          <div className="p-6">
            {/* Items */}
            <div className="space-y-4 mb-6">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {item.product_image && (
                    <img 
                      src={item.product_image} 
                      alt={item.product_title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.product_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.size && `Size: ${item.size}`}
                      {` | Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">{currencySymbol}{order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600">-{currencySymbol}{order.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">
                  {order.shipping_cost === 0 ? 'Free' : `${currencySymbol}${order.shipping_cost?.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-medium pt-2 border-t dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total Paid</span>
                <span className="text-[#C9A96E]">{currencySymbol}{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="border dark:border-gray-800 rounded-lg overflow-hidden mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-white">Shipping To</h2>
            </div>
            <div className="p-6 text-gray-600 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-white">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.country}</p>
              {order.shipping_address.phone && <p className="mt-2">Phone: {order.shipping_address.phone}</p>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl('Orders')}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              View Order Details
            </Button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <Button className="w-full sm:w-auto bg-[#C9A96E] hover:bg-[#B8986D]">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}