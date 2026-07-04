import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DollarSign, Users, Sparkles, Check, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPayouts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sellers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedBlogger, setSelectedBlogger] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['admin-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => base44.entities.Seller.list('-pending_payout'),
  });

  const { data: bloggers = [] } = useQuery({
    queryKey: ['admin-bloggers'],
    queryFn: () => base44.entities.Blogger.list('-balance_cents'),
  });

  const { data: referralLogs = [] } = useQuery({
    queryKey: ['admin-referral-logs'],
    queryFn: () => base44.entities.LookReferralLog.list('-created_date', 500),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-brief'],
    queryFn: () => base44.entities.Order.list('-created_date', 10000),
  });

  const { data: sellerPayouts = [] } = useQuery({
    queryKey: ['seller-payouts'],
    queryFn: () => base44.entities.SellerPayout.list('-payout_date')
  });

  const { data: bloggerPayouts = [] } = useQuery({
    queryKey: ['blogger-payouts'],
    queryFn: () => base44.entities.BloggerPayout.list('-payout_date')
  });

  const { data: payoutRequests = [] } = useQuery({
    queryKey: ['payout-requests'],
    queryFn: () => base44.entities.PayoutRequest.list('-created_date')
  });

  // Payout mutations
  const payoutSellerMutation = useMutation({
    mutationFn: async ({ sellerId, amount }) => {
      const seller = sellers.find(s => s.id === sellerId);
      if (!seller) throw new Error('Seller not found');
      
      // Create payout record
      await base44.entities.SellerPayout.create({
        seller_id: sellerId,
        amount: amount,
        payout_date: new Date().toISOString(),
        payment_method: 'Manual',
        notes: payoutNotes,
        paid_by: user?.email || 'admin'
      });
      
      return base44.entities.Seller.update(sellerId, {
        pending_payout: Math.max(0, (seller.pending_payout || 0) - amount),
        paid_out: (seller.paid_out || 0) + amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-payouts'] });
      setSelectedItem(null);
      setPayoutAmount('');
      setPayoutNotes('');
    },
  });

  const payoutBloggerMutation = useMutation({
    mutationFn: async ({ bloggerId, amountCents }) => {
      const blogger = bloggers.find(b => b.id === bloggerId);
      if (!blogger) throw new Error('Blogger not found');
      
      // Create payout record
      await base44.entities.BloggerPayout.create({
        blogger_id: bloggerId,
        amount: amountCents / 100,
        payout_date: new Date().toISOString(),
        payment_method: 'Manual',
        notes: payoutNotes,
        paid_by: user?.email || 'admin'
      });
      
      return base44.entities.Blogger.update(bloggerId, {
        balance_cents: Math.max(0, (blogger.balance_cents || 0) - amountCents),
        paid_out_cents: (blogger.paid_out_cents || 0) + amountCents,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
      queryClient.invalidateQueries({ queryKey: ['blogger-payouts'] });
      setSelectedItem(null);
      setPayoutAmount('');
      setPayoutNotes('');
    },
  });

  const markReferralPaidMutation = useMutation({
    mutationFn: ({ logId }) => base44.entities.LookReferralLog.update(logId, {
      status: 'paid',
      paid_date: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-referral-logs'] }),
  });

  // Payout request mutations
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, notes }) => {
      await base44.entities.PayoutRequest.update(requestId, {
        status: 'approved',
        admin_notes: notes,
        reviewed_by: user?.email || 'admin',
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setSelectedRequest(null);
      setAdminReviewNotes('');
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, notes }) => {
      await base44.entities.PayoutRequest.update(requestId, {
        status: 'rejected',
        admin_notes: notes,
        reviewed_by: user?.email || 'admin',
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setSelectedRequest(null);
      setAdminReviewNotes('');
    },
  });

  const completeRequestMutation = useMutation({
    mutationFn: async ({ requestId }) => {
      const request = payoutRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const seller = sellers.find(s => s.id === request.seller_id);
      if (!seller) throw new Error('Seller not found');

      // Create payout record
      await base44.entities.SellerPayout.create({
        seller_id: request.seller_id,
        amount: request.amount,
        payout_date: new Date().toISOString(),
        payment_method: 'Manual',
        notes: request.notes || 'From payout request',
        paid_by: user?.email || 'admin'
      });

      // Update seller
      await base44.entities.Seller.update(request.seller_id, {
        pending_payout: Math.max(0, (seller.pending_payout || 0) - request.amount),
        paid_out: (seller.paid_out || 0) + request.amount,
      });

      // Mark request as completed
      await base44.entities.PayoutRequest.update(requestId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-payouts'] });
      setSelectedRequest(null);
    },
  });

  // Calculate seller balances from paid orders
  const sellerBalances = {};
  orders.filter(o => o.payment_status === 'paid').forEach(order => {
    order.items?.forEach(item => {
      const sellerId = item.seller_id;
      if (!sellerId) return;
      
      if (!sellerBalances[sellerId]) {
        sellerBalances[sellerId] = { totalSales: 0, pending: 0, paidOut: 0 };
      }
      
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      sellerBalances[sellerId].totalSales += itemTotal;
      
      // Calculate seller's share
      if (item.is_look_source) {
        // Look-sourced: 75% to seller
        sellerBalances[sellerId].pending += itemTotal * 0.75;
      } else {
        // Regular: seller gets (100 - commission_rate)%
        const seller = sellers.find(s => s.id === sellerId);
        const commissionRate = seller?.commission_rate || 15;
        sellerBalances[sellerId].pending += itemTotal * (1 - commissionRate / 100);
      }
    });
  });
  
  // Subtract what's been paid out
  sellers.forEach(seller => {
    if (sellerBalances[seller.id]) {
      sellerBalances[seller.id].paidOut = seller.paid_out || 0;
      sellerBalances[seller.id].pending -= sellerBalances[seller.id].paidOut;
      sellerBalances[seller.id].pending = Math.max(0, sellerBalances[seller.id].pending);
    }
  });
  
  // Calculate totals
  const totalSellerPending = Object.values(sellerBalances).reduce((sum, s) => sum + s.pending, 0);
  const totalBloggerPending = bloggers.reduce((sum, b) => sum + (b.balance_cents || 0), 0) / 100;
  const totalCollected = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);

  const filteredSellers = sellers.filter(s =>
    !searchQuery || 
    s.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBloggers = bloggers.filter(b =>
    !searchQuery || 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayoutSeller = () => {
    const amount = parseFloat(payoutAmount);
    if (amount > 0 && selectedItem) {
      payoutSellerMutation.mutate({ sellerId: selectedItem.id, amount });
    }
  };

  const handlePayoutBlogger = () => {
    const amount = parseFloat(payoutAmount);
    if (amount > 0 && selectedItem) {
      payoutBloggerMutation.mutate({ bloggerId: selectedItem.id, amountCents: Math.round(amount * 100) });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts Management</h1>
          <p className="text-gray-500">Manage virtual balances and manual payouts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Collected (Stripe)</p>
                  <p className="text-2xl font-bold text-green-600">€{totalCollected.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Seller Pending</p>
                  <p className="text-2xl font-bold text-orange-600">€{totalSellerPending.toFixed(2)}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Blogger Pending</p>
                  <p className="text-2xl font-bold text-purple-600">€{totalBloggerPending.toFixed(2)}</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Platform Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{(totalCollected - totalSellerPending - totalBloggerPending).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="requests">
              Payout Requests ({payoutRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="sellers">Sellers ({sellers.length})</TabsTrigger>
            <TabsTrigger value="bloggers">Bloggers ({bloggers.length})</TabsTrigger>
            <TabsTrigger value="referrals">Look Referrals</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Payout Requests Tab */}
          <TabsContent value="requests" className="mt-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {payoutRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No payout requests yet
                      </td>
                    </tr>
                  ) : (
                    payoutRequests.map((request) => {
                      const seller = sellers.find(s => s.id === request.seller_id);
                      return (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {request.created_date ? format(new Date(request.created_date), 'MMM d, yyyy') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{seller?.brand_name}</p>
                              <p className="text-sm text-gray-500">{seller?.email}</p>
                            </div>
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
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setAdminReviewNotes('');
                                    }}
                                  >
                                    Review
                                  </Button>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => completeRequestMutation.mutate({ requestId: request.id })}
                                  disabled={completeRequestMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="mt-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {filteredSellers.map(seller => {
                    const balance = sellerBalances[seller.id] || { totalSales: 0, pending: 0, paidOut: 0 };
                    return (
                      <tr key={seller.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{seller.brand_name}</p>
                            <p className="text-sm text-gray-500">{seller.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">€{balance.totalSales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500">€{balance.paidOut.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${balance.pending > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                            €{balance.pending.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSeller(seller)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              History
                            </Button>
                            <Button
                              size="sm"
                              disabled={balance.pending <= 0}
                              onClick={() => {
                                setSelectedItem({ ...seller, type: 'seller', calculatedPending: balance.pending });
                                setPayoutAmount(balance.pending.toFixed(2));
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Bloggers Tab */}
          <TabsContent value="bloggers" className="mt-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blogger</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {filteredBloggers.map(blogger => (
                    <tr key={blogger.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {blogger.profile_image && (
                            <img src={blogger.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{blogger.name}</p>
                            <p className="text-sm text-gray-500">{blogger.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        €{((blogger.total_earnings_cents || 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        €{((blogger.paid_out_cents || 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${(blogger.balance_cents || 0) > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                          €{((blogger.balance_cents || 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{blogger.total_purchases || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBlogger(blogger)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            History
                          </Button>
                          <Button
                            size="sm"
                            disabled={(blogger.balance_cents || 0) <= 0}
                            onClick={() => {
                              setSelectedItem({ ...blogger, type: 'blogger' });
                              setPayoutAmount(((blogger.balance_cents || 0) / 100).toFixed(2));
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blogger (10%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform (15%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller (75%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {referralLogs.slice(0, 50).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.created_date ? format(new Date(log.created_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">#{log.order_id?.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-purple-600">{log.sku_new}</td>
                      <td className="px-4 py-3 text-sm">€{((log.amount_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-purple-600">€{((log.blogger_fee_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">€{((log.platform_fee_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-green-600">€{((log.seller_amount_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={log.status === 'paid' ? 'default' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payout Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Mark Payout as Paid - {selectedItem?.type === 'seller' ? selectedItem?.brand_name : selectedItem?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {selectedItem?.type === 'seller' 
                    ? `Pending balance: €${(selectedItem?.calculatedPending || 0).toFixed(2)}`
                    : `Pending balance: €${((selectedItem?.balance_cents || 0) / 100).toFixed(2)}`
                  }
                </p>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount to mark as paid"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>
              <Input
                placeholder="Notes (optional)"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This will deduct the amount from the pending balance and add it to paid out. 
                Make sure you have actually transferred the funds before marking as paid.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
              <Button 
                onClick={selectedItem?.type === 'seller' ? handlePayoutSeller : handlePayoutBlogger}
                disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seller Payout History Dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout History - {selectedSeller?.brand_name}</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Earned</p>
                  <p className="text-lg font-bold">€{(selectedSeller.total_sales || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Paid Out</p>
                  <p className="text-lg font-bold text-gray-600">€{(selectedSeller.paid_out || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Pending</p>
                  <p className="text-lg font-bold text-green-600">€{(selectedSeller.pending_payout || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sellerPayouts.filter(p => p.seller_id === selectedSeller.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No payout history
                        </td>
                      </tr>
                    ) : (
                      sellerPayouts.filter(p => p.seller_id === selectedSeller.id).map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-4 py-2 text-sm">
                            {payout.payout_date ? format(new Date(payout.payout_date), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-green-600">
                            €{payout.amount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm">{payout.payment_method || '-'}</td>
                          <td className="px-4 py-2 text-sm">{payout.paid_by || 'Admin'}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{payout.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Blogger Payout History Dialog */}
      <Dialog open={!!selectedBlogger} onOpenChange={() => setSelectedBlogger(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout History - {selectedBlogger?.name}</DialogTitle>
          </DialogHeader>
          {selectedBlogger && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Earned</p>
                  <p className="text-lg font-bold">€{((selectedBlogger.total_earnings_cents || 0) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Paid Out</p>
                  <p className="text-lg font-bold text-gray-600">€{((selectedBlogger.paid_out_cents || 0) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Pending</p>
                  <p className="text-lg font-bold text-green-600">€{((selectedBlogger.balance_cents || 0) / 100).toFixed(2)}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bloggerPayouts.filter(p => p.blogger_id === selectedBlogger.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No payout history
                        </td>
                      </tr>
                    ) : (
                      bloggerPayouts.filter(p => p.blogger_id === selectedBlogger.id).map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-4 py-2 text-sm">
                            {payout.payout_date ? format(new Date(payout.payout_date), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-green-600">
                            €{payout.amount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm">{payout.payment_method || '-'}</td>
                          <td className="px-4 py-2 text-sm">{payout.paid_by || 'Admin'}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{payout.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payout Request Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Payout Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Seller</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {sellers.find(s => s.id === selectedRequest.seller_id)?.brand_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Requested Amount</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      €{selectedRequest.amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Seller Notes</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded mt-1">
                  {selectedRequest.notes || 'No notes provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Admin Response (Optional)</label>
                <textarea
                  placeholder="Add notes for the seller..."
                  value={adminReviewNotes}
                  onChange={(e) => setAdminReviewNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-red-600"
              onClick={() => rejectRequestMutation.mutate({
                requestId: selectedRequest.id,
                notes: adminReviewNotes
              })}
              disabled={rejectRequestMutation.isPending}
            >
              Reject
            </Button>
            <Button
              onClick={() => approveRequestMutation.mutate({
                requestId: selectedRequest.id,
                notes: adminReviewNotes
              })}
              disabled={approveRequestMutation.isPending}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}