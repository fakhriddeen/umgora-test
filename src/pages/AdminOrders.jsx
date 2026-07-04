import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import AdminLayout from '../components/admin/AdminLayout';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, MoreHorizontal, Eye, Printer, RefreshCw, Package, CreditCard, ExternalLink, TestTube } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function AdminOrders() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || 'all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200)
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => base44.entities.Seller.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list()
  });

  // Helper to get seller for an order item
  const getSellerForItem = (item) => {
    const product = products.find(p => p.id === item.product_id);
    if (!product?.seller_id) return null;
    return sellers.find(s => s.id === product.seller_id);
  };

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }) => base44.entities.Order.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
    }
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.shipping_address?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Order #', 'Customer', 'Date', 'Total', 'Status', 'Payment'];
    const rows = filteredOrders.map(o => [
      o.order_number || '',
      o.shipping_address?.full_name || '',
      o.created_date ? format(new Date(o.created_date), 'yyyy-MM-dd') : '',
      o.total?.toFixed(2) || '0',
      o.status || 'pending',
      o.payment_status || 'pending'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-gray-500 dark:text-gray-400">{filteredOrders.length} orders</p>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{order.order_number || order.id?.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {order.shipping_address?.full_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {order.created_date ? format(new Date(order.created_date), 'MMM d, HH:mm') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {order.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const orderSellers = [...new Set(order.items?.map(item => {
                            const seller = getSellerForItem(item);
                            return seller?.brand_name;
                          }).filter(Boolean))];
                          return orderSellers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {orderSellers.slice(0, 2).map((name, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                              ))}
                              {orderSellers.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{orderSellers.length - 2}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Direct</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          €{order.total?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} 
                                 className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}>
                            {order.payment_status || 'pending'}
                          </Badge>
                          {order.is_test_order && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <TestTube className="h-3 w-3 mr-1" />
                              Test
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[order.status] || statusColors.pending}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refund Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <OrderDetails
                order={selectedOrder}
                onUpdate={(data) => updateOrderMutation.mutate({ orderId: selectedOrder.id, data })}
                updating={updateOrderMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function OrderDetails({ order, onUpdate, updating }) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');

  const handleUpdate = () => {
    onUpdate({ status, tracking_number: trackingNumber });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
          <p className="font-medium text-gray-900 dark:text-white">{order.order_number}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {new Date(order.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Items</p>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 border dark:border-gray-800 rounded p-3">
              <img
                src={item.product_image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'}
                alt={item.product_title}
                className="w-16 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{item.product_title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t dark:border-gray-800 pt-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className="text-gray-900 dark:text-white">${order.shipping_cost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium text-lg">
          <span className="text-gray-900 dark:text-white">Total</span>
          <span className="text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
        </div>
      </div>

      {order.shipping_address && (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm">
            <p className="text-gray-900 dark:text-white">{order.shipping_address.full_name}</p>
            <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.address_line1}</p>
            {order.shipping_address.address_line2 && (
              <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.address_line2}</p>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              {order.shipping_address.city}, {order.shipping_address.postal_code}
            </p>
            <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.country}</p>
            <p className="text-gray-600 dark:text-gray-400">{order.shipping_address.phone}</p>
          </div>
        </div>
      )}

      {/* Stripe Payment Info */}
      {order.stripe_session_id && (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Information</p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Status</span>
              <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}>
                {order.payment_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Stripe Session ID</span>
              <span className="font-mono text-xs text-gray-500">{order.stripe_session_id?.slice(0, 20)}...</span>
            </div>
            {order.is_test_order && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <TestTube className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700 dark:text-blue-300">This is a test order - no real payment was made</span>
              </div>
            )}
            <a 
              href="https://dashboard.stripe.com/payments" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              <ExternalLink className="h-4 w-4" />
              View in Stripe Dashboard
            </a>
          </div>
        </div>
      )}

      <div className="border-t dark:border-gray-800 pt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            Order Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            Tracking Number
          </label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>

        <Button onClick={handleUpdate} disabled={updating} className="w-full">
          {updating ? 'Updating...' : 'Update Order'}
        </Button>
      </div>
    </div>
  );
}