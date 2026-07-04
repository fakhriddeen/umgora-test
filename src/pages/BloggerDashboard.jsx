import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Eye, DollarSign, ShoppingBag, TrendingUp, Copy, Check,
  ExternalLink, Sparkles, Image as ImageIcon, Plus, Pencil, Trash2, Upload, X, Search
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BloggerDashboard() {
  const queryClient = useQueryClient();
  const [copiedLookId, setCopiedLookId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLook, setEditingLook] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Find blogger profile matching user email
  const { data: blogger, isLoading: bloggerLoading } = useQuery({
    queryKey: ['blogger-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const bloggers = await base44.entities.Blogger.list();
      const found = bloggers.find(b => b.email?.toLowerCase() === user.email.toLowerCase());
      return found && found.status === 'active' ? found : null;
    },
    enabled: !!user?.email
  });

  // Fetch looks created by this blogger
  const { data: looks = [] } = useQuery({
    queryKey: ['blogger-looks', blogger?.id],
    queryFn: async () => {
      if (!blogger?.id) return [];
      return await base44.entities.Look.filter({ blogger_id: blogger.id }, '-created_date');
    },
    enabled: !!blogger?.id
  });

  // Fetch referral logs for this blogger
  const { data: referralLogs = [] } = useQuery({
    queryKey: ['blogger-referrals', blogger?.id],
    queryFn: async () => {
      if (!blogger?.id) return [];
      return await base44.entities.LookReferralLog.filter({ blogger_id: blogger.id }, '-created_date');
    },
    enabled: !!blogger?.id
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products-referrals'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Fetch all products for look creation
  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  const deleteLookMutation = useMutation({
    mutationFn: (id) => base44.entities.Look.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogger-looks'] })
  });

  const handleEditLook = (look) => {
    setEditingLook(look);
    setIsFormOpen(true);
  };

  const handleCreateLook = () => {
    setEditingLook(null);
    setIsFormOpen(true);
  };

  const copyLookLink = (lookId) => {
    const url = `${window.location.origin}/LookDetail?id=${lookId}&ref=${blogger?.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLookId(lookId);
    setTimeout(() => setCopiedLookId(null), 2000);
  };

  // Calculate metrics
  const totalViews = looks.reduce((sum, look) => sum + (look.views || 0), 0);
  const totalClicks = looks.reduce((sum, look) => sum + (look.clicks || 0), 0);
  const totalPurchases = blogger?.total_purchases || 0;
  const totalEarnings = (blogger?.total_earnings_cents || 0) / 100;
  const currentBalance = (blogger?.balance_cents || 0) / 100;

  // Chart data - last 7 days earnings
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = referralLogs.filter(log => 
      log.created_date?.startsWith(dateStr)
    );
    const earnings = dayLogs.reduce((sum, log) => sum + (log.blogger_fee_cents || 0), 0) / 100;
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      earnings
    };
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Please login to access your dashboard
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (bloggerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E]" />
      </div>
    );
  }

  if (!blogger) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sparkles className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need an active blogger account to access this dashboard.
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {blogger.profile_image && (
              <img 
                src={blogger.profile_image} 
                alt={blogger.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-light text-gray-900 dark:text-white">
                Welcome, {blogger.name}
              </h1>
              <p className="text-gray-500">{blogger.instagram_handle && `@${blogger.instagram_handle}`}</p>
              <Link 
                to={createPageUrl('BloggerProfile') + '?id=' + blogger?.id}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                View Public Profile
              </Link>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            {blogger.commission_rate || 10}% Commission Rate
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Purchases</p>
                  <p className="text-2xl font-bold">{totalPurchases}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-bold">€{totalEarnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#C9A96E]/10 to-[#C9A96E]/5 border-[#C9A96E]/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-2xl font-bold text-[#C9A96E]">€{currentBalance.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#C9A96E] opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="looks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="looks">My Looks</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* Looks Tab */}
          <TabsContent value="looks">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Looks</h2>
              <Button onClick={handleCreateLook}>
                <Plus className="h-4 w-4 mr-2" />
                Create Look
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {looks.length === 0 ? (
                <div className="col-span-full text-center py-12 border-2 border-dashed dark:border-gray-700 rounded-xl">
                  <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No looks created yet</p>
                  <Button onClick={handleCreateLook}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Look
                  </Button>
                </div>
              ) : (
                looks.map(look => (
                  <Card key={look.id} className="overflow-hidden group">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 relative">
                      {look.images?.[0] && (
                        <img 
                          src={look.images[0]} 
                          alt={look.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant={look.is_active ? 'default' : 'secondary'}>
                          {look.is_active ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      {/* Edit/Delete overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleEditLook(look)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8"
                          onClick={() => {
                            if (confirm('Delete this look?')) deleteLookMutation.mutate(look.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {look.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {look.product_ids?.length || 0} products
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {look.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          {look.purchases || 0}
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          €{((look.revenue_cents || 0) / 100 * 0.1).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => copyLookLink(look.id)}
                        >
                          {copiedLookId === look.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Link
                            </>
                          )}
                        </Button>
                        <Link to={createPageUrl('LookDetail') + `?id=${look.id}&ref=${blogger.id}`}>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <BloggerProfileEdit blogger={blogger} />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                      <Line 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="#C9A96E" 
                        strokeWidth={2}
                        dot={{ fill: '#C9A96E' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Referrals */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralLogs.slice(0, 10).map(log => {
                    const product = allProducts.find(p => p.id === log.product_id);
                    return (
                      <div key={log.id} className="flex items-center gap-3 py-2 border-b dark:border-gray-800 last:border-0">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-12 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product?.title_en || 'Product'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Order #{log.order_id?.slice(-8)} • SKU: {log.sku_new}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +€{((log.blogger_fee_cents || 0) / 100).toFixed(2)}
                          </p>
                          <Badge variant={log.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {referralLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No referrals yet. Share your Look links to start earning!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Balance Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">Total Earned</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        €{((blogger?.total_earnings_cents || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">Already Paid</p>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        €{((blogger?.paid_out_cents || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/10 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-[#C9A96E]">€{currentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Commission Info */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">How It Works</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• You earn <strong>10% commission</strong> on every product purchased through your Look links</li>
                      <li>• When a customer buys from your Look, the SKU is versioned for tracking (e.g., SA-144 → SA-144-L001)</li>
                      <li>• Your earnings are tracked in real-time and shown above</li>
                      <li>• Payouts are processed manually by admin upon request</li>
                    </ul>
                  </div>
                  
                  {/* Manual Payout Notice */}
                  <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Request a payout:</strong> Contact support with your payment details to receive your earnings. 
                      All payouts are processed manually by the admin team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Look Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingLook ? 'Edit Look' : 'Create New Look'}</DialogTitle>
            </DialogHeader>
            <BloggerLookForm
              look={editingLook}
              bloggerId={blogger.id}
              products={products}
              onClose={() => {
                setIsFormOpen(false);
                setEditingLook(null);
              }}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['blogger-looks'] });
                setIsFormOpen(false);
                setEditingLook(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Blogger Profile Edit Component
function BloggerProfileEdit({ blogger }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(blogger?.name || '');
  const [bio, setBio] = useState(blogger?.bio || '');
  const [instagramHandle, setInstagramHandle] = useState(blogger?.instagram_handle || '');
  const [profileImage, setProfileImage] = useState(blogger?.profile_image || '');
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Blogger.update(blogger.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogger-profile'] });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileImage(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name,
      bio,
      instagram_handle: instagramHandle,
      profile_image: profileImage
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <div>
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4 mt-2">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center border-4 border-gray-200 dark:border-gray-800">
                <Sparkles className="h-12 w-12 text-[var(--color-primary)]" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Change Photo'}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Square image, at least 400x400px
              </p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <Label>Display Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />
          <p className="text-xs text-gray-500 mt-1">
            This name will appear on your public profile and all your looks
          </p>
        </div>

        {/* Bio */}
        <div>
          <Label>Bio</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Brief description for your public profile (optional)
          </p>
        </div>

        {/* Instagram Handle */}
        <div>
          <Label>Instagram Handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">@</span>
            <Input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
              placeholder="username"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your Instagram username (without @)
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
          <Button
            onClick={handleSave}
            disabled={!name || updateMutation.isPending}
            className="bg-[#C9A96E] hover:bg-[#B8986D]"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          {updateMutation.isSuccess && (
            <Badge variant="default" className="self-center bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Saved!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Blogger Look Form Component
function BloggerLookForm({ look, bloggerId, products, onClose, onSuccess }) {
  const [title, setTitle] = useState(look?.title || '');
  const [description, setDescription] = useState(look?.description || '');
  const [images, setImages] = useState(look?.images || []);
  const [tags, setTags] = useState(look?.tags?.join(', ') || '');
  const [selectedProducts, setSelectedProducts] = useState(look?.product_ids || []);
  const [isActive, setIsActive] = useState(look?.is_active ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        description,
        images,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        product_ids: selectedProducts,
        blogger_id: bloggerId,
        is_active: isActive,
        sort_order: look?.sort_order ?? 0
      };

      if (look) {
        return base44.entities.Look.update(look.id, data);
      } else {
        return base44.entities.Look.create(data);
      }
    },
    onSuccess
  });

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });
      const newUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const [moved] = newImages.splice(index, 1);
      newImages.unshift(moved);
      return newImages;
    });
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Search by name or SKU
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.title_en?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Vibes Look"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="published" />
          <Label htmlFor="published">Publish immediately</Label>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this look..."
          rows={2}
        />
      </div>

      <div>
        <Label>Tags (comma separated)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="summer, casual, beach"
        />
      </div>

      <div>
        <Label>Images * (first is main)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className={`w-20 h-24 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden ${idx === 0 ? 'ring-2 ring-[#C9A96E]' : ''}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx !== 0 && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setMainImage(idx)}>
                    ★
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => removeImage(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {idx === 0 && (
                <Badge className="absolute -top-1 -left-1 text-[10px] px-1 bg-[#C9A96E]">Main</Badge>
              )}
            </div>
          ))}
          <label className="w-20 h-24 border-2 border-dashed dark:border-gray-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#C9A96E] transition-colors">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
        {isUploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>

      <div className="flex-1 min-h-0">
        <Label>Select Products by SKU * ({selectedProducts.length} selected)</Label>
        <div className="relative mt-2 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="h-48 border dark:border-gray-800 rounded-lg">
          <div className="p-2 space-y-1">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedProducts.includes(product.id) ? 'bg-[#C9A96E]/10 border border-[#C9A96E]/30' : ''
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <div className="w-10 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.title_en}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">€{product.price?.toFixed(2)}</p>
                    {product.sku && (
                      <span className="text-xs text-[#C9A96E] font-mono bg-[#C9A96E]/10 px-1.5 py-0.5 rounded">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 py-4">No products found</p>
            )}
          </div>
        </ScrollArea>
        <p className="text-xs text-gray-500 mt-1">
          Products are linked by SKU. When customers buy through your Look, you earn 10% commission.
        </p>
      </div>

      <DialogFooter className="pt-4 border-t dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!title || images.length === 0 || selectedProducts.length === 0 || saveMutation.isPending}
          className="bg-[#C9A96E] hover:bg-[#B8986D]"
        >
          {saveMutation.isPending ? 'Saving...' : look ? 'Update Look' : 'Create Look'}
        </Button>
      </DialogFooter>
    </div>
  );
}