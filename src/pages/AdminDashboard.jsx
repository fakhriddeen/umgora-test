import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import MetricCard from '../components/admin/MetricCard';
import RecentOrdersTable from '../components/admin/RecentOrdersTable';
import { 
  Package, ShoppingCart, Users, DollarSign, 
  Clock, Zap, Plus, TrendingUp, Sparkles, Search, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: () => base44.entities.PromoCode.list('-created_date', 100),
  });

  const { data: bloggers = [] } = useQuery({
    queryKey: ['admin-bloggers'],
    queryFn: () => base44.entities.Blogger.list('-created_date', 100),
  });

  const { data: referralLogs = [] } = useQuery({
    queryKey: ['admin-referral-logs'],
    queryFn: () => base44.entities.LookReferralLog.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list('name_en', 100),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => base44.entities.Seller.list('-pending_payout', 100),
  });

  // Calculate metrics
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'live').length;
  
  // Look referral metrics
  const totalBloggerCommissions = referralLogs.reduce((sum, log) => sum + (log.blogger_fee_cents || 0), 0) / 100;
  const totalPlatformFees = referralLogs.reduce((sum, log) => sum + (log.platform_fee_cents || 0), 0) / 100;
  const lookSourcedOrders = orders.filter(o => o.items?.some(item => item.is_look_source)).length;
  
  // Calculate seller pending balances from paid orders
  const sellerBalances = {};
  orders.filter(o => o.payment_status === 'paid').forEach(order => {
    order.items?.forEach(item => {
      const sellerId = item.seller_id;
      if (!sellerId) return;
      
      if (!sellerBalances[sellerId]) {
        sellerBalances[sellerId] = 0;
      }
      
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      
      // Calculate seller's share
      if (item.is_look_source) {
        // Look-sourced: 75% to seller, 10% blogger, 15% platform
        sellerBalances[sellerId] += itemTotal * 0.75;
      } else {
        // Regular: seller gets (100 - commission_rate)%
        const seller = sellers.find(s => s.id === sellerId);
        const commissionRate = seller?.commission_rate || 15;
        sellerBalances[sellerId] += itemTotal * (1 - commissionRate / 100);
      }
    });
  });
  
  // Subtract what's been paid out
  sellers.forEach(seller => {
    if (sellerBalances[seller.id]) {
      sellerBalances[seller.id] -= (seller.paid_out || 0);
    }
  });
  
  const totalSellerPending = Object.values(sellerBalances).reduce((sum, val) => sum + Math.max(0, val), 0);
  const totalBloggerPending = bloggers.reduce((sum, b) => sum + (Number(b.balance_cents) || 0), 0) / 100;
  
  // Calculate total seller paid out
  const totalSellerPaidOut = sellers.reduce((sum, s) => sum + (s.paid_out || 0), 0);
  
  // Calculate total blogger paid out
  const totalBloggerPaidOut = bloggers.reduce((sum, b) => sum + ((b.paid_out_cents || 0) / 100), 0);
  
  // Platform revenue = Total Collected - (Seller Pending + Seller Paid) - (Blogger Pending + Blogger Paid)
  const platformRevenue = Math.max(0, totalRevenue - (totalSellerPending + totalSellerPaidOut) - (totalBloggerPending + totalBloggerPaidOut));

  // Calculate trends (mock data for now - would compare with previous period)
  const lastMonthOrders = orders.filter(o => {
    const date = new Date(o.created_date);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return date >= lastMonth;
  });

  // Chart data (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => 
      o.created_date?.split('T')[0] === dateStr
    );
    chartData.push({
      date: date.toLocaleDateString('en', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    });
  }

  const handleStatusChange = (orderId, status) => {
    updateOrderMutation.mutate({ id: orderId, data: { status } });
  };

  // Get only categories that have products
  const usedCategories = categories.filter(cat => 
    products.some(p => p.category_id === cat.id)
  );

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearch || 
      product.title_en?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('AdminProducts') + '?action=new'}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Collected (Stripe)"
            value={totalRevenue.toFixed(2)}
            icon={DollarSign}
            color="green"
            prefix="€"
            trend="up"
            trendValue="Real money in your account"
          />
          <MetricCard
            title="Seller Balances"
            value={totalSellerPending.toFixed(2)}
            icon={Users}
            color="orange"
            prefix="€"
            link={createPageUrl('AdminPayouts')}
          />
          <MetricCard
            title="Blogger Balances"
            value={totalBloggerPending.toFixed(2)}
            icon={Sparkles}
            color="purple"
            prefix="€"
            link={createPageUrl('AdminPayouts')}
          />
          <MetricCard
            title="Platform Revenue"
            value={platformRevenue.toFixed(2)}
            icon={DollarSign}
            color="blue"
            prefix="€"
            trend="up"
            trendValue="After all payouts"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Orders"
            value={orders.length}
            icon={ShoppingCart}
            color="green"
            link={createPageUrl('AdminOrders')}
          />
          <MetricCard
            title="Pending Orders"
            value={pendingOrders}
            icon={Clock}
            color="orange"
            link={createPageUrl('AdminOrders') + '?status=pending'}
          />
          <MetricCard
            title="Look-Sourced Orders"
            value={lookSourcedOrders}
            icon={Sparkles}
            color="purple"
          />
          <MetricCard
            title="Active Campaigns"
            value={activeCampaigns}
            icon={Zap}
            color="pink"
            link={createPageUrl('AdminCampaigns')}
          />
        </div>

        {/* Product Filters & List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Products</h3>
            <Link to={createPageUrl('AdminProducts')}>
              <Button size="sm" variant="outline">View All</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {usedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProducts.slice(0, 8).map((product) => (
              <Link 
                key={product.id} 
                to={createPageUrl('AdminProducts') + '?id=' + product.id}
                className="flex items-center gap-4 p-3 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{product.title_en}</p>
                  <p className="text-sm text-gray-500">Stock: {product.total_stock || 0}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">€{product.price?.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                </div>
              </Link>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No products found</p>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+15%</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Orders Overview</h3>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span>+8%</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to={createPageUrl('AdminProducts') + '?action=new'}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-colors text-center"
          >
            <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Product</span>
          </Link>
          <Link 
            to={createPageUrl('AdminCampaigns') + '?action=new'}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-pink-500 transition-colors text-center"
          >
            <Zap className="h-8 w-8 mx-auto mb-2 text-pink-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">New Campaign</span>
          </Link>
          <Link 
            to={createPageUrl('AdminPromoCodes') + '?action=new'}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-500 transition-colors text-center"
          >
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">New Promo Code</span>
          </Link>
          <Link 
            to={createPageUrl('AdminSellers') + '?action=new'}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-500 transition-colors text-center"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Seller</span>
          </Link>
        </div>

        {/* Recent Orders */}
        <RecentOrdersTable 
          orders={orders.slice(0, 10)} 
          onStatusChange={handleStatusChange}
        />
      </div>
    </AdminLayout>
  );
}