import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { format } from 'date-fns';
import { 
  Search, Plus, MoreHorizontal, Store, Edit, Trash2, Mail, Ban, Check, Loader2, Eye, Package, ShoppingCart, DollarSign, Percent
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending_invitation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminSellers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(urlParams.get('action') === 'new');
  const [editingSeller, setEditingSeller] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    brand_name: '',
    contact_name: '',
    phone: '',
    commission_rate: 15,
    send_invitation: true,
  });
  const [viewingSeller, setViewingSeller] = useState(null);

  // Fetch sellers, products, and orders
  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => base44.entities.Seller.list('-created_date', 100),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  // Get seller stats
  const getSellerStats = (sellerId) => {
    const sellerProducts = allProducts.filter(p => p.seller_id === sellerId);
    const productIds = sellerProducts.map(p => p.id);
    
    // Find paid orders with this seller's products
    const sellerOrders = allOrders.filter(order => 
      order.payment_status === 'paid' &&
      order.items?.some(item => item.seller_id === sellerId)
    );

    const seller = sellers.find(s => s.id === sellerId);
    const commissionRate = seller?.commission_rate || 15;

    let totalRevenue = 0;
    let sellerEarnings = 0;
    let platformCommission = 0;

    sellerOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.seller_id === sellerId) {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          totalRevenue += itemTotal;
          
          if (item.is_look_source) {
            // Look-sourced: 75% to seller, 15% platform, 10% blogger
            sellerEarnings += itemTotal * 0.75;
            platformCommission += itemTotal * 0.15;
          } else {
            // Regular: based on commission rate
            sellerEarnings += itemTotal * (1 - commissionRate / 100);
            platformCommission += itemTotal * (commissionRate / 100);
          }
        }
      });
    });

    const paidOut = seller?.paid_out || 0;
    const pending = Math.max(0, sellerEarnings - paidOut);

    return {
      products: sellerProducts,
      orders: sellerOrders,
      totalRevenue,
      platformCommission,
      sellerEarnings,
      paidOut,
      pending,
      commissionRate
    };
  };



  // Generate unique SKU prefix from email
  const generateSkuPrefix = (email) => {
    const name = email.split('@')[0].toUpperCase();
    // Take first 2 letters
    let prefix = name.substring(0, 2);
    // Ensure it's valid
    if (prefix.length < 2) prefix = prefix.padEnd(2, 'X');
    return prefix;
  };

  const createSellerMutation = useMutation({
    mutationFn: async (data) => {
      // Generate unique SKU prefix
      const skuPrefix = generateSkuPrefix(data.email);
      
      // Create seller record directly - immediately active
      const seller = await base44.entities.Seller.create({
        email: data.email.toLowerCase(),
        brand_name: data.brand_name,
        contact_name: data.contact_name,
        phone: data.phone,
        commission_rate: data.commission_rate,
        sku_prefix: skuPrefix,
        sku_counter: 0,
        status: 'active',
        invitation_accepted: true,
        invitation_shown: true,
      });
      
      // Send welcome email if requested
      if (data.send_invitation) {
        const loginLink = `${window.location.origin}/Profile`;
        await base44.integrations.Core.SendEmail({
          to: data.email,
          subject: 'Welcome to ÉLÉGANT - Your Seller Account is Ready!',
          body: `
            <h1>Welcome to ÉLÉGANT!</h1>
            <p>Your seller account has been created and is ready to use.</p>
            <p><strong>Brand:</strong> ${data.brand_name}</p>
            <p><strong>Commission Rate:</strong> ${data.commission_rate}%</p>
            <p>Simply log in with this email to access your Seller Dashboard:</p>
            <p><a href="${loginLink}" style="display: inline-block; padding: 12px 24px; background: #C9A96E; color: white; text-decoration: none; border-radius: 6px;">Go to ÉLÉGANT</a></p>
            <p>Once logged in, you'll see the "Seller Dashboard" option in your account menu.</p>
          `
        });
      }
      
      return seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: 'Seller Added!',
        description: 'The seller account is now active and ready to use.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Seller.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setIsFormOpen(false);
      setEditingSeller(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Seller.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      brand_name: '',
      contact_name: '',
      phone: '',
      commission_rate: 15,
      send_invitation: true,
    });
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setFormData({
      email: seller.email || '',
      brand_name: seller.brand_name || '',
      contact_name: seller.contact_name || '',
      phone: seller.phone || '',
      commission_rate: seller.commission_rate || 15,
      send_invitation: false,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (editingSeller) {
      updateMutation.mutate({ id: editingSeller.id, data: formData });
    } else {
      createSellerMutation.mutate(formData);
    }
  };



  const handleStatusChange = (seller, newStatus) => {
    updateMutation.mutate({ id: seller.id, data: { status: newStatus } });
  };

  // Filter sellers
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = !searchQuery || 
      seller.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sellers</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage seller access and permissions</p>
          </div>
          <Button onClick={() => { resetForm(); setEditingSeller(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Seller
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by brand name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_invitation">Pending Invitation</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sellers Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
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
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                    </td>
                  </tr>
                ) : filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No sellers found
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {seller.logo ? (
                              <img src={seller.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <Store className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {seller.brand_name}
                            </p>
                            <p className="text-xs text-gray-500">{seller.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {seller.contact_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {seller.created_date ? new Date(seller.created_date).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {seller.commission_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {getSellerStats(seller.id).products.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            €{getSellerStats(seller.id).sellerEarnings.toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500">
                            Pending: €{getSellerStats(seller.id).pending.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[seller.status] || statusColors.active}>
                          {seller.status?.replace('_', ' ') || 'active'}
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
                            <DropdownMenuItem onClick={() => setViewingSeller(seller)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(seller)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {seller.status === 'pending_invitation' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(seller, 'active')}>
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {seller.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(seller, 'suspended')}>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {seller.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(seller, 'active')}>
                                <Check className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteConfirm(seller)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
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

        {/* Add/Edit Seller Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSeller ? 'Edit Seller' : 'Add New Seller'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seller@example.com"
                />
              </div>
              <div>
                <Label>Brand Name *</Label>
                <Input
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  placeholder="Brand name"
                />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Contact person"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+49..."
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                />
              </div>
              {!editingSeller && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="send_invitation"
                    checked={formData.send_invitation}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_invitation: checked })}
                  />
                  <Label htmlFor="send_invitation" className="cursor-pointer">
                    Send invitation email
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.email || !formData.brand_name || createSellerMutation.isPending || updateMutation.isPending}
              >
                {createSellerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : editingSeller ? 'Update' : 'Add Seller'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Seller</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {deleteConfirm?.brand_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Seller Detail Modal */}
        <Dialog open={!!viewingSeller} onOpenChange={() => setViewingSeller(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {viewingSeller?.logo ? (
                  <img src={viewingSeller.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Store className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                {viewingSeller?.brand_name}
              </DialogTitle>
            </DialogHeader>
            {viewingSeller && (() => {
              const stats = getSellerStats(viewingSeller.id);
              return (
                <div className="space-y-6">
                  {/* Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Package className="h-4 w-4" />
                        <span className="text-xs">Products</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.products.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-xs">Orders</span>
                      </div>
                      <p className="text-2xl font-bold">{stats.orders.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Percent className="h-4 w-4" />
                        <span className="text-xs">Platform Commission ({stats.commissionRate}%)</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">€{stats.platformCommission.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewingSeller.email}</span></div>
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{viewingSeller.contact_name || '-'}</span></div>
                    <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{viewingSeller.phone || '-'}</span></div>
                    <div><span className="text-gray-500">SKU Prefix:</span> <span className="font-medium font-mono">{viewingSeller.sku_prefix || '-'}</span></div>
                  </div>

                  {/* Products */}
                  <div>
                    <h4 className="font-medium mb-3">Products ({stats.products.length})</h4>
                    {stats.products.length === 0 ? (
                      <p className="text-gray-500 text-sm">No products yet</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                        {stats.products.slice(0, 8).map(product => (
                          <div key={product.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="h-10 w-10 object-cover rounded" />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{product.title_en}</p>
                              <p className="text-xs text-gray-500">€{product.price?.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                        {stats.products.length > 8 && (
                          <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-500">
                            +{stats.products.length - 8} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <h4 className="font-medium mb-3">Recent Orders ({stats.orders.length})</h4>
                    {stats.orders.length === 0 ? (
                      <p className="text-gray-500 text-sm">No orders yet</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stats.orders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div>
                              <p className="text-sm font-medium">#{order.order_number || order.id?.slice(-8)}</p>
                              <p className="text-xs text-gray-500">{order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">€{order.seller_total?.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">{order.seller_items?.length} items</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="font-medium">€{stats.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Platform Commission ({stats.commissionRate}%)</span>
                        <span className="font-medium">€{stats.platformCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Seller Earnings</span>
                        <span>€{stats.sellerEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}