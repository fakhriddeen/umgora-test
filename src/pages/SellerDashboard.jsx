import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MetricCard from '../components/admin/MetricCard';
import { Package, ShoppingCart, DollarSign, Wallet, Plus, TrendingUp, Eye, Search, MoreHorizontal, Edit, Trash2, Upload, X, Download, Truck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function SellerDashboard() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'dashboard');
  
  // Product form state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(urlParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Order state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // Payout request state
  const [showPayoutRequestDialog, setShowPayoutRequestDialog] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  
  const availableSizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
  
  const [formData, setFormData] = useState({
    title_en: '',
    title_de: '',
    title_ru: '',
    description_en: '',
    description_de: '',
    description_ru: '',
    price: 0,
    images: [],
    category_id: '',
    gender: 'unisex',
    brand: '',
    size_type: 'clothing',
    total_stock: 0,
    is_active: true,
    is_new: false,
    variants: [],
  });

  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [translating, setTranslating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['seller-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: seller, refetch: refetchSeller } = useQuery({
    queryKey: ['seller-profile', user?.email?.toLowerCase()],
    queryFn: async () => {
      if (!user?.email) return null;
      const allSellers = await base44.entities.Seller.list();
      return allSellers.find(s => s.email?.toLowerCase() === user.email.toLowerCase()) || null;
    },
    enabled: !!user?.email,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return base44.entities.Product.filter({ seller_id: seller.id });
    },
    enabled: !!seller?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const allCategories = await base44.entities.Category.list('name_en', 100);
      return allCategories.filter(cat => cat.is_active !== false);
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['seller-orders', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      // Fetch ALL orders (no limit) to match admin calculation exactly
      const allOrders = await base44.entities.Order.list('-created_date', 10000);
      // Fetch products to get their IDs
      const sellerProducts = await base44.entities.Product.filter({ seller_id: seller.id });
      if (sellerProducts.length === 0) return [];
      const productIds = sellerProducts.map(p => p.id);
      
      return allOrders.filter(order => 
        order.items?.some(item => productIds.includes(item.product_id))
      ).map(order => ({
        ...order,
        seller_items: order.items?.filter(item => productIds.includes(item.product_id)) || [],
        seller_total: order.items?.filter(item => productIds.includes(item.product_id))
          .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0,
      }));
    },
    enabled: !!seller?.id,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: payoutHistory = [] } = useQuery({
    queryKey: ['seller-payouts', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return await base44.entities.SellerPayout.filter({ seller_id: seller.id }, '-payout_date');
    },
    enabled: !!seller?.id,
  });

  const { data: payoutRequests = [] } = useQuery({
    queryKey: ['seller-payout-requests', seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      return await base44.entities.PayoutRequest.filter({ seller_id: seller.id }, '-created_date');
    },
    enabled: !!seller?.id,
  });

  // Calculate seller balance - EXACT SAME as admin calculation
  const commissionRate = seller?.commission_rate || 15;
  
  // Get all paid orders
  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  
  // Use EXACT same calculation as AdminPayouts
  let sellerBalance = { totalSales: 0, pending: 0, paidOut: 0 };
  
  // Iterate through ALL paid orders
  paidOrders.forEach(order => {
    order.seller_items?.forEach(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      sellerBalance.totalSales += itemTotal;
      
      // Calculate seller's share - EXACT same as admin
      if (item.is_look_source) {
        // Look-sourced: 75% to seller
        sellerBalance.pending += itemTotal * 0.75;
      } else {
        // Regular: seller gets (100 - commission_rate)%
        sellerBalance.pending += itemTotal * (1 - commissionRate / 100);
      }
    });
  });
  
  // Subtract paid out amount - EXACT same as admin
  sellerBalance.paidOut = seller?.paid_out || 0;
  sellerBalance.pending -= sellerBalance.paidOut;
  sellerBalance.pending = Math.max(0, sellerBalance.pending);
  
  // Use same variable names as before for display
  const totalSales = sellerBalance.totalSales;
  const netRevenue = sellerBalance.pending + sellerBalance.paidOut; // Total earned after commission
  const pendingPayout = sellerBalance.pending; // Available to withdraw
  const paidOut = sellerBalance.paidOut; // Already paid out
  
  // For display breakdown
  const lookSourcedRevenue = paidOrders.reduce((sum, order) => {
    const lookItems = order.seller_items?.filter(item => item.is_look_source) || [];
    return sum + lookItems.reduce((s, item) => s + (item.price * (item.quantity || 1)), 0);
  }, 0);
  const regularRevenue = totalSales - lookSourcedRevenue;
  const lookSourcedNet = lookSourcedRevenue * 0.75;
  const regularNet = regularRevenue * (1 - commissionRate / 100);
  const platformCommission = totalSales - netRevenue;

  // Chart data (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => 
      o.created_date?.split('T')[0] === dateStr
    );
    const dayGross = dayOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.seller_total || 0), 0);
    chartData.push({
      date: date.toLocaleDateString('en', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayGross - (dayGross * commissionRate / 100),
    });
  }

  // Product mutations
  const generateNextSku = async () => {
    if (!seller) return '';
    const prefix = seller.sku_prefix || 'XX';
    const nextNum = (seller.sku_counter || 0) + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const sku = await generateNextSku();
      const product = await base44.entities.Product.create({ 
        ...data, 
        seller_id: seller?.id,
        sku: sku,
      });
      await base44.entities.Seller.update(seller.id, {
        sku_counter: (seller.sku_counter || 0) + 1,
        total_products: (seller.total_products || 0) + 1,
      });
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      refetchSeller();
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const product = products.find(p => p.id === id);
      if (!product || product.seller_id !== seller?.id) {
        throw new Error('You can only edit your own products');
      }
      return base44.entities.Product.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setIsFormOpen(false);
      setEditingProduct(null);
      resetForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const product = products.find(p => p.id === id);
      if (!product || product.seller_id !== seller?.id) {
        throw new Error('You can only delete your own products');
      }
      return base44.entities.Product.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setDeleteConfirm(null);
    },
  });

  // Order mutations
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setSelectedOrder(null);
    },
  });

  // Payout request mutation
  const createPayoutRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.PayoutRequest.create({
        seller_id: seller.id,
        amount: parseFloat(data.amount),
        notes: data.notes,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-payout-requests'] });
      setShowPayoutRequestDialog(false);
      setRequestAmount('');
      setRequestNotes('');
      alert('Payout request submitted successfully! Admin will review it shortly.');
    },
  });

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_de: '',
      title_ru: '',
      description_en: '',
      description_de: '',
      description_ru: '',
      price: 0,
      images: [],
      category_id: '',
      gender: 'unisex',
      brand: seller?.brand_name || '',
      size_type: 'clothing',
      total_stock: 0,
      is_active: true,
      is_new: false,
      variants: [],
    });
  };

  const generateDescription = async () => {
    if (!formData.title_en) {
      alert('Please enter a product title first');
      return;
    }

    setGeneratingDesc(true);
    try {
      const category = categories.find(c => c.id === formData.category_id);
      const categoryName = category?.name_en || 'product';
      
      const prompt = `Write a compelling product description for an e-commerce platform.

Product Title: ${formData.title_en}
Category: ${categoryName}
Gender: ${formData.gender}
Brand: ${formData.brand || seller?.brand_name || 'N/A'}
Price: €${formData.price || 'TBD'}
${formData.size_type ? `Size Type: ${formData.size_type}` : ''}

Create a professional, engaging description (2-3 sentences) that highlights the product's key features, benefits, and appeal. Be concise and persuasive.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setFormData({ ...formData, description_en: response.trim() });
    } catch (error) {
      alert('Failed to generate description. Please try again.');
    }
    setGeneratingDesc(false);
  };

  const translateTitles = async () => {
    const filledFields = [
      { key: 'title_en', lang: 'English' },
      { key: 'title_de', lang: 'German' },
      { key: 'title_ru', lang: 'Russian' }
    ].filter(f => formData[f.key]);

    if (filledFields.length === 0) {
      alert('Please enter at least one product title first');
      return;
    }

    setTranslating(true);
    try {
      const source = filledFields[0];
      const targetLangs = [
        { key: 'title_en', lang: 'English' },
        { key: 'title_de', lang: 'German' },
        { key: 'title_ru', lang: 'Russian' }
      ].filter(t => t.key !== source.key);

      const prompt = `Translate the following product title to ${targetLangs.map(t => t.lang).join(' and ')}.

Original (${source.lang}): ${formData[source.key]}

Provide translations in this exact JSON format:
{
  "${targetLangs[0].key}": "translation here",
  "${targetLangs[1].key}": "translation here"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: targetLangs.reduce((acc, t) => ({ ...acc, [t.key]: { type: 'string' } }), {})
        }
      });

      setFormData({ ...formData, ...response });
    } catch (error) {
      alert('Failed to translate. Please try again.');
    }
    setTranslating(false);
  };

  const toggleSize = (size) => {
    const variants = formData.variants || [];
    const existingIndex = variants.findIndex(v => v.size === size);
    if (existingIndex >= 0) {
      setFormData({ ...formData, variants: variants.filter((_, i) => i !== existingIndex) });
    } else {
      setFormData({ ...formData, variants: [...variants, { size, color: null, color_hex: null }] });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, images: [...(formData.images || []), result.file_url] });
    } catch (err) {
      alert('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const handleEditProduct = (product) => {
    if (product.seller_id !== seller?.id) {
      alert('You can only edit your own products.');
      return;
    }
    setEditingProduct(product);
    setFormData({
      title_en: product.title_en || '',
      title_de: product.title_de || '',
      title_ru: product.title_ru || '',
      description_en: product.description_en || '',
      description_de: product.description_de || '',
      description_ru: product.description_ru || '',
      price: product.price || 0,
      images: product.images || [],
      category_id: product.category_id || '',
      gender: product.gender || 'unisex',
      brand: product.brand || '',
      size_type: product.size_type || 'clothing',
      total_stock: product.total_stock || 0,
      is_active: product.is_active ?? true,
      is_new: product.is_new ?? false,
      variants: product.variants || [],
    });
    setIsFormOpen(true);
  };

  const handleProductSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleStatusChange = (orderId, status) => {
    updateOrderMutation.mutate({ id: orderId, data: { status } });
  };

  const handleAddTracking = () => {
    if (selectedOrder && trackingNumber) {
      updateOrderMutation.mutate({ 
        id: selectedOrder.id, 
        data: { tracking_number: trackingNumber, status: 'shipped' } 
      });
      setTrackingNumber('');
    }
  };

  const filteredProducts = products.filter(product =>
    !searchQuery || 
    product.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !orderSearchQuery || 
      order.order_number?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(orderSearchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Access control - only active sellers can access
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access your seller dashboard</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Login</Button>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need an active seller account to access this dashboard.
          </p>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome, {seller?.brand_name || user?.full_name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your store</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="My Products" value={products.length} icon={Package} color="blue" />
              <MetricCard title="My Orders" value={orders.length} icon={ShoppingCart} color="green" />
              <MetricCard title="Total Sales (Gross)" value={totalSales.toFixed(2)} icon={DollarSign} color="purple" prefix="€" />
              <MetricCard title="Net Revenue" value={netRevenue.toFixed(2)} icon={Wallet} color="orange" prefix="€" />
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Sales (Gross)</span>
                  <span className="font-medium text-gray-900 dark:text-white">€{totalSales.toFixed(2)}</span>
                </div>
                {lookSourcedRevenue > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        From Look Referrals (75% to you)
                      </span>
                      <span className="text-purple-600">€{lookSourcedRevenue.toFixed(2)} → €{lookSourcedNet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Regular Sales ({100 - commissionRate}% to you)</span>
                      <span className="text-gray-500">€{regularRevenue.toFixed(2)} → €{regularNet.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-red-600">
                  <span>Total Platform Fees</span>
                  <span className="font-medium">-€{platformCommission.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">Your Net Revenue</span>
                  <span className="text-xl font-bold text-green-600">€{netRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Virtual Balance Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payout Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">€{netRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Already Paid</p>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-400">€{paidOut.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-xl font-bold text-green-600">€{pendingPayout.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 Payouts are processed manually by admin. Contact support for payout requests.
              </p>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Net Revenue (Last 7 Days)</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>After {commissionRate}% commission</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => { resetForm(); setEditingProduct(null); setIsFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {productsLoading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" /></td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 mb-2">{searchQuery ? 'No products match your search' : 'No products yet'}</p>
                          {!searchQuery && <Button onClick={() => { resetForm(); setEditingProduct(null); setIsFormOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Your First Product</Button>}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-12 w-12 object-cover rounded" /> : <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"><Package className="h-5 w-5 text-gray-500" /></div>}
                              <div><p className="text-sm font-medium text-gray-900 dark:text-white">{product.title_en}</p>{product.is_new && <Badge variant="secondary" className="text-xs">New</Badge>}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-sm text-gray-500">{product.sku || '-'}</span></td>
                          <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 dark:text-white">€{product.price?.toFixed(2)}</span></td>
                          <td className="px-4 py-3"><Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteConfirm(product)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search orders..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {ordersLoading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" /></td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 mb-2">{orderSearchQuery || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">Orders containing your products will appear here</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 dark:text-white">#{order.order_number || order.id?.slice(-8)}</span></td>
                          <td className="px-4 py-3"><span className="text-sm text-gray-600 dark:text-gray-300">{order.shipping_address?.full_name || 'N/A'}</span></td>
                          <td className="px-4 py-3"><span className="text-sm text-gray-500">{order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : 'N/A'}</span></td>
                          <td className="px-4 py-3"><span className="text-sm text-gray-600 dark:text-gray-300">{order.seller_items?.length || 0} items</span></td>
                          <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900 dark:text-white">€{order.seller_total?.toFixed(2)}</span></td>
                          <td className="px-4 py-3"><Badge className={statusColors[order.status] || statusColors.pending}>{order.status}</Badge></td>
                          <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4 mr-1" />View</Button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Payout Summary</h3>
                <Button
                  onClick={() => {
                    setRequestAmount(pendingPayout > 0 ? pendingPayout.toFixed(2) : '');
                    setShowPayoutRequestDialog(true);
                  }}
                  disabled={pendingPayout <= 0}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Request Payout
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">€{netRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">From {paidOrders.length} paid orders</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Already Paid</p>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-400">€{paidOut.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">{payoutHistory.length} payouts</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-xl font-bold text-green-600">€{pendingPayout.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Ready to withdraw</p>
                </div>
              </div>
            </div>

            {/* Pending Payout Requests */}
            {payoutRequests.filter(r => r.status === 'pending').length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pending Requests</h3>
                <div className="space-y-3">
                  {payoutRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">€{request.amount?.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{request.notes || 'No notes'}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payout Request History */}
            {payoutRequests.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Payout Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {payoutRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {request.created_date ? format(new Date(request.created_date), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            €{request.amount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'completed' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{request.notes || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{request.admin_notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Completed Payouts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {payoutHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <DollarSign className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No payout history yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Payouts will appear here once processed</p>
                        </td>
                      </tr>
                    ) : (
                      payoutHistory.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {payout.payout_date ? format(new Date(payout.payout_date), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-green-600">€{payout.amount?.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">{payout.payment_method || '-'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">{payout.paid_by || 'Admin'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">{payout.notes || '-'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Product Titles</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={translateTitles}
                    disabled={translating}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {translating ? 'Translating...' : 'Auto-Translate'}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Title (EN)*</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} /></div>
                  <div><Label>Title (DE)</Label><Input value={formData.title_de || ''} onChange={(e) => setFormData({ ...formData, title_de: e.target.value })} /></div>
                  <div><Label>Title (RU)</Label><Input value={formData.title_ru || ''} onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })} /></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Description (EN)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateDescription}
                    disabled={generatingDesc || !formData.title_en}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generatingDesc ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
                <Textarea 
                  value={formData.description_en || ''} 
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} 
                  rows={4} 
                  placeholder="AI-generated description will appear here, or write your own..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (€)*</Label><Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} /></div>
                <div><Label>Brand</Label><Input value={formData.brand || ''} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Gender</Label><Select value={formData.gender || 'unisex'} onValueChange={(value) => setFormData({ ...formData, gender: value, category_id: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="men">Men</SelectItem><SelectItem value="women">Women</SelectItem><SelectItem value="kids">Kids</SelectItem><SelectItem value="unisex">Unisex</SelectItem></SelectContent></Select></div>
                <div><Label>Category</Label><Select value={formData.category_id || ''} onValueChange={(value) => setFormData({ ...formData, category_id: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter((cat) => {
                  if (!formData.gender) return false;
                  if (formData.gender === 'unisex') {
                    return cat.gender === 'men' || cat.gender === 'women';
                  }
                  return cat.gender === formData.gender;
                }).map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div>
                <Label>Size Type</Label>
                <Select
                  value={formData.size_type || 'clothing'}
                  onValueChange={(value) => setFormData({ ...formData, size_type: value, variants: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing Sizes (XS-XXL)</SelectItem>
                    <SelectItem value="shoes">Shoe Sizes (36-45)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Available Sizes</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(formData.size_type === 'shoes' 
                    ? ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
                    : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
                  ).map((size) => {
                    const variant = formData.variants?.find(v => v.size === size);
                    const isSelected = !!variant;
                    return (
                      <button key={size} type="button" onClick={() => toggleSize(size)} className={`px-4 py-2 rounded-lg border transition-colors ${isSelected ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>{size}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Product Images</Label>
                <div className="mt-2 flex flex-wrap gap-4">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="w-24 h-32 object-cover rounded" />
                      <button type="button" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <label className="w-24 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-400">
                    {uploadingImage ? <span className="text-xs">Uploading...</span> : <><Upload className="h-6 w-6 text-gray-400" /><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></>}
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2"><Checkbox id="is_new" checked={formData.is_new} onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })} /><Label htmlFor="is_new" className="cursor-pointer">New Arrival</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label htmlFor="is_active" className="cursor-pointer">Active</Label></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={handleProductSubmit} disabled={!formData.title_en || formData.price <= 0 || createProductMutation.isPending || updateProductMutation.isPending}>
                {createProductMutation.isPending || updateProductMutation.isPending ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{deleteConfirm?.title_en}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteProductMutation.mutate(deleteConfirm.id)}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span>Order #{selectedOrder?.order_number || selectedOrder?.id?.slice(-8)}</span>
                <Badge className={statusColors[selectedOrder?.status]}>{selectedOrder?.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.created_date ? format(new Date(selectedOrder.created_date), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.created_date ? format(new Date(selectedOrder.created_date), 'HH:mm') : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Update Status</p>
                    <Select value={selectedOrder.status} onValueChange={(v) => handleStatusChange(selectedOrder.id, v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Shipping Address - Improved Layout */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Address
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Customer Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.shipping_address?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.shipping_address?.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase mb-1">Full Address</p>
                      <div className="text-gray-900 dark:text-white">
                        <p>{selectedOrder.shipping_address?.address_line1 || 'N/A'}</p>
                        {selectedOrder.shipping_address?.address_line2 && (
                          <p>{selectedOrder.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {selectedOrder.shipping_address?.postal_code && `${selectedOrder.shipping_address.postal_code}, `}
                          {selectedOrder.shipping_address?.city || ''}
                        </p>
                        <p className="font-medium">{selectedOrder.shipping_address?.country || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Your Items ({selectedOrder.seller_items?.length || 0})
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedOrder.seller_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4">
                        {item.product_image ? (
                          <img src={item.product_image} alt="" className="h-16 w-16 object-cover rounded-lg" />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">{item.product_title}</p>
                              {item.is_look_source && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Look
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-3 mt-1 text-sm text-gray-500">
                              {item.size && <span>Size: <strong>{item.size}</strong></span>}
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              {item.sku_used && <span>SKU: <strong>{item.sku_used}</strong></span>}
                            </div>
                          </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">€{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">€{item.price?.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Tracking Information</h4>
                  </div>
                  <div className="p-4">
                    {selectedOrder.tracking_number ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Truck className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">{selectedOrder.tracking_number}</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter tracking number" 
                          value={trackingNumber} 
                          onChange={(e) => setTrackingNumber(e.target.value)} 
                          className="flex-1"
                        />
                        <Button onClick={handleAddTracking} disabled={!trackingNumber}>
                          <Truck className="h-4 w-4 mr-2" />
                          Add Tracking
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Revenue from this Order</p>
                      <p className="text-xs text-gray-500">After platform commission</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{selectedOrder.seller_total?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payout Request Dialog */}
        <Dialog open={showPayoutRequestDialog} onOpenChange={setShowPayoutRequestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Available Balance</Label>
                <p className="text-2xl font-bold text-green-600">€{pendingPayout.toFixed(2)}</p>
              </div>
              <div>
                <Label>Amount to Request</Label>
                <Input
                  type="number"
                  step="0.01"
                  max={pendingPayout}
                  placeholder="Enter amount"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: €{pendingPayout.toFixed(2)}</p>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes or payment details..."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <p className="text-xs text-gray-500">
                Your request will be reviewed by an admin. You'll be notified once it's processed.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutRequestDialog(false)}>Cancel</Button>
              <Button
                onClick={() => createPayoutRequestMutation.mutate({ amount: requestAmount, notes: requestNotes })}
                disabled={!requestAmount || parseFloat(requestAmount) <= 0 || parseFloat(requestAmount) > pendingPayout || createPayoutRequestMutation.isPending}
              >
                {createPayoutRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
}