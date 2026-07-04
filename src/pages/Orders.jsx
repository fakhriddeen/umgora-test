import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import { Package, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Orders() {
  const { t } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: () => base44.entities.Order.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Please login to view your orders
          </p>
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-8">
          {t('orderHistory')}
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              No orders yet
            </p>
            <Link to={createPageUrl('ProductList')}>
              <button className="text-sm text-gray-900 dark:text-white underline">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="border dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t('orderNumber')}: {order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.created_date).toLocaleDateString()} at {new Date(order.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[order.status]}>
                      {order.status.toUpperCase()}
                    </Badge>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'}
                        alt={item.product_title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-gray-900 dark:text-white truncate">
                          {item.product_title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.items.length > 4 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    +{order.items.length - 4} more items
                  </p>
                )}

                {order.tracking_number && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 mb-4">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Tracking Number:</strong> {order.tracking_number}
                    </p>
                  </div>
                )}

                {order.shipping_address && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Shipping to:</strong> {order.shipping_address.full_name}, {order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.country}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}