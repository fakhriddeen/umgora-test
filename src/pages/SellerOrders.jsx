import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { format } from 'date-fns';
import { Search, Eye, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function SellerOrders() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: user } = useQuery({
    queryKey: ['seller-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: seller } = useQuery({
    queryKey: ['seller-profile', user?.email?.toLowerCase()],
    queryFn: async () => {
      if (!user?.email) return null;
      const allSellers = await base44.entities.Seller.list();
      return allSellers.find(s => s.email?.toLowerCase() === user.email.toLowerCase()) || null;
    },
    enabled: !!user?.email,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['seller-products', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return base44.entities.Product.filter({ seller_id: seller.id });
    },
    enabled: !!seller?.id,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['seller-orders', seller?.id, products.length],
    queryFn: async () => {
      if (!seller?.id) return [];
      // If no products yet, return empty
      if (products.length === 0) return [];
      const productIds = products.map(p => p.id);
      const allOrders = await base44.entities.Order.list('-created_date', 500);
      // Filter to only show orders with THIS seller's products
      return allOrders.filter(order => 
        order.items?.some(item => productIds.includes(item.product_id))
      ).map(order => ({
        ...order,
        // Calculate seller-specific revenue (only from their products)
        seller_items: order.items?.filter(item => productIds.includes(item.product_id)) || [],
        seller_total: order.items?.filter(item => productIds.includes(item.product_id))
          .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0,
      }));
    },
    enabled: !!seller?.id,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setSelectedOrder(null);
    },
  });

  const handleStatusChange = (orderId, status) => {
    updateOrderMutation.mutate({ id: orderId, data: { status } });
  };

  const handleAddTracking = () => {
    if (selectedOrder && trackingNumber) {
      updateOrderMutation.mutate({ 
        id: selectedOrder.id, 
        data: { 
          tracking_number: trackingNumber,
          status: 'shipped'
        } 
      });
      setTrackingNumber('');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout requireAdmin={false} requireSeller={true}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
          <p className="text-gray-500 dark:text-gray-400">Orders containing your products</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    Order
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
                    Total
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
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        {searchQuery || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
                      </p>
                      {!searchQuery && statusFilter === 'all' && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Orders containing your products will appear here
                        </p>
                      )}
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
                          {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {order.seller_items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          €{order.seller_total?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[order.status] || statusColors.pending}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.order_number || selectedOrder?.id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[selectedOrder.status]}>
                    {selectedOrder.status}
                  </Badge>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(v) => handleStatusChange(selectedOrder.id, v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>{selectedOrder.shipping_address?.full_name}</p>
                    <p>{selectedOrder.shipping_address?.address_line1}</p>
                    {selectedOrder.shipping_address?.address_line2 && (
                      <p>{selectedOrder.shipping_address.address_line2}</p>
                    )}
                    <p>
                      {selectedOrder.shipping_address?.postal_code} {selectedOrder.shipping_address?.city}
                    </p>
                    <p>{selectedOrder.shipping_address?.country}</p>
                    {selectedOrder.shipping_address?.phone && (
                      <p>Tel: {selectedOrder.shipping_address.phone}</p>
                    )}
                  </div>
                </div>

                {/* Items - Only show seller's products */}
                <div>
                  <h4 className="font-medium mb-2">Your Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.seller_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img src={item.product_image} alt="" className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.product_title}</p>
                            <p className="text-xs text-gray-500">
                              {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">€{item.price?.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking */}
                <div>
                  <h4 className="font-medium mb-2">Tracking</h4>
                  {selectedOrder.tracking_number ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Truck className="inline h-4 w-4 mr-1" />
                      {selectedOrder.tracking_number}
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                      <Button onClick={handleAddTracking} disabled={!trackingNumber}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* Total - Only seller's revenue */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Your Revenue</span>
                    <span>€{selectedOrder.seller_total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}